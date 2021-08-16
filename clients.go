package main

import (
	"github.com/gorilla/websocket"
	"github.com/vmihailenco/msgpack/v5"
	"log"
	"net/http"
)

type Data struct {
	Message string
}

var upgrader = websocket.Upgrader{}

func newClientHandler(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}

	defer ws.Close()

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
		}

		log.Printf("received bytes: %v, %v", b, string(b))

		data := Data{}
		err = msgpack.Unmarshal(b, &data)
		if err != nil {
			log.Fatal(err)
		}

		b, err = msgpack.Marshal(&data)
		log.Printf("sending bytes: %v, %v", b, string(b))

		if err != nil {
			log.Fatal(err)
		}

		err = ws.WriteMessage(websocket.BinaryMessage, b)

		if err != nil {
			log.Printf("error sending out a message: %v", err)
		}
	}
}