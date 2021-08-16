package main

import (
	"log"
	"net/http"
	"os"
)

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