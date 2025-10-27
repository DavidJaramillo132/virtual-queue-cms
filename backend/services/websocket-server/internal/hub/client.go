package hub

import (
	"encoding/json"
	"log"

	"github.com/gorilla/websocket"
	"websocket-server/internal/models"
)

type Client struct {
	ID   string
	Conn *websocket.Conn
	Hub  *Hub
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
		log.Printf("❌ Cliente desconectado: %s\n", c.ID)
	}()

	for {
		var msg models.Message
		err := c.Conn.ReadJSON(&msg)
		if err != nil {
			log.Println("Read error:", err)
			break
		}

		switch msg.Type {
		case "nueva_cita", "avance_fila", "cerrar_fila", "usuario_en_fila":
			c.Hub.Broadcast <- msg
		default:
			log.Println("Evento no reconocido:", msg.Type)
		}
	}
}

func (c *Client) SendJSON(msg models.Message) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Println("Error marshal mensaje:", err)
		return
	}
	err = c.Conn.WriteMessage(websocket.TextMessage, data)
	if err != nil {
		log.Println("Error enviar mensaje al cliente:", err)
	}
}
