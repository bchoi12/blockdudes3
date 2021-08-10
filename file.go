package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func serveFiles(dir string) {
	http.HandleFunc(dir, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			fmt.Fprintf(w, "Hi2!")
			return
		}
		url := r.URL.Path[1:]

		info, err := os.Stat(url)
		if os.IsNotExist(err) {
			log.Printf("404 for url: %s", url)
			notFound(w)
			return
		} else if info.IsDir() {
			index := url + "/index.html"
			if _, err := os.Stat(index); os.IsNotExist(err) {
				log.Printf("404 for url (no index): %s", url)
				notFound(w)
				return
			}
		} 

		log.Printf("serving file %s", url)
		http.ServeFile(w, r, url)
	})
}

func notFound(w http.ResponseWriter) {
	fmt.Fprintf(w, "404!")
}