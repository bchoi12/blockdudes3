package main

import (
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"os"
)

var upgrader = websocket.Upgrader{}

func main() {
	http.HandleFunc("/connection/", connectionHandler)

	serveFiles("/")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
		log.Printf("Defaulting to port %s", port)
	}

	log.Printf("Listening on port %s", port)
	if err := http.ListenAndServe(":" + port, nil); err != nil {
		log.Fatal(err)
	}
}

func connectionHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("new socket?")

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}

	for {
		_, _, err := ws.ReadMessage()

		if err != nil {
			log.Printf("error reading incoming message: %v", err)

			if e, ok := err.(*websocket.CloseError); ok {
				switch e.Code {
					case websocket.CloseNormalClosure,
					websocket.CloseGoingAway,
					websocket.CloseNoStatusReceived:
					return
				}
			}
		}

		err = ws.WriteMessage(websocket.BinaryMessage, []byte("data"))

		if err != nil {
			log.Printf("error sending out a message: %v", err)
		}
	}
}