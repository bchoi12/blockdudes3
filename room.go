package main

import (
	"fmt"
	"github.com/gorilla/websocket"
	"log"
	"strconv"
	"strings"
	"time"
)

const (
	isWasm bool = false
)

type Room struct {
	name string

	nextClientId IdType
	clients map[IdType]*Client
	register chan *Client
	registerQueue []*Client
	init chan *Client
	initQueue []*Client
	unregister chan *Client
	unregisterQueue []*Client

	deleteTimer Timer

	game *Game
	ticker *time.Ticker
	gameTicks int
	statTicker *time.Ticker

	chat *Chat

	incoming chan IncomingMsg
	incomingQueue []IncomingMsg
}

var rooms = make(map[string]*Room)
func CreateOrJoinRoom(vars map[string]string, ws *websocket.Conn) {
	roomName := vars["room"]
	_, roomExists := rooms[roomName]

	if !roomExists {
		rooms[roomName] = &Room {
			name: roomName,

			nextClientId: 0,
			clients: make(map[IdType]*Client),
			register: make(chan *Client),
			registerQueue: make([]*Client, 0),
			init: make(chan *Client),
			initQueue: make([]*Client, 0),
			unregister: make(chan *Client),
			unregisterQueue: make([]*Client, 0),
			deleteTimer: NewTimer(30 * time.Second),

			game: NewGame(),
			ticker: time.NewTicker(frameTime),
			gameTicks: 0,
			statTicker: time.NewTicker(1 * time.Second),

			chat: NewChat(),

			incoming: make(chan IncomingMsg),
			incomingQueue: make([]IncomingMsg, 0),
		}
		rooms[roomName].print("created room")

		rooms[roomName].game.LoadLevel(testLevel)
		go rooms[roomName].run()
	}

	r := rooms[roomName]
	clientId := r.nextClientId
	if stringId, idOk := vars["id"]; idOk {
		intId, err := strconv.Atoi(stringId)
		if err == nil {
			id := IdType(intId)
			if _, ok := r.clients[id]; !ok && id < r.nextClientId {
				clientId = id
			}
		}
	}

	client := NewClient(r, ws, vars["name"], clientId)
	if clientId >= r.nextClientId {
		r.nextClientId = clientId + 1
	}
	r.register <- client
}

func (r *Room) run() {
	defer func() {
		r.print("deleted room")
		delete(rooms, r.name)
	}()

	for {
		select {
		case client := <-r.register:
			r.registerQueue = append(r.registerQueue, client)
		case client := <-r.init:
			r.initQueue = append(r.initQueue, client)
		case client := <-r.unregister:
			r.unregisterQueue = append(r.unregisterQueue, client)
		case imsg := <-r.incoming:
			r.incomingQueue = append(r.incomingQueue, imsg)
		case _ = <-r.ticker.C:
			r.game.Update()
			r.sendGameState()
			r.gameTicks += 1
		case _ = <-r.statTicker.C:
			if len(r.clients) == 0 {
				continue
			}
			if r.gameTicks < 60 {
				r.print(fmt.Sprintf("slow FPS: %d", r.gameTicks))
			}
			r.gameTicks = 0
		default:
			if len(r.registerQueue) > 0 {
				for _, client := range(r.registerQueue) {
					err := r.registerClient(client)
					if err != nil {
						r.unregister <- client
					}
				}
				r.registerQueue = r.registerQueue[:0]
			}

			if len(r.initQueue) > 0 {
				for _, client := range(r.initQueue) {
					err := r.initClient(client)
					if err != nil {
						r.unregister <- client
					}
				}
				r.initQueue = r.initQueue[:0]
			}

			if len(r.unregisterQueue) > 0 {
				for _, client := range(r.unregisterQueue) {
					r.unregisterClient(client)
				}
				r.unregisterQueue = r.unregisterQueue[:0]
			}

			if len(r.clients) == 0 {
				if !r.deleteTimer.Started() {
					r.print("started countdown to delete room")
					r.deleteTimer.Start()
				}

				if r.deleteTimer.Finished() {
					return
				}
			} else if r.deleteTimer.Started() {
				r.print("stopping deletion due to reconnect")
				r.deleteTimer.Stop()
			}

			if len(r.incomingQueue) > 0 {
				for _, imsg := range(r.incomingQueue) {
					msg := Msg{}
					err := Unpack(imsg.b, &msg)
					if err != nil {
						r.print(fmt.Sprintf("unpacking error: %v", err))
						continue
					}
					r.processMsg(msg, imsg.client)
				}
				r.incomingQueue = r.incomingQueue[:0]
			}
		}
	}
}

func (r *Room) registerClient(client *Client) error {
	err := client.InitWebRTC(func() {
		r.init <- client
	})
	if err != nil {
		return err
	}
	return r.updateClients(initType, client)
}

