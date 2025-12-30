INSERT INTO usuarios (id, email, password, rol, nombre_completo, creado_en) 
VALUES ('00000000-0000-0000-0000-000000000001', 'cliente-prueba@test.com', 'password123', 'cliente', 'Cliente de Prueba', NOW())
ON CONFLICT (id) DO NOTHING;
