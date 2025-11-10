package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"
	"websocket-server/internal/handlers"
	"websocket-server/internal/hub"
	"websocket-server/internal/models"
	"websocket-server/internal/services"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Database connection
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	estadisticasService, err := services.NewEstadisticasService(dbURL)
	if err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}
	defer estadisticasService.Close()

	log.Println("Database connection established")

	h := hub.NewHub()
	go h.Run()

	// Goroutine for polling statistics every 5 seconds
	go func() {
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()

		for range ticker.C {
			// Get all subscribed businesses
			negociosSuscritos := h.GetNegociosSuscritos()

			if len(negociosSuscritos) == 0 {
				continue // No connected clients
			}

			// Query statistics for each business
			ctx := context.Background()
			for _, negocioID := range negociosSuscritos {
				stats, err := estadisticasService.ObtenerEstadisticas(ctx, negocioID)
				if err != nil {
					log.Printf("Error getting stats for negocio %s: %v", negocioID, err)
					continue
				}

				// Create message with statistics
				msg := models.Message{
					Type: models.MessageTypeStats,
					Data: map[string]interface{}{
						"negocio_id":        negocioID,
						"citas_hoy":         stats.CitasHoy,
						"total_citas":       stats.TotalCitas,
						"citas_completadas": stats.CitasCompletadas,
						"citas_canceladas":  stats.CitasCanceladas,
						"timestamp":         time.Now().Unix(),
					},
				}

				msgJSON, err := json.Marshal(msg)
				if err != nil {
					log.Printf("Error marshaling stats: %v", err)
					continue
				}

				// Broadcast to all subscribers of the business channel
				channelName := "estadisticas:" + negocioID
				h.BroadcastToChannel(channelName, msgJSON)
			}
		}
	}()

	// Endpoint WebSocket
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandleConnections(h, w, r)
	})

	log.Println("WebSocket server running on :8080")
	log.Println("Polling estadisticas every 5 seconds")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
