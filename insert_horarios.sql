-- Insertar horarios de atención para las estaciones existentes
-- Asumiendo que tienes estaciones con estos IDs (ajusta según tus datos)

-- Horarios para la estación "Segunda fila" (lunes a viernes, 9:00 - 18:00)
INSERT INTO horarios_atencion (estacion_id, dia_semana, hora_inicio, hora_fin) VALUES
-- Lunes (día 1)
('2c2e52b6-a1bc-45f9-a975-6a1088b8365e', 1, '09:00:00', '18:00:00'),
-- Martes (día 2)
('2c2e52b6-a1bc-45f9-a975-6a1088b8365e', 2, '09:00:00', '18:00:00'),
-- Miércoles (día 3)
('2c2e52b6-a1bc-45f9-a975-6a1088b8365e', 3, '09:00:00', '18:00:00'),
-- Jueves (día 4)
('2c2e52b6-a1bc-45f9-a975-6a1088b8365e', 4, '09:00:00', '18:00:00'),
-- Viernes (día 5)
('2c2e52b6-a1bc-45f9-a975-6a1088b8365e', 5, '09:00:00', '18:00:00');

-- Horarios para la estación "hg" (lunes a viernes, 10:00 - 17:00)
INSERT INTO horarios_atencion (estacion_id, dia_semana, hora_inicio, hora_fin) VALUES
-- Lunes (día 1)
('e4ea7e9b-f20a-4cce-bb4b-4f4c396f49d9', 1, '10:00:00', '17:00:00'),
-- Martes (día 2)
('e4ea7e9b-f20a-4cce-bb4b-4f4c396f49d9', 2, '10:00:00', '17:00:00'),
-- Miércoles (día 3)
('e4ea7e9b-f20a-4cce-bb4b-4f4c396f49d9', 3, '10:00:00', '17:00:00'),
-- Jueves (día 4)
('e4ea7e9b-f20a-4cce-bb4b-4f4c396f49d9', 4, '10:00:00', '17:00:00'),
-- Viernes (día 5)
('e4ea7e9b-f20a-4cce-bb4b-4f4c396f49d9', 5, '10:00:00', '17:00:00');

-- Nota: En este esquema, día_semana = 0 es Domingo, 1 es Lunes, ..., 6 es Sábado
-- El 29 de diciembre de 2025 es lunes, por lo que necesitas día_semana = 1
