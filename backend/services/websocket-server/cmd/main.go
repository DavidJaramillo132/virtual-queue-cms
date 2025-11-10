package main

import (
	"context"
	"encoding/json"
	"log"
	"net"
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
	// Forzar IPv4 (evita errores en redes sin soporte IPv6)
	net.DefaultResolver = &net.Resolver{
		PreferGo: true,
		Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
			d := net.Dialer{
				Timeout: time.Second * 5,
			}
			// Solo resolver IPv4
			return d.DialContext(ctx, "udp4", "8.8.8.8:53")
		},
	}

	// Cargar variables de entorno
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	// Conexión a la base de datos
	estadisticasService, err := services.NewEstadisticasService(dbURL)
	if err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}
	defer estadisticasService.Close()

	log.Println("Database connection established")

	h := hub.NewHub()
	
	// Configurar el proveedor de estadísticas para el Hub
	h.SetStatsProvider(func(ctx context.Context, negocioID string) (map[string]interface{}, error) {
		stats, err := estadisticasService.ObtenerEstadisticas(ctx, negocioID)
		if err != nil {
			return nil, err
		}
		
		return map[string]interface{}{
			"negocio_id":        negocioID,
			"citas_hoy":         stats.CitasHoy,
			"total_citas":       stats.TotalCitas,
			"citas_completadas": stats.CitasCompletadas,
			"citas_canceladas":  stats.CitasCanceladas,
			"timestamp":         time.Now().Unix(),
		}, nil
	})
	
	go h.Run()

	// Handler para notificaciones de citas (llamado desde REST API)
	http.HandleFunc("/notify/cita", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("📨 Notificación recibida desde REST API: %s %s", r.Method, r.URL.Path)
		
		if r.Method != http.MethodPost {
			log.Printf("❌ Método no permitido: %s", r.Method)
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var notification struct {
			NegocioID string `json:"negocio_id"`
			Action    string `json:"action"` // "created", "updated", "deleted", "status_changed"
		}

		if err := json.NewDecoder(r.Body).Decode(&notification); err != nil {
			log.Printf("❌ Error decoding notification: %v", err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		log.Printf("📋 Notificación decodificada: negocio_id=%s, action=%s", notification.NegocioID, notification.Action)

		if notification.NegocioID == "" {
			log.Printf("❌ negocio_id está vacío")
			http.Error(w, "negocio_id is required", http.StatusBadRequest)
			return
		}

		// Obtener estadísticas actualizadas para el negocio
		ctx := context.Background()
		log.Printf("🔍 Consultando estadísticas para negocio %s...", notification.NegocioID)
		
		stats, err := estadisticasService.ObtenerEstadisticas(ctx, notification.NegocioID)
		if err != nil {
			log.Printf("❌ Error getting stats for negocio %s: %v", notification.NegocioID, err)
			http.Error(w, "Error getting statistics", http.StatusInternalServerError)
			return
		}

		log.Printf("✅ Estadísticas obtenidas: Total=%d, Hoy=%d, Completadas=%d, Canceladas=%d", 
			stats.TotalCitas, stats.CitasHoy, stats.CitasCompletadas, stats.CitasCanceladas)

		// Enviar actualización a los clientes suscritos
		msg := models.Message{
			Type: models.MessageTypeStats,
			Data: map[string]interface{}{
				"negocio_id":        notification.NegocioID,
				"citas_hoy":         stats.CitasHoy,
				"total_citas":       stats.TotalCitas,
				"citas_completadas": stats.CitasCompletadas,
				"citas_canceladas":  stats.CitasCanceladas,
				"timestamp":         time.Now().Unix(),
			},
		}

		msgJSON, err := json.Marshal(msg)
		if err != nil {
			log.Printf("❌ Error marshaling stats: %v", err)
			http.Error(w, "Error preparing update", http.StatusInternalServerError)
			return
		}

		channelName := "estadisticas:" + notification.NegocioID
		log.Printf("📤 Enviando actualización al canal: %s (tamaño: %d bytes)", channelName, len(msgJSON))
		
		h.BroadcastToChannel(channelName, msgJSON)
		log.Printf("✅ Stats updated for negocio %s (action: %s) - Mensaje enviado a clientes suscritos", notification.NegocioID, notification.Action)

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Notification processed"))
	})

	// Endpoint de salud para verificar que el servidor está funcionando
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("WebSocket server is running"))
	})

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandleConnections(h, w, r)
	})

	log.Println("WebSocket server running on :8080")
	log.Println("Real-time statistics: updates triggered by REST API notifications")
	log.Println("Health check endpoint available at: http://localhost:8080/health")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
