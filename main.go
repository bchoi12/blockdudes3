package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func indexHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hi!")
}

func main() {
	/*
	http.HandleFunc("/view/", viewHandler)
	http.HandleFunc("/chat/", chatHandler)
	http.HandleFunc("/chatclient/", chatClientHandler)
	*/

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