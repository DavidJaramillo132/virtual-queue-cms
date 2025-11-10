package models

import "time"

//type Message struct {
//    Type string      `json:"type"`
//    Data interface{} `json:"data"`
//}
//representa un mensaje WebSocket
type Message struct {
	Type      MessageType `json:"type"`
	Data      interface{} `json:"data"`
	Channel   string      `json:"channel,omitempty"`
	NegocioID string      `json:"negocioId,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}

// MessageType define los tipos de mensajes
type MessageType string

const (
	MessageTypeChat         MessageType = "chat"
	MessageTypeEstadisticas MessageType = "estadisticas_update"
	MessageTypeStats        MessageType = "stats"
	MessageTypeSubscribe    MessageType = "subscribe"
	MessageTypeUnsubscribe  MessageType = "unsubscribe"
)

type EstadisticasData struct {
	TotalCitas       int       `json:"totalCitas"`
	CitasHoy         int       `json:"citasHoy"`
	CitasCompletadas int       `json:"citasCompletadas"`
	CitasCanceladas  int       `json:"citasCanceladas"`
	Timestamp        time.Time `json:"timestamp"`
}
