-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE admin_sistema (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  nombre character varying NOT NULL,
  apellidos character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  telefono character varying,
  CONSTRAINT admin_sistema_pkey PRIMARY KEY (id),
  CONSTRAINT admin_sistema_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE TABLE citas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  servicio_id uuid,
  fecha date NOT NULL,
  hora_inicio time without time zone NOT NULL,
  hora_fin time without time zone NOT NULL,
  estado character varying DEFAULT 'pendiente'::character varying CHECK (estado::text = ANY (ARRAY['pendiente'::character varying, 'atendida'::character varying, 'cancelada'::character varying]::text[])),
  creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT citas_pkey PRIMARY KEY (id),
  CONSTRAINT citas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT citas_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES servicios(id)
);
CREATE TABLE estaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  negocio_id uuid,
  nombre character varying NOT NULL,
  estado character varying DEFAULT 'activo'::character varying CHECK (estado::text = ANY (ARRAY['activo'::character varying, 'inactivo'::character varying]::text[])),
  creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT estaciones_pkey PRIMARY KEY (id),
  CONSTRAINT estaciones_negocio_id_fkey FOREIGN KEY (negocio_id) REFERENCES negocios(id)
);
CREATE TABLE fila (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  estacion_id uuid,
  fecha date NOT NULL,
  hora_inicio time without time zone NOT NULL,
  hora_fin time without time zone NOT NULL,
  estado character varying DEFAULT 'abierta'::character varying CHECK (estado::text = ANY (ARRAY['abierta'::character varying, 'cerrada'::character varying]::text[])),
  creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fila_pkey PRIMARY KEY (id),
  CONSTRAINT fila_estacion_id_fkey FOREIGN KEY (estacion_id) REFERENCES estaciones(id)
);
CREATE TABLE horarios_atencion (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  estacion_id uuid,
  dia_semana integer CHECK (dia_semana >= 1 AND dia_semana <= 7),
  hora_inicio time without time zone NOT NULL,
  hora_fin time without time zone NOT NULL,
  creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT horarios_atencion_pkey PRIMARY KEY (id),
  CONSTRAINT horarios_atencion_estacion_id_fkey FOREIGN KEY (estacion_id) REFERENCES estaciones(id)
);
CREATE TABLE negocios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_negocio_id uuid,
  nombre character varying NOT NULL,
  categoria character varying NOT NULL,
  descripcion text,
  telefono character varying,
  correo character varying,
  imagen_url character varying,
  estado boolean DEFAULT true,
  hora_atencion character varying,
  creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT negocios_pkey PRIMARY KEY (id),
  CONSTRAINT negocios_admin_negocio_id_fkey FOREIGN KEY (admin_negocio_id) REFERENCES usuarios(id)
);
CREATE TABLE servicios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre character varying NOT NULL,
  codigo character varying,
  descripcion text,
  duracion_minutos integer NOT NULL,
  capacidad integer DEFAULT 1,
  requiere_cita boolean DEFAULT true,
  precio_centavos integer DEFAULT 0,
  visible boolean DEFAULT true,
  creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT servicios_pkey PRIMARY KEY (id)
);
CREATE TABLE usuarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre character varying NOT NULL,
  apellido character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  password character varying NOT NULL,
  rol character varying NOT NULL CHECK (rol::text = ANY (ARRAY['cliente'::character varying, 'adminNegocio'::character varying]::text[])),
  telefono character varying,
  creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT usuarios_pkey PRIMARY KEY (id)
);