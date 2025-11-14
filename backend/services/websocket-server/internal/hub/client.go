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
			// Extrae el canal del mensaje (puede venir en msg.Channel o msg.Data)
			var canal string
			if msg.Channel != "" {
				canal = msg.Channel
			} else if dataMap, ok := msg.Data.(map[string]interface{}); ok {
				if ch, ok := dataMap["channel"].(string); ok {
					canal = ch
				}
			}

			if canal == "" {
				log.Printf("Advertencia: Cliente %s intentó suscribirse sin canal", c.ID)
				continue
			}

			c.Hub.SuscribirCanal(c, canal)

		case models.MessageTypeUnsubscribe:
			// TODO: Implementar desuscripción si es necesario

		case "nueva_cita", "avance_fila", "cerrar_fila", "usuario_en_fila":
			c.Hub.Broadcast <- msg
		}
	}
}

// WritePump lee del canal de envío y envía mensajes al cliente WebSocket
func (c *Client) WritePump() {
	defer func() {
		c.Conn.Close()
	}()

	for message := range c.send {
		if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
			log.Printf("Error enviando mensaje al cliente %s: %v", c.ID, err)
			return
		}
	}

	// Canal cerrado, envía mensaje de cierre al cliente
	c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
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
