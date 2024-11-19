// main.go
package main

import (
	"fmt"
	"net/http"
)

func main() {
	server := NewServer()

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		ServeWs(server, w, r)
	})

	go server.Run()

	fmt.Println("Server started at :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		fmt.Println("ListenAndServe: ", err)
	}
}
