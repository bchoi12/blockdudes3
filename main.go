package main

import (
	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v3"
	"log"
	"net/http"
	"os"
	"strings"
)

const (
	newClient string = "/newclient/"
)

var upgrader = websocket.Upgrader{}

func main() {
	http.HandleFunc(newClient, newClientHandler)
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
	stuff := strings.Split(r.URL.Path[len(newClient):], "&")
	if len(stuff) != 2 {
		log.Printf("Malformed request: %s", r.URL.Path)
		return
	}

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to create websocket: %v", err)
		return
	}

	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302"},
			},
		},
	}
	wrtc, err := webrtc.NewPeerConnection(config)

	const (
		roomPrefix string = "room="
		namePrefix string = "name="
	)
	var room string
	var name string
	for _, param := range stuff {
		if strings.HasPrefix(param, roomPrefix) {
			room = strings.TrimPrefix(param, roomPrefix)
		} else if strings.HasPrefix(param, namePrefix) {
			name = strings.TrimPrefix(param, namePrefix)
		}
	}

	room = strings.TrimSpace(room)
	if len(room) < 4 || len(room) > 10 {
		log.Printf("Room %s should be 4-10 chars long", room)
		return
	}

	name = strings.TrimSpace(name)
	if len(name) == 0 || len(name) > 16 {
		log.Printf("Name %s should be 1-16 chars long", name)
		return
	}

	createOrJoinRoom(room, name, ws, wrtc)
}