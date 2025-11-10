package hub

import (
	//"encoding/json"
	"log"

	"websocket-server/internal/models"

	"github.com/gorilla/websocket"
)

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	Register   chan *Client
	Unregister chan *Client
	channels   map[string]map[*Client]bool // canal -> clientes suscritos
	Broadcast  chan models.Message
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		channels:   make(map[string]map[*Client]bool),
		Broadcast:  make(chan models.Message),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.clients[client] = true
			log.Printf("Client registered: %s (Total: %d)", client.ID, len(h.clients))

		case client := <-h.Unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				// Remove from all channels
				for canal := range h.channels {
					delete(h.channels[canal], client)
				}
				log.Printf("Client unregistered: %s (Total: %d)", client.ID, len(h.clients))
			}

		case message := <-h.Broadcast:
			// Broadcast a todos los clientes
			for client := range h.clients {
				client.SendJSON(message)
			}

		case data := <-h.broadcast:
			// Broadcast de bytes a todos
			for client := range h.clients {
				err := client.Conn.WriteMessage(websocket.TextMessage, data)
				if err != nil {
					log.Printf("Error enviando a cliente %s: %v", client.ID, err)
					client.Conn.Close()
					delete(h.clients, client)
				}
			}
		}
	}
}

// SuscribirCanal suscribe un cliente a un canal específico
func (h *Hub) SuscribirCanal(client *Client, canal string) {
	if h.channels[canal] == nil {
		h.channels[canal] = make(map[*Client]bool)
	}
	h.channels[canal][client] = true
	log.Printf("Client %s subscribed to channel: %s", client.ID, canal)
}

// BroadcastToChannel envía mensaje solo a clientes de un canal
func (h *Hub) BroadcastToChannel(canal string, mensaje []byte) {
	clients, ok := h.channels[canal]
	if !ok {
		return
	}

	for client := range clients {
		select {
		case client.send <- mensaje:
		default:
			log.Printf("Warning: send buffer full for client %s, closing connection", client.ID)
			close(client.send)
			delete(clients, client)
		}
	}
}

// GetNegociosSuscritos returns IDs of businesses with active subscriptions
func (h *Hub) GetNegociosSuscritos() []string {
	negocios := make(map[string]bool)
	for canal := range h.channels {
		// Channels have format "estadisticas:negocio_id"
		// "estadisticas:" has 13 characters
		if len(canal) > 13 && canal[:13] == "estadisticas:" {
			negocioID := canal[13:]
			negocios[negocioID] = true
		}
	}

	result := make([]string, 0, len(negocios))
	for negocioID := range negocios {
		result = append(result, negocioID)
	}
	return result
}
