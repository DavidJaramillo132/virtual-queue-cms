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
		http.Error(w, "Token inválido", http.StatusUnauthorized)
		log.Println("Conexión rechazada: token inválido")
		return
	}

	userID, ok := claims["user_id"].(string)
	if !ok || userID == "" {
		http.Error(w, "Token inválido: sin user_id", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}

	client := &hub.Client{
		ID:   userID,
		Conn: conn,
		Hub:  h,
	}

	h.Register <- client
	go client.ReadPump()
	log.Printf("✅ Cliente conectado: %s, rol: %v\n", userID, claims["rol"])
}
