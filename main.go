package main

import (
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	clientEndpoint string = "/bd3/"
)

var allowedOrigins = map[string]bool {
	"http://localhost:8080": true,
	"https://localhost:8080": true,	
	"http://localhost:8081": true,
	"https://localhost:8081": true,
	"https://blockdudes3.uc.r.appspot.com": true,
	"https://blockdudes3.herokuapp.com": true,
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
	    origin := r.Header.Get("Origin")
		allowed, ok := allowedOrigins[origin]
	    return ok && allowed
	},
}

func main() {
	http.HandleFunc(clientEndpoint, clientEndpointHandler)

	// TODO: remove this eventually
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

func clientEndpointHandler(w http.ResponseWriter, r *http.Request) {
	params := strings.Split(r.URL.Path[len(clientEndpoint):], "&")
	vars := make(map[string]string)
	for _, param := range(params) {
		pair := strings.Split(param, "=")
		if len(pair) != 2 {
			log.Printf("Malformed request: ", r.URL.Path)
			return
		}

		vars[pair[0]] = strings.TrimSpace(pair[1])
	}

	room, roomOk := vars["room"]
	if !roomOk {
		log.Printf("Missing room!")
		return
	}
	if len(room) < 4 || len(room) > 10 {
		log.Printf("Room %s should be 4-10 chars long", room)
		return
	}

	name, nameOk := vars["name"]
	if !nameOk {
		log.Printf("Missing name!")
		return
	}
	if len(name) == 0 || len(name) > 16 {
		log.Printf("Name %s should be 1-16 chars long", name)
		return
	}

	id, idOk := vars["id"]
	if idOk {
		_, err := strconv.Atoi(id)
		if err != nil {
			log.Printf("Invalid ID: ", err)
			return
		}
	}

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to create websocket: %v", err)
		return
	}
	
	// Try to keep the socket alive?
	ws.SetReadDeadline(time.Time{})
	CreateOrJoinRoom(vars, ws)
}