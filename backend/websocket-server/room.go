// room.go
package main

type Room struct {
	name    string
	clients map[*Client]bool
}

func NewRoom(name string) *Room {
	return &Room{
		name:    name,
		clients: make(map[*Client]bool),
	}
}

func (r *Room) Join(client *Client) {
	r.clients[client] = true
	client.room = r
}

func (r *Room) Leave(client *Client) {
	delete(r.clients, client)
	client.room = nil
}

func (r *Room) Broadcast(message []byte) {
	for client := range r.clients {
		client.send <- message
	}
}
