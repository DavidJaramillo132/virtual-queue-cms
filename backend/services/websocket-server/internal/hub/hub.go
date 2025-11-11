package hub

import (
	//"encoding/json"
	"context"
	"encoding/json"
	"log"
	"time"

	"websocket-server/internal/models"

	"github.com/gorilla/websocket"
)

// StatsProvider es una función que obtiene estadísticas para un negocio
type StatsProvider func(ctx context.Context, negocioID string) (map[string]interface{}, error)

type Hub struct {
	clients       map[*Client]bool
	broadcast     chan []byte
	Register      chan *Client
	Unregister    chan *Client
	channels      map[string]map[*Client]bool // canal -> clientes suscritos
	Broadcast     chan models.Message
	statsProvider StatsProvider // Función para obtener estadísticas
}

func NewHub() *Hub {
	return &Hub{
		broadcast:     make(chan []byte),
		Register:      make(chan *Client),
		Unregister:    make(chan *Client),
		clients:       make(map[*Client]bool),
		channels:      make(map[string]map[*Client]bool),
		Broadcast:     make(chan models.Message),
		statsProvider: nil,
	}
}

// SetStatsProvider establece la función para obtener estadísticas
func (h *Hub) SetStatsProvider(provider StatsProvider) {
	h.statsProvider = provider
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
				// Elimina de todos los canales
				for canal := range h.channels {
					delete(h.channels[canal], client)
				}
				log.Printf("Cliente desregistrado: %s (Total: %d)", client.ID, len(h.clients))
			}

		case message := <-h.Broadcast:
			// Difunde a todos los clientes
			for client := range h.clients {
				client.SendJSON(message)
			}

		case data := <-h.broadcast:
			// Difusión de bytes a todos
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

	// Si es un canal de estadísticas y tenemos un proveedor, enviar estadísticas iniciales
	if len(canal) > 13 && canal[:13] == "estadisticas:" && h.statsProvider != nil {
		negocioID := canal[13:]
		go h.sendInitialStats(client, negocioID)
	}
}

// sendInitialStats envía las estadísticas iniciales a un cliente cuando se suscribe
func (h *Hub) sendInitialStats(client *Client, negocioID string) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	log.Printf("Obteniendo estadísticas iniciales para negocio %s (cliente %s)", negocioID, client.ID)

	statsData, err := h.statsProvider(ctx, negocioID)
	if err != nil {
		log.Printf("Error obteniendo estadísticas iniciales para negocio %s: %v", negocioID, err)
		return
	}

	log.Printf("Estadísticas obtenidas para negocio %s: %+v", negocioID, statsData)

	msg := models.Message{
		Type: models.MessageTypeStats,
		Data: statsData,
	}

	msgJSON, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error al codificar estadísticas iniciales: %v", err)
		return
	}

	log.Printf("Enviando estadísticas iniciales a cliente %s (tamaño: %d bytes)", client.ID, len(msgJSON))

	// Envía las estadísticas iniciales al cliente
	select {
	case client.send <- msgJSON:
		log.Printf("Estadísticas iniciales enviadas al cliente %s para negocio %s", client.ID, negocioID)
	case <-time.After(2 * time.Second):
		log.Printf("Timeout enviando estadísticas iniciales al cliente %s (buffer puede estar lleno)", client.ID)
	default:
		log.Printf("Advertencia: no se pueden enviar estadísticas iniciales al cliente %s (buffer lleno)", client.ID)
	}
}

// BroadcastToChannel envía mensaje solo a clientes de un canal
func (h *Hub) BroadcastToChannel(canal string, mensaje []byte) {
	clients, ok := h.channels[canal]
	if !ok {
		log.Printf("No hay clientes suscritos al canal: %s", canal)
		return
	}

	clientCount := len(clients)
	log.Printf("Enviando mensaje a %d cliente(s) en el canal: %s", clientCount, canal)

	sentCount := 0
	for client := range clients {
		select {
		case client.send <- mensaje:
			sentCount++
			log.Printf("Mensaje enviado a cliente %s en canal %s", client.ID, canal)
		default:
			log.Printf("Advertencia: buffer de envío lleno para cliente %s, cerrando conexión", client.ID)
			close(client.send)
			delete(clients, client)
		}
	}

	log.Printf("Resumen: %d de %d mensajes enviados en canal %s", sentCount, clientCount, canal)
}

// GetNegociosSuscritos devuelve IDs de negocios con suscripciones activas
func (h *Hub) GetNegociosSuscritos() []string {
	negocios := make(map[string]bool)
	for canal := range h.channels {
		// Los canales tienen formato "estadisticas:negocio_id"
		// "estadisticas:" tiene 13 caracteres
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
