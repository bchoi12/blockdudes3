package main

import (
	"github.com/gorilla/websocket"
	"github.com/vmihailenco/msgpack/v5"
	"log"
	"net/http"
)

type ChatMsg struct {
	T int `default: 1`
	M string
}

type PCMsg struct {
	T int `default: 2`
	Key []int
}

type PSMsg struct {
	T int `default: 2`
	P PCData
}

type Vec2d struct {
	X float64
	Y float64
}

type Msg struct {
//	_msgpack struct{} `msgpack:",omitempty"`
	T int
	Chat ChatMsg
	P PCMsg
}

// data sent to client
type PCData struct {
	Pos Vec2d
	Vel Vec2d
	Acc Vec2d
}

// all data captured by server
type PSData struct {
	C PCData
}

var upgrader = websocket.Upgrader{}
var clients = make(map[string]map[*websocket.Conn]bool)
var broadcast = make(map[string]chan []byte)
var chatQueue = make(map[string][]ChatMsg)

const maxChatMsgs int = 50

func broadcastMsgs(room string) {
	for {
		b := <-broadcast[room]

		for client := range clients[room] {
			sendMsg(room, client, b)
		}
	}
}

func sendMsg(room string, client *websocket.Conn, data []byte) {
	err := client.WriteMessage(websocket.BinaryMessage, data)
	if err != nil {
		log.Printf("error writing out message: %v", err)
	}
}

func initClient(room string, client *websocket.Conn) {
	for _, chatMsg := range chatQueue[room] {
		b, err := msgpack.Marshal(&chatMsg)
		if err != nil {
			log.Printf("%v", err)
		}

		sendMsg(room, client, b)
	}
}

func queueMsg(room string, msg Msg) {
	var b []byte
	var err error

	switch(msg.T) {
	case 1:
		msg.Chat.T = msg.T
		chatQueue[room] = append(chatQueue[room], msg.Chat)
		if (len(chatQueue[room]) > maxChatMsgs) {
			chatQueue[room] = chatQueue[room][1:maxChatMsgs + 1]
		}

		log.Printf("Sending msg %+v", msg.Chat)
		b, err = msgpack.Marshal(&msg.Chat)
		broadcast[room] <- b
	default:
		log.Printf("Unknown message type %d", msg.T)
	}

	if err != nil {
		log.Printf("error parsing message: %v", err)
		return
	}
}

func newClientHandler(w http.ResponseWriter, r *http.Request) {
	room := "room" // r.URL.Path[len("/newclient/"):]
	if len(room) == 0 {
		log.Printf("error: room name is empty")
		return
	}

	if clients[room] == nil {
		go broadcastMsgs(room)
		clients[room] = make(map[*websocket.Conn]bool)
		broadcast[room] = make(chan []byte)
		if chatQueue[room] == nil {
			chatQueue[room] = make([]ChatMsg, 0)
		}
	}

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}

	defer close(room, ws)
	clients[room][ws] = true
	initClient(room, ws)

	for {
		_, b, err := ws.ReadMessage()

		if err != nil {
			if e, ok := err.(*websocket.CloseError); ok {
				switch e.Code {
					case websocket.CloseNormalClosure,
					websocket.CloseGoingAway,
					websocket.CloseNoStatusReceived:
						log.Printf("lost connection: %v", err)
						return
				}
			}

			log.Printf("error reading incoming message: %v", err)
			continue
		}

		log.Printf("received bytes: %v, %v", b, string(b))

		msg := Msg{}
		err = msgpack.Unmarshal(b, &msg)
		if err != nil {
			log.Printf("error unpacking data %v", err)
			continue
		}

		log.Printf("received data: %+v", msg)
		queueMsg(room, msg)
	}
}

func close(room string, ws *websocket.Conn) {
	ws.Close()
	delete(clients[room], ws)

	if (len(clients[room]) == 0) {
		delete(clients, room)
		delete(broadcast, room)
		delete(chatQueue, room)
	}
}