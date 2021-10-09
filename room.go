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
	T int
	Ping PingMsg
	JSON interface{}
	Chat ChatMsg
	Key KeyMsg
	Join ClientMsg
	Left ClientMsg
}

type Room struct {
	id string

	nextClientId int
	clients map[int]*Client
	msgQueue []IncomingMsg

	game *Game
	chat *Chat

	incoming chan IncomingMsg
	ticker *time.Ticker
	register chan *Client
	unregister chan *Client
}

var rooms = make(map[string]*Room)

func createOrJoinRoom(room string, name string, ws *websocket.Conn) {
	if _, ok := rooms[room]; !ok {
		rooms[room] = &Room {
			id: room,

			nextClientId: 0,
			clients: make(map[int]*Client),
			msgQueue: make([]IncomingMsg, 0),

			game: newGame(),
			chat: newChat(),

			incoming: make(chan IncomingMsg),
			ticker: time.NewTicker(frameTime),
			register: make(chan *Client),
			unregister: make(chan *Client),
		}

		rooms[room].game.loadTestMap()

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
					log.Printf("Failed to add client to room: %v", err)
					delete(r.clients, client.id)
					continue
				}
				log.Printf("New client for %s, %d total", r.id, len(r.clients))
			case client := <-r.unregister:
				err := r.deleteClient(client)
				if err != nil {
					log.Printf("Failed to delete client %d from %s: %v", client.id, r.id, err)
				} else if len(r.clients) == 0 {
					return
				}
			case imsg := <-r.incoming:
				r.msgQueue = append(r.msgQueue, imsg)
			case _ = <-r.ticker.C:
				r.game.updateState()
				r.sendState()
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
		}
		c.send(&outMsg)
	case offerType:
		err = c.processWebRTCOffer(msg.JSON)
	case candidateType:
		err = c.processWebRTCCandidate(msg.JSON)
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

	playerInitMsg := r.game.createPlayerInitMsg()
	err = c.send(&playerInitMsg)
	if err != nil {
		return err
	}

	objectMsg := r.game.createObjectInitMsg()
	err = c.send(&objectMsg)
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

	r.game.addPlayer(c.id, PlayerInitData {
		Pos: NewVec2(0, 0),
		Dim: NewVec2(1.0, 1.0),
	})
	playerJoinMsg := r.game.createPlayerJoinMsg(c.id)
	r.send(&playerJoinMsg)

	return nil
}

func (r *Room) deleteClient(c *Client) error {
	if _, ok := r.clients[c.id]; ok {
		err := r.updateClients(leftType, c)
		if err != nil {
			return err
		}
		r.game.deletePlayer(c.id)
		delete(r.clients, c.id)
		log.Printf("Unregistering client %d total", len(r.clients))
	}
	return nil
}

func (r *Room) updateClients(msgType int, c *Client) error {
	msg := ClientMsg {
		T: msgType,
		Id: c.id,
		C: ClientData {
			N: c.name,
		},
		Cs: make(map[int]ClientData, 0),
	}
	for id, client := range r.clients {
		if msgType == leftType && id == c.id {
			continue
		}
		msg.Cs[id] = ClientData {N: client.name}
	}

	if msgType == initType {
		return c.send(&msg)
	} else {
		r.send(&msg)
		return nil
	}
}

func (r* Room) sendState() {
	msg := r.game.createGameStateMsg()
	r.sendUDP(&msg)
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