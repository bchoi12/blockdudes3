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

type InitMsg struct {
	T int
	Id int
	Ids []int
}

// New client joined
type JoinMsg struct {
	T int
	Id int
	Ids []int
}

// Someone left
type LeftMsg struct {
	T int
	Id int
	Ids []int
}

// output only
type StateMsg struct {
	T int
	P []PData
}

type ChatMsg struct {
	T int
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
	Join JoinMsg
	Left LeftMsg
}


type Room struct {
	id string

	clients map[*Client]bool
	nextClientId int
	chatQueue []ChatMsg

	incoming chan ClientMsg
	ticker *time.Ticker
	register chan *Client
	unregister chan *Client
}

type ClientMsg struct {
	b []byte
	client *Client
}

var rooms = make(map[string]*Room)

func createOrJoinRoom(name string, ws *websocket.Conn) {
	if rooms[name] == nil {
		rooms[name] = &Room {
			id: name,
			clients: make(map[*Client]bool),
			nextClientId: 0,
			chatQueue: make([]ChatMsg, 0),

			incoming: make(chan ClientMsg),
			ticker: time.NewTicker(frameTime),
			register: make(chan *Client),
			unregister: make(chan *Client),
		}

		go rooms[name].run()
	}

	client := &Client {
		room: rooms[name],
		ws: ws,
		id: rooms[name].getClientId(),
		keys: make(map[int]bool, 0),
	}
	rooms[name].register <- client
}

func (r *Room) run() {
	defer func() {
		log.Printf("Deleting room %v", r.id)
		delete(rooms, r.id)
	}()

	for {
		select {
			case client := <-r.register:
				r.sendJoin(client)
				client.init(r)
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

func (r *Room) sendJoin(c *Client) {
	msg := JoinMsg {
		T: joinType,
		Id: c.id,
		Ids: make([]int, 0),
	} 
	msg.Ids = append(msg.Ids, c.id)
	for client := range r.clients {
		msg.Ids = append(msg.Ids, client.id)
	}
	b, err := msgpack.Marshal(&msg)
	if err != nil {
		return
	}
	r.send(b)
}

func (r *Room) sendLeft(c *Client) {
	msg := LeftMsg {
		T: leftType,
		Id: c.id,
		Ids: make([]int, 0),
	}
	for client := range r.clients {
		msg.Ids = append(msg.Ids, client.id)
	}	
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