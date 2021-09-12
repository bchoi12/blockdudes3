package main

import (
	"github.com/gorilla/websocket"
	"github.com/vmihailenco/msgpack/v5"
	"log"
	"time"
)

const (
	maxChatMsgs int = 50

	fps int = 40
	frame float64 = 1.0 / float64(fps)
	frameTime time.Duration = 25 * time.Millisecond

	initType int = 1
	joinType int = 5
	leftType int = 6
	chatType int = 2
	keyType int = 3
	stateType int = 4

	upKey int = 1
	downKey int = 2
	leftKey int = 3
	rightKey int = 4
)

type ClientMsg struct {
	T int
	Id int
	C ClientData
	Ids []int
	Cs map[int]ClientData
}

type ClientData struct {
	N string
}

// output only
type StateMsg struct {
	T int
	P []PData
}

type ChatMsg struct {
	T int
	N string
	M string // message
}

type KeyMsg struct {
	T int
	K []int // keys
}

// Incoming client message to parse into
type Msg struct {
	//	_msgpack struct{} `msgpack:",omitempty"`
	T int
	Chat ChatMsg
	Key KeyMsg
	Join ClientMsg
	Left ClientMsg
}


type Room struct {
	id string

	clients map[*Client]bool
	nextClientId int
	chatQueue []ChatMsg

	incoming chan IncomingMsg
	ticker *time.Ticker
	register chan *Client
	unregister chan *Client
}

type IncomingMsg struct {
	b []byte
	client *Client
}

var rooms = make(map[string]*Room)

func createOrJoinRoom(roomId string, name string, ws *websocket.Conn) {
	if rooms[roomId] == nil {
		rooms[roomId] = &Room {
			id: roomId,
			clients: make(map[*Client]bool),
			nextClientId: 0,
			chatQueue: make([]ChatMsg, 0),

			incoming: make(chan IncomingMsg),
			ticker: time.NewTicker(frameTime),
			register: make(chan *Client),
			unregister: make(chan *Client),
		}

		go rooms[roomId].run()
	}

	client := &Client {
		room: rooms[roomId],
		ws: ws,

		name: name,
		id: rooms[roomId].getClientId(),
		keys: make(map[int]bool, 0),
	}
	rooms[roomId].register <- client
}

func (r *Room) run() {
	defer func() {
		log.Printf("Deleting room %v", r.id)
		delete(rooms, r.id)
	}()

	for {
		select {
			case client := <-r.register:
				client.init(r)
				r.sendJoin(client)
				log.Printf("New client, %d total", len(r.clients))
			case client := <-r.unregister:
				if _, ok := r.clients[client]; ok {
					delete(r.clients, client)
				}
				log.Printf("Unregistering client %d total", len(r.clients))
				if len(r.clients) == 0 {
					return
				}
				r.sendLeft(client)
			case cmsg := <-r.incoming:
				msg := Msg{}
				err := msgpack.Unmarshal(cmsg.b, &msg)
				if err != nil {
					log.Printf("error unpacking data %v", err)
					continue
				}

				log.Printf("Parsed message: %+v", msg)
				r.processMsg(msg, cmsg.client)
			case _ = <-r.ticker.C:
				r.updateState()
				r.sendState()
		}
	}
}

func (r* Room) processMsg(msg Msg, c* Client) {
	var b []byte
	var err error

	switch(msg.T) {
	case chatType:
		// parse it or whatever
		outMsg := ChatMsg {
			T: chatType,
			N: c.name,
			M: msg.Chat.M,
		}
		r.chatQueue = append(r.chatQueue, outMsg)
		if (len(r.chatQueue) > maxChatMsgs) {
			r.chatQueue = r.chatQueue[1:maxChatMsgs + 1]
		}

		log.Printf("Prepared msg %+v", outMsg)
		b, err = msgpack.Marshal(&outMsg)
		if err != nil {
			break
		}
		r.send(b)
	case keyType:
		keys := make(map[int]bool, len(msg.Key.K))
		for _, key := range msg.Key.K {
			keys[key] = true
		}
		c.keys = keys
		r.setState()
	default:
		log.Printf("Unknown message type %d", msg.T)
	}

	if err != nil {
		log.Printf("error parsing message: %v", err)
		return
	}
}

func (r *Room) createClientMsg(msgType int, c *Client) ClientMsg {
	msg := ClientMsg {
		T: msgType,
		Id: c.id,
		C: ClientData {
			N: c.name,
		},
		Ids: make([]int, 0),
		Cs: make(map[int]ClientData, 0),
	}
	for client := range r.clients {
		msg.Ids = append(msg.Ids, client.id)
		msg.Cs[client.id] = ClientData {N: client.name}
	}

	log.Printf("Client msg: %+v", msg)

	return msg
}

func (r *Room) sendJoin(c *Client) {
	msg := r.createClientMsg(joinType, c)
	b, err := msgpack.Marshal(&msg)
	if err != nil {
		return
	}
	r.send(b)
}

func (r *Room) sendLeft(c *Client) {
	msg := r.createClientMsg(leftType, c)
	b, err := msgpack.Marshal(&msg)
	if err != nil {
		return
	}
	r.send(b)
}

func (r* Room) setState() {
	for c := range r.clients {
		c.setState()
	}
}

func (r* Room) updateState() {
	for c := range r.clients {
		c.updateState()
	}
}

func (r* Room) sendState() {
	msg := StateMsg{}
	msg.T = stateType

	for c := range r.clients {
		msg.P = append(msg.P, c.pd)	
	}

	b, err := msgpack.Marshal(&msg)
	if err != nil {
		return
	}
	r.send(b)
}

// Send bytes to all clients
func (r *Room) send(b []byte) {
	for c := range r.clients {
		c.send(b)
	}
}

func (r *Room) getClientId() int {
	r.nextClientId++
	return r.nextClientId - 1
}