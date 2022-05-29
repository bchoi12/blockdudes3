package main

import (
	"github.com/gorilla/websocket"
	"log"
	"time"
)

const (
	isWasm bool = false
)

// Incoming client message to parse
type IncomingMsg struct {
	b []byte
	client *Client
}

// Parsed message, only one struct will be set
type Msg struct {
	T MessageType
	Ping PingMsg
	JSON interface{}
	JSONPeer JSONPeerMsg
	Chat ChatMsg
	Key KeyMsg
	Join ClientMsg
	Left ClientMsg
}

type Room struct {
	id string

	nextClientId IdType
	clients map[IdType]*Client
	msgQueue []IncomingMsg

	game *Game
	chat *Chat

	incoming chan IncomingMsg
	ticker *time.Ticker
	gameTicks int
	statTicker *time.Ticker
	register chan *Client
	unregister chan *Client
}

var rooms = make(map[string]*Room)

func createOrJoinRoom(room string, name string, ws *websocket.Conn) {
	if _, ok := rooms[room]; !ok {
		rooms[room] = &Room {
			id: room,

			nextClientId: 0,
			clients: make(map[IdType]*Client),
			msgQueue: make([]IncomingMsg, 0),

			game: newGame(),
			chat: newChat(),

			incoming: make(chan IncomingMsg),
			ticker: time.NewTicker(frameTime),
			gameTicks: 0,
			statTicker: time.NewTicker(1 * time.Second),
			register: make(chan *Client),
			unregister: make(chan *Client),
		}

		rooms[room].game.loadLevel(testLevel)
		log.Printf("Created new room %s", room)


		go rooms[room].run()
	}

	client := NewClient(rooms[room], ws, name)
	rooms[room].register <- client
}

func (r *Room) run() {
	defer func() {
		log.Printf("Deleting room %v", r.id)
		delete(rooms, r.id)
	}()

	for {
		select {
			case client := <-r.register:
				client.initWebRTC()
				r.clients[client.id] = client
				err := r.addClient(client)
				if err != nil {
					log.Printf("Failed to add client %s to room: %v", client.getDisplayName(), err)
					delete(r.clients, client.id)
					continue
				}
				log.Printf("New client %s joined %s, total=%d", client.getDisplayName(), r.id, len(r.clients))
			case client := <-r.unregister:
				err := r.deleteClient(client)
				if err != nil {
					log.Printf("Failed to delete client %s from %s: %v", client.getDisplayName(), r.id, err)
				} else if len(r.clients) == 0 {
					return
				}
			case imsg := <-r.incoming:
				r.msgQueue = append(r.msgQueue, imsg)
			case _ = <-r.ticker.C:
				r.game.updateState()
				r.sendState()
				r.gameTicks += 1
			case _ = <-r.statTicker.C:
				log.Printf("FPS: %d", r.gameTicks)
				r.gameTicks = 0
			default:
				if len(r.msgQueue) == 0 {
					continue
				}
				for _, imsg := range(r.msgQueue) {
					msg := Msg{}
					err := Unpack(imsg.b, &msg)
					if err != nil {
						log.Printf("error unpacking: %v", err)
						continue
					}
					r.processMsg(msg, imsg.client)
				}
				r.msgQueue = r.msgQueue[:0]
		}
	}
}

func (r* Room) processMsg(msg Msg, c* Client) {
	var err error

	switch(msg.T) {
	case pingType:
		outMsg := PingMsg {
			T: pingType,
			S: msg.Ping.S,
		}
		c.send(&outMsg)
	case offerType:
		err = c.processWebRTCOffer(msg.JSON)
	case candidateType:
		err = c.processWebRTCCandidate(msg.JSON)
	case joinVoiceType:
		err = r.joinVoice(c)
	case leftVoiceType:
		err = r.leaveVoice(c)
	case voiceCandidateType: fallthrough
	case voiceOfferType: fallthrough
	case voiceAnswerType:
		err = r.forwardVoiceMessage(msg.T, c, msg.JSONPeer)
	case chatType:
		outMsg := r.chat.processChatMsg(c, msg.Chat)
		r.send(&outMsg)
	case keyType:
		r.game.processKeyMsg(c.id, msg.Key)
	default:
		log.Printf("Unknown message type %d", msg.T)
	}

	if err != nil {
		log.Printf("error when parsing message: %v", err)
		return
	}
}

// Add client to room
func (r *Room) addClient(c *Client) error {
	var err error

	if err != nil {
		return err
	}

	err = r.updateClients(initType, c)
	if err != nil {
		return err
	}

	playerInitMsg := r.game.createPlayerInitMsg(c.id)
	err = c.send(&playerInitMsg)
	if err != nil {
		return err
	}

	levelMsg := r.game.createLevelInitMsg()
	err = c.send(&levelMsg)
	if err != nil {
		return err
	}

	for _, chatMsg := range(r.chat.chatQueue) {
		c.send(&chatMsg)
	}

	err = r.updateClients(joinType, c)
	if err != nil {
		return err
	}

	r.game.add(NewInit(Id(playerSpace, c.id), NewInitData(NewVec2(5, 5), NewVec2(0.8, 1.44))))
	gameInitMsg := r.game.createGameInitMsg()
	c.send(&gameInitMsg)
	return nil
}

func (r *Room) deleteClient(c *Client) error {
	if _, ok := r.clients[c.id]; ok {
		err := r.updateClients(leftType, c)
		if err != nil {
			return err
		}
		r.game.delete(Id(playerSpace, c.id))
		delete(r.clients, c.id)
		log.Printf("Unregistering client %s, total=%d", c.getDisplayName(), len(r.clients))
	}
	return nil
}

func (r *Room) updateClients(msgType MessageType, c *Client) error {
	msg := r.createClientMsg(msgType, c, false)

	if msgType == initType {
		return c.send(&msg)
	} else {
		r.send(&msg)
		return nil
	}
}

func (r *Room) createClientMsg(msgType MessageType, c *Client, voice bool) ClientMsg {
	msg := ClientMsg {
		T: msgType,
		Client: c.getClientData(),
		Clients: make(map[IdType]ClientData, 0),
	}
	for id, client := range r.clients {
		if (msgType == leftType && id == c.id) || (voice && !client.voice) {
			continue
		}
		msg.Clients[id] = client.getClientData()
	}
	return msg
}

func (r *Room) sendState() {
	state := r.game.createObjectStateMsg()
	r.sendUDP(&state)

	if updates, ok := r.game.createGameUpdateMsg(); ok {
		r.send(&updates)
	}
}

func (r *Room) send(msg interface{}) {
	b := Pack(msg)
	for _, c := range(r.clients) {
		c.sendBytes(b)
	}
}

func (r *Room) sendUDP(msg interface{}) {
	b := Pack(msg)
	for _, c := range(r.clients) {
		c.dc.Send(b)
	}
}