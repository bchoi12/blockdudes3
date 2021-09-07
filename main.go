package main

import (
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"os"
)

var upgrader = websocket.Upgrader{}

func main() {
	http.HandleFunc("/newclient/", newClientHandler)
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

func newClientHandler(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to create websocket: %v", err)
		return
	}

	createOrJoinRoom("room", ws)
}