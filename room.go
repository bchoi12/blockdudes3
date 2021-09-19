package main

import (
	"github.com/gorilla/websocket"
	"github.com/vmihailenco/msgpack/v5"
	"log"
	"strings"
	"time"
)

const (
	maxChatMsgLength int = 256
	frameTime time.Duration = 20 * time.Millisecond

	pingType int = 9
	initType int = 1
	joinType int = 5
	leftType int = 6
	chatType int = 2
	keyType int = 3

	playerStateType int = 4
	playerInitType int = 8
	objectInitType int = 7
)

type PingMsg struct {
	T int
}

type ClientMsg struct {
	T int
	Id int
	C ClientData
	Cs map[int]ClientData
}

type ClientData struct {
	N string
}

type PlayerInitMsg struct {
	T int
	Ps map[int]PlayerInitData
}

type PlayerStateMsg struct {
	T int
	Int int
	Ps map[int]PlayerData
}

type ObjectInitMsg struct {
	T int
	Os map[int]ObjectInitData
}

type ChatMsg struct {
	T int
	Id int
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
	Ping PingMsg
	Chat ChatMsg
	Key KeyMsg
	Join ClientMsg
	Left ClientMsg
}


type Room struct {
	id string

	nextClientId int
	clients map[int]*Client

	game *Game

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
var replacer = strings.NewReplacer(
    "\r\n", "",
    "\r", "",
    "\n", "",
    "\v", "",
    "\f", "",
    "\u0085", "",
    "\u2028", "",
    "\u2029", "",
    "fuck", "duck",
    "shit", "poopy",
)

func createOrJoinRoom(roomId string, name string, ws *websocket.Conn) {
	if rooms[roomId] == nil {
		rooms[roomId] = &Room {
			id: roomId,

			nextClientId: 0,
			clients: make(map[int]*Client),

			game: newGame(),

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
		id: rooms[roomId].nextClientId,
		name: name,
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
				r.clients[client.id] = client
				err := r.initClient(client)

				if err != nil {
					delete(r.clients, client.id)
					log.Printf("Failed to create new client: %v", err)
				} else {
					log.Printf("New client, %d total", len(r.clients))
				}
			case client := <-r.unregister:
				if _, ok := r.clients[client.id]; ok {
					r.sendLeft(client)
					r.game.deletePlayer(client)
					delete(r.clients, client.id)
					log.Printf("Unregistering client %d total", len(r.clients))
				}
				if len(r.clients) == 0 {
					return
				}
			case cmsg := <-r.incoming:
				msg := Msg{}
				err := msgpack.Unmarshal(cmsg.b, &msg)
				if err != nil {
					continue
				}
				r.processMsg(msg, cmsg.client)
			case _ = <-r.ticker.C:
				r.game.updateState()
				r.sendState()
		}
	}
}

func (r* Room) processMsg(msg Msg, c* Client) {
	var b []byte
	var err error

	switch(msg.T) {
	case pingType:
		outMsg := PingMsg {
			T: pingType,
		}
		b, err = msgpack.Marshal(&outMsg)
		if err != nil {
			break
		}
		c.send(b)
	case chatType:
		newMsg := replacer.Replace(msg.Chat.M)
		if len(newMsg) > maxChatMsgLength {
			newMsg = newMsg[:256]
		}

		outMsg := ChatMsg {
			T: chatType,
			Id: c.id,
			N: c.name,
			M: newMsg,
		}
		r.game.addChatMsg(outMsg)
		b, err = msgpack.Marshal(&outMsg)
		if err != nil {
			break
		}
		r.send(b)
	case keyType:
		r.game.updateKeys(c.id, msg.Key)
	default:
		log.Printf("Unknown message type %d", msg.T)
	}

	if err != nil {
		log.Printf("error parsing message: %v", err)
		return
	}
}

func (r *Room) initClient(c *Client) error {
	cmsg := r.createClientMsg(initType, c)
	b, err := msgpack.Marshal(&cmsg)
	if err != nil {
		return err
	}
	err = c.send(b)
	if err != nil {
		return err
	}

	mmsg := r.game.createObjectInitMsg()
	b, err = msgpack.Marshal(&mmsg)
	if err != nil {
		return err
	}
	err = c.send(b)
	if err != nil {
		return err
	}

	for _, chatMsg := range(r.game.chatQueue) {
		b, err = msgpack.Marshal(&chatMsg)
		if err != nil {
			return err
		}

		c.send(b)
	}

	err = r.sendJoin(c)
	if err != nil {
		return err
	}
	
	r.nextClientId++
	r.game.addPlayer(c)
	go c.run()

	return nil
}

func (r *Room) createClientMsg(msgType int, c *Client) ClientMsg {
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

	return msg
}

func (r *Room) sendJoin(c *Client) error {
	msg := r.createClientMsg(joinType, c)
	b, err := msgpack.Marshal(&msg)
	if err != nil {
		return err
	}
	r.send(b)
	return nil
}

func (r *Room) sendLeft(c *Client) {
	msg := r.createClientMsg(leftType, c)
	b, err := msgpack.Marshal(&msg)
	if err != nil {
		return
	}
	r.send(b)
}

func (r* Room) sendState() {
	msg := r.game.createPlayerStateMsg()

	b, err := msgpack.Marshal(&msg)
	if err != nil {
		return
	}
	r.send(b)
}

func (r *Room) send(b []byte) {
	for _, c := range r.clients {
		c.send(b)
	}
}