package hub

import (
	"encoding/json"
	"log"

	"websocket-server/internal/models"

	"github.com/gorilla/websocket"
)

type Client struct {
	ID   string
	Conn *websocket.Conn
	Hub  *Hub
	send chan []byte
}

func NewClient(id string, conn *websocket.Conn, hub *Hub) *Client {
	return &Client{
		ID:   id,
		Conn: conn,
		Hub:  hub,
		send: make(chan []byte, 256),
	}
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
		log.Printf("Client disconnected: %s", c.ID)
	}()

	for {
		var msg models.Message
		err := c.Conn.ReadJSON(&msg)
		if err != nil {
			break
		}

		switch msg.Type {
		case models.MessageTypeSubscribe:
			// Extract channel from message (can come in msg.Channel or msg.Data)
			var canal string
			if msg.Channel != "" {
				canal = msg.Channel
			} else if dataMap, ok := msg.Data.(map[string]interface{}); ok {
				if ch, ok := dataMap["channel"].(string); ok {
					canal = ch
				}
			}

			if canal == "" {
				log.Printf("Warning: Client %s tried to subscribe without channel", c.ID)
				continue
			}

			c.Hub.SuscribirCanal(c, canal)

		case models.MessageTypeUnsubscribe:
			// TODO: Implement unsubscribe if needed

		case "nueva_cita", "avance_fila", "cerrar_fila", "usuario_en_fila":
			c.Hub.Broadcast <- msg
		}
	}
}

// WritePump reads from send channel and sends messages to WebSocket client
func (c *Client) WritePump() {
	defer func() {
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				// Channel was closed
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			err := c.Conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				log.Printf("Error sending message to client %s: %v", c.ID, err)
				return
			}
		}
	}
}

func (c *Client) SendJSON(msg models.Message) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Println("Error marshaling message:", err)
		return
	}
	err = c.Conn.WriteMessage(websocket.TextMessage, data)
	if err != nil {
		log.Println("Error sending message to client:", err)
	}
}
