package services

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/lib/pq"
)

// EstadisticasData representa las métricas de estadísticas
type EstadisticasData struct {
	TotalCitas       int       `json:"totalCitas"`
	CitasHoy         int       `json:"citasHoy"`
	CitasCompletadas int       `json:"citasCompletadas"`
	CitasCanceladas  int       `json:"citasCanceladas"`
	Timestamp        time.Time `json:"timestamp"`
}

// EstadisticasService maneja las operaciones de estadísticas
type EstadisticasService struct {
	db *sql.DB
}

// NewEstadisticasService crea una nueva instancia del servicio
func NewEstadisticasService(connStr string) (*EstadisticasService, error) {
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("error abriendo conexión a BD: %w", err)
	}

	// Configurar pool de conexiones
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("error conectando a BD: %w", err)
	}

	return &EstadisticasService{db: db}, nil
}

// ObtenerEstadisticas obtiene las estadísticas de un negocio específico
func (s *EstadisticasService) ObtenerEstadisticas(ctx context.Context, negocioID string) (*EstadisticasData, error) {
	query := `
		SELECT 
			COUNT(*) as total_citas,
			COUNT(*) FILTER (WHERE fecha = CURRENT_DATE) as citas_hoy,
			COUNT(*) FILTER (WHERE estado = 'atendida') as citas_completadas,
			COUNT(*) FILTER (WHERE estado = 'cancelada') as citas_canceladas
		FROM citas
		WHERE negocio_id = $1
	`

	var stats EstadisticasData
	err := s.db.QueryRowContext(ctx, query, negocioID).Scan(
		&stats.TotalCitas,
		&stats.CitasHoy,
		&stats.CitasCompletadas,
		&stats.CitasCanceladas,
	)

	if err != nil {
		return nil, fmt.Errorf("error consultando estadísticas: %w", err)
	}

	stats.Timestamp = time.Now()
	return &stats, nil
}

// ObtenerTodosLosNegocios obtiene todos los IDs de negocios activos
func (s *EstadisticasService) ObtenerTodosLosNegocios(ctx context.Context) ([]string, error) {
	query := `SELECT id FROM negocios WHERE estado = true`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("error consultando negocios: %w", err)
	}
	defer rows.Close()

	var negocios []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			continue
		}
		negocios = append(negocios, id)
	}

	return negocios, nil
}

// Close cierra la conexión a la base de datos
func (s *EstadisticasService) Close() error {
	return s.db.Close()
}
