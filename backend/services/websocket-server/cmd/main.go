package main

import (
	"log"
	"net/http"
	"websocket-server/internal/handlers"
	"websocket-server/internal/utils"
	"websocket-server/internal/hub"
)

func main() {
	h := hub.NewHub()
	go h.Run()

	// Endpoint WebSocket
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandleConnections(h, w, r)
	})

	// Endpoint para renovar JWT usando refresh token
	http.HandleFunc("/refresh", func(w http.ResponseWriter, r *http.Request) {
		refreshToken := r.Header.Get("Authorization") // Bearer <token>
		userID, err := utils.ValidarRefreshToken(refreshToken)
		if err != nil {
			http.Error(w, "Refresh token inválido", http.StatusUnauthorized)
			return
		}
		newToken, _ := utils.GenerarJWT(userID, "cliente") // ajusta el rol real
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"token":"` + newToken + `"}`))
	})

	log.Println("✅ WebSocket server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
