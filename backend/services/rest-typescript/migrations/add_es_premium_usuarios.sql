# Migración SQL: Agregar campo es_premium a tabla usuarios
# Fecha: 2026-01-03

-- Agregar columna es_premium a usuarios si no existe
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS es_premium BOOLEAN NOT NULL DEFAULT false;

-- Crear índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_usuarios_es_premium ON usuarios(es_premium) WHERE es_premium = true;

-- Comentario
COMMENT ON COLUMN usuarios.es_premium IS 'Indica si el usuario tiene suscripción premium activa con prioridad en filas';
