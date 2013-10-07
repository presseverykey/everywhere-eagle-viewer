// Seriously not meant for production!
// (should be obvious)
// XMLHttpRequest won't work via filesystem.
// to use: install go ... type $ go run server.go
package main

import (
	"net/http"
	"log"
)

func main() {
	http.Handle("/", http.FileServer(http.Dir(".")))
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
