package handlers

import (
	"log"
	"net/http"
	"websocket-server/internal/hub"
	"websocket-server/internal/utils"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func HandleConnections(h *hub.Hub, w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	claims, err := utils.ValidarJWT(token)
	if err != nil {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		log.Println("Connection rejected: invalid token -", err)
		return
	}

	// Intenta obtener userID de diferentes campos (compatibilidad con REST API)
	var userID string
	if id, ok := claims["id"].(string); ok && id != "" {
		userID = id // Token de REST API TypeScript
	} else if uid, ok := claims["user_id"].(string); ok && uid != "" {
		userID = uid // Token de WebSocket Go
	} else {
		http.Error(w, "Invalid token: no user_id or id", http.StatusUnauthorized)
		log.Println("Connection rejected: no user_id or id in claims")
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}

	client := hub.NewClient(userID, conn, h)

	h.Register <- client

	// Inicia goroutines para lectura y escritura
	go client.ReadPump()
	go client.WritePump()

	log.Printf("Client connected: %s", userID)
}

// ServeWs es un alias para HandleConnections (compatibilidad)
func ServeWs(h *hub.Hub, w http.ResponseWriter, r *http.Request) {
	HandleConnections(h, w, r)
}
