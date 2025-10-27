package hub

import (
    "encoding/json"
    "log"

    "github.com/gorilla/websocket"
    "websocket-server/internal/models"
)


type Hub struct {
	Clients    map[string]*Client
	Broadcast  chan models.Message
	Register   chan *Client
	Unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		Clients:    make(map[string]*Client),
		Broadcast:  make(chan models.Message),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.Clients[client.ID] = client
			h.notifyAll("user_connected", map[string]string{"id": client.ID})

		case client := <-h.Unregister:
			if _, ok := h.Clients[client.ID]; ok {
				delete(h.Clients, client.ID)
				h.notifyAll("user_disconnected", map[string]string{"id": client.ID})
				client.Conn.Close()
			}

		case message := <-h.Broadcast:
			for _, client := range h.Clients {
				client.SendJSON(message)
			}
		}
	}
}

func (h *Hub) notifyAll(event string, data interface{}) {
	payload, _ := json.Marshal(models.Message{Type: event, Data: data})
	for _, client := range h.Clients {
		err := client.Conn.WriteMessage(websocket.TextMessage, payload)
		if err != nil {
			log.Println("Error notifyAll:", err)
		}
	}
}
