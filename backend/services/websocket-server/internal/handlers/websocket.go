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

	// Try to get userID from different fields (REST API compatibility)
	var userID string
	if id, ok := claims["id"].(string); ok && id != "" {
		userID = id // REST API TypeScript token
	} else if uid, ok := claims["user_id"].(string); ok && uid != "" {
		userID = uid // WebSocket Go token
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

	// Start goroutines for read and write
	go client.ReadPump()
	go client.WritePump()

	log.Printf("Client connected: %s", userID)
}

// ServeWs is an alias for HandleConnections (compatibility)
func ServeWs(h *hub.Hub, w http.ResponseWriter, r *http.Request) {
	HandleConnections(h, w, r)
}