func (r *Room) initClient(client *Client) error {
	var err error

	r.clients[client.id] = client

	err = r.updateClients(joinType, client)
	if err != nil {
		return err
	}

	levelMsg := r.game.createLevelInitMsg()
	client.Send(&levelMsg)
	if err != nil {
		return err
	}

	playerId := Id(playerSpace, client.id)
	if !r.game.Has(playerId) {
		player := r.game.Add(NewInit(playerId, NewVec2(0, 0), NewVec2(0.8, 1.44))).(*Player)

		player.SetInitProp(nameProp, client.GetDisplayName())
		player.SetTeam(0, r.game.GetGrid())
		player.Respawn()
	} else {
		player := r.game.Get(playerId)
		player.RemoveTTL()
		r.print(fmt.Sprintf("%s reconnected", client.GetDisplayName()))
	}
	playerInitMsg := r.game.createPlayerInitMsg(client.id)
	err = client.Send(&playerInitMsg)
	if err != nil {
		return err
	}

	objectInitMsg := r.game.createObjectInitMsg()
	err = client.Send(&objectInitMsg)
	if err != nil {
		return err
	}

	for _, chatMsg := range(r.chat.chatQueue) {
		client.Send(&chatMsg)
	}

	r.print(fmt.Sprintf("%s joined, total clients = %d", client.GetDisplayName(), len(r.clients)))
	return nil
}

func (r *Room) unregisterClient(client *Client) error {
	client.Close()
	if _, ok := r.clients[client.id]; ok {
		err := r.updateClients(leftType, client)
		if err != nil {
			return err
		}
		delete(r.clients, client.id)

		player := r.game.Get(Id(playerSpace, client.id))
		if player != nil {
			player.SetTTL(20 * time.Second)
		}
	}
	r.print(fmt.Sprintf("unregistered %s, total=%d", client.GetDisplayName(), len(r.clients)))
	return nil
}

func (r* Room) processMsg(msg Msg, c* Client) error {
	var err error

	switch(msg.T) {
	case pingType:
		outMsg := PingMsg {
			T: pingType,
			S: msg.Ping.S,
		}
		c.Send(&outMsg)
	case offerType:
		err = c.processWebRTCOffer(msg.JSON)
	case candidateType:
		err = c.processWebRTCCandidate(msg.JSON)
	case joinVoiceType:
		err = r.addVoiceClient(c)
	case leftVoiceType:
		err = r.removeVoiceClient(c)
	case voiceCandidateType: fallthrough
	case voiceOfferType: fallthrough
	case voiceAnswerType:
		err = r.forwardVoiceMessage(msg.T, c, msg.JSONPeer)
	case chatType:
		outMsg := r.chat.ProcessChatMsg(c, msg.Chat)
		r.send(&outMsg)
	case keyType:
		r.game.ProcessKeyMsg(c.id, msg.Key)
	default:
		r.print(fmt.Sprintf("unknown message type %d", msg.T))
	}

	if err != nil {
		r.print(fmt.Sprintf("error when processing message: %v", err))
	}
	return err
}

func (r *Room) updateClients(msgType MessageType, client *Client) error {
	msg := r.createClientMsg(msgType, client, false)

	if msgType == initType {
		return client.Send(&msg)
	} else {
		r.send(&msg)
		return nil
	}
}

func (r *Room) createClientMsg(msgType MessageType, c *Client, voice bool) ClientMsg {
	msg := ClientMsg {
		T: msgType,
		Client: c.GetClientData(),
		Clients: make(map[IdType]ClientData, 0),
	}
	for id, client := range r.clients {
		if (msgType == leftType && id == c.id) || (voice && !client.voice) {
			continue
		}
		msg.Clients[id] = client.GetClientData()
	}
	return msg
}

func (r *Room) addVoiceClient(c *Client) error {
	msg := r.createClientMsg(joinVoiceType, c, true)
	r.send(&msg)
	c.voice = true
	return nil
}

func (r *Room) removeVoiceClient(c *Client) error {
	msg := r.createClientMsg(leftVoiceType, c, true)
	r.send(&msg)
	c.voice = false
	return nil
}

func (r *Room) forwardVoiceMessage(msgType MessageType, c *Client, msg JSONPeerMsg) error {
	outMsg := JSONPeerMsg {
		T: msgType,
		From: c.id,
		To: msg.To,
		JSON: msg.JSON,
	}

	id := msg.To
	client := r.clients[msg.To]

	if !client.voice || c.id == id {
		return nil
	}

	return client.Send(&outMsg)
}

func (r *Room) send(msg interface{}) {
	b := Pack(msg)
	for _, c := range(r.clients) {
		c.SendBytes(b)
	}
}

func (r *Room) sendGameState() {
	state := r.game.createObjectDataMsg()
	r.sendUDP(&state)

	if updates, ok := r.game.createObjectUpdateMsg(); ok {
		r.send(&updates)
	}
}

func (r *Room) sendUDP(msg interface{}) {
	b := Pack(msg)
	for _, c := range(r.clients) {
		c.SendBytesUDP(b)
	}
}

func (r Room) print(message string) {
   	var sb strings.Builder
   	sb.WriteString(r.name)
   	sb.WriteString(": ")
   	sb.WriteString(message)
	log.Printf(sb.String())
}