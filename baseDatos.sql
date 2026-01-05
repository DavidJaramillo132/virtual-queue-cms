-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_sistema (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  usuario_id uuid NOT NULL UNIQUE,
  nombre character varying NOT NULL DEFAULT ''::character varying,
  apellidos character varying NOT NULL DEFAULT ''::character varying,
  telefono character varying,
  CONSTRAINT admin_sistema_pkey PRIMARY KEY (id),
  CONSTRAINT fk_admin_sistema_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.citas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cliente_id uuid NOT NULL,
  negocio_id uuid NOT NULL,
  estacion_id uuid,
  servicio_id uuid NOT NULL,
  fecha date NOT NULL,
  hora_inicio time without time zone NOT NULL,
  hora_fin time without time zone NOT NULL,
  estado USER-DEFINED NOT NULL DEFAULT 'pendiente'::citas_estado_enum,
  creado_en timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT citas_pkey PRIMARY KEY (id),
  CONSTRAINT fk_citas_cliente FOREIGN KEY (cliente_id) REFERENCES public.usuarios(id),
  CONSTRAINT fk_citas_negocio FOREIGN KEY (negocio_id) REFERENCES public.negocios(id),
  CONSTRAINT fk_citas_estacion FOREIGN KEY (estacion_id) REFERENCES public.estaciones(id),
  CONSTRAINT fk_citas_servicio FOREIGN KEY (servicio_id) REFERENCES public.servicios(id)
);
CREATE TABLE public.estacion_servicios (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  estacion_id uuid NOT NULL,
  servicio_id uuid NOT NULL,
  CONSTRAINT estacion_servicios_pkey PRIMARY KEY (id),
  CONSTRAINT fk_estacion_servicios_estacion FOREIGN KEY (estacion_id) REFERENCES public.estaciones(id),
  CONSTRAINT fk_estacion_servicios_servicio FOREIGN KEY (servicio_id) REFERENCES public.servicios(id)
);
CREATE TABLE public.estaciones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  negocio_id uuid NOT NULL,
  nombre character varying NOT NULL DEFAULT ''::character varying,
  tipo character varying,
  estado USER-DEFINED NOT NULL DEFAULT 'activa'::estaciones_estado_enum,
  creado_en timestamp without time zone NOT NULL DEFAULT now(),
  solo_premium boolean NOT NULL DEFAULT false,
  CONSTRAINT estaciones_pkey PRIMARY KEY (id),
  CONSTRAINT fk_estaciones_negocio FOREIGN KEY (negocio_id) REFERENCES public.negocios(id)
);
CREATE TABLE public.horarios_atencion (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  estacion_id uuid NOT NULL,
  dia_semana smallint NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  hora_inicio time without time zone NOT NULL,
  hora_fin time without time zone NOT NULL,
  creado_en timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT horarios_atencion_pkey PRIMARY KEY (id),
  CONSTRAINT fk_horarios_estacion FOREIGN KEY (estacion_id) REFERENCES public.estaciones(id)
);
CREATE TABLE public.negocios (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  admin_negocio_id uuid,
  nombre character varying NOT NULL DEFAULT ''::character varying,
  categoria character varying NOT NULL DEFAULT ''::character varying,
  descripcion text,
  telefono character varying,
  correo character varying,
  direccion character varying,
  imagen_url character varying,
  estado boolean NOT NULL DEFAULT true,
  horario_general character varying,
  creado_en timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT negocios_pkey PRIMARY KEY (id),
  CONSTRAINT negocios_admin_negocio_id_fkey FOREIGN KEY (admin_negocio_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.servicios (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  negocio_id uuid NOT NULL,
  nombre character varying NOT NULL DEFAULT ''::character varying,
  descripcion text,
  duracion_minutos integer NOT NULL,
  precio_centavos integer NOT NULL DEFAULT 0,
  creado_en timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT servicios_pkey PRIMARY KEY (id),
  CONSTRAINT fk_servicios_negocio FOREIGN KEY (negocio_id) REFERENCES public.negocios(id)
);
CREATE TABLE public.usuarios (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email character varying NOT NULL UNIQUE,
  password character varying NOT NULL,
  rol USER-DEFINED NOT NULL DEFAULT 'cliente'::rol_usuario_enum,
  telefono character varying,
  nombre_completo character varying NOT NULL DEFAULT ''::character varying,
  creado_en timestamp without time zone NOT NULL DEFAULT now(),
  es_premium boolean NOT NULL DEFAULT false,
  CONSTRAINT usuarios_pkey PRIMARY KEY (id)
);