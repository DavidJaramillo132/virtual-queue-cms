-- Migración: Agregar columna solo_premium a estaciones
-- Fecha: 2026-01-03
-- Descripción: Permite marcar estaciones/filas como exclusivas para usuarios premium

-- Agregar columna solo_premium a la tabla estaciones
ALTER TABLE estaciones 
ADD COLUMN IF NOT EXISTS solo_premium BOOLEAN NOT NULL DEFAULT false;

-- Crear índice para búsquedas de estaciones premium
CREATE INDEX IF NOT EXISTS idx_estaciones_solo_premium 
ON estaciones(solo_premium) 
WHERE solo_premium = true;

-- Comentario descriptivo
COMMENT ON COLUMN estaciones.solo_premium IS 'Indica si la estación/fila es exclusiva para usuarios con suscripción premium';
