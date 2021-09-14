package main

import (
	"github.com/gorilla/websocket"
	"github.com/vmihailenco/msgpack/v5"
	"log"
	"sort"
	"time"
)

const (
	maxChatMsgs int = 50

	frameTime time.Duration = 25 * time.Millisecond

	initType int = 1
	joinType int = 5
	leftType int = 6
	chatType int = 2
	keyType int = 3
	playerStateType int = 4
	objectStateType int = 7

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

type PlayerStateMsg struct {
	T int
	Ids []int
	Ps map[int]PlayerData
}

type PlayerData struct {
	Pos Vec2
	Vel Vec2
	Acc Vec2
}

type ObjectStateMsg struct {
	T int
	Ss []ObjectData
}

type ObjectData struct {
	Pos Vec2
	W float64
	H float64
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

	objects []ObjectData
	chatQueue []ChatMsg

	incoming chan IncomingMsg
	ticker *time.Ticker
	lastUpdateTime time.Time
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

			objects: make([]ObjectData, 0),
			chatQueue: make([]ChatMsg, 0),

			incoming: make(chan IncomingMsg),
			ticker: time.NewTicker(frameTime),
			register: make(chan *Client),
			unregister: make(chan *Client),
		}

		// TODO: make this async? or something
		rooms[roomId].objects = loadMap()

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
				var timeStep time.Duration
				if r.lastUpdateTime.IsZero() {
					timeStep = 0
					r.lastUpdateTime = time.Now()
				} else {
					timeStep = time.Now().Sub(r.lastUpdateTime)
					r.lastUpdateTime = time.Now()
				}
				r.updateState(timeStep)
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
	sort.Ints(msg.Ids)

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

func (r* Room) updateState(timeStep time.Duration) {
	for c := range r.clients {
		c.updateState(timeStep, r.objects)
	}
}

func (r* Room) sendState() {
	msg := PlayerStateMsg{
		T: playerStateType,
		Ids: make([]int, 0),
		Ps: make(map[int]PlayerData, 0),
	}

	for c := range r.clients {
		msg.Ids = append(msg.Ids, c.id)
		msg.Ps[c.id] = c.pd	
	}
	sort.Ints(msg.Ids)

	b, err := msgpack.Marshal(&msg)
	if err != nil {
		return
	}
	r.send(b)
}

func (r* Room) createObjectStateMsg() ObjectStateMsg {
	msg := ObjectStateMsg {
		T: objectStateType,
		Ss: r.objects,
	}

	return msg
}

func loadMap() []ObjectData {
	return []ObjectData {
		ObjectData {
			Pos: Vec2 {
				X: 1,
				Y: 1,
			},
		},
		ObjectData {
			Pos: Vec2 {
				X: 2,
				Y: 1,
			},
		},
		ObjectData {
			Pos: Vec2 {
				X: 3,
				Y: 1,
			},
		},
		ObjectData {
			Pos: Vec2 {
				X: 1,
				Y: 2,
			},
		},
		ObjectData {
			Pos: Vec2 {
				X: 3,
				Y: 2,
			},
		},
	}
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