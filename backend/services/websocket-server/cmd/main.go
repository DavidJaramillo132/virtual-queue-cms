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
	if err := godotenv.Load(".env"); err != nil {
		log.Println("Archivo .env no encontrado, usando variables de entorno del sistema")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("La variable de entorno DATABASE_URL es requerida")
	}

	// Conexión a la base de datos
	estadisticasService, err := services.NewEstadisticasService(dbURL)
	if err != nil {
		log.Fatalf("Error conectando a la base de datos: %v", err)
	}
	defer estadisticasService.Close()

	log.Println("Conexión a la base de datos establecida")

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
		log.Printf("Notificación recibida desde REST API: %s %s", r.Method, r.URL.Path)

		if r.Method != http.MethodPost {
			log.Printf("Método no permitido: %s", r.Method)
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var notification struct {
			NegocioID string `json:"negocio_id"`
			Action    string `json:"action"` // "created", "updated", "deleted", "status_changed"
		}

		if err := json.NewDecoder(r.Body).Decode(&notification); err != nil {
			log.Printf("Error decodificando notificación: %v", err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		log.Printf("Notificación decodificada: negocio_id=%s, action=%s", notification.NegocioID, notification.Action)

		if notification.NegocioID == "" {
			log.Printf("negocio_id está vacío")
			http.Error(w, "negocio_id is required", http.StatusBadRequest)
			return
		}

		// Pequeño delay para asegurar que la transacción de la base de datos se complete
		// Esto evita el problema de consultar antes de que el COMMIT se complete
		time.Sleep(200 * time.Millisecond)

		// Obtener estadísticas actualizadas para el negocio
		ctx := context.Background()
		log.Printf("Consultando estadísticas para negocio %s...", notification.NegocioID)

		stats, err := estadisticasService.ObtenerEstadisticas(ctx, notification.NegocioID)
		if err != nil {
			log.Printf("Error obteniendo estadísticas para negocio %s: %v", notification.NegocioID, err)
			http.Error(w, "Error getting statistics", http.StatusInternalServerError)
			return
		}

		log.Printf("Estadísticas obtenidas: Total=%d, Hoy=%d, Completadas=%d, Canceladas=%d",
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
			log.Printf("Error codificando estadísticas: %v", err)
			http.Error(w, "Error preparing update", http.StatusInternalServerError)
			return
		}

		channelName := "estadisticas:" + notification.NegocioID
		log.Printf("Enviando actualización al canal: %s (tamaño: %d bytes)", channelName, len(msgJSON))

		h.BroadcastToChannel(channelName, msgJSON)
		log.Printf("Estadísticas actualizadas para negocio %s (acción: %s) - Mensaje enviado a clientes suscritos", notification.NegocioID, notification.Action)

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

	log.Println("Servidor WebSocket ejecutándose en :8080")
	log.Println("Estadísticas en tiempo real: actualizaciones activadas por notificaciones de REST API")
	log.Println("Endpoint de verificación de salud disponible en: http://localhost:8080/health")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
