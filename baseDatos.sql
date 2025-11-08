CREATE TYPE "rol_usuario_enum" AS ENUM (
  'cliente',
  'negocio',
  'admin_sistema'
);

CREATE TYPE "citas_estado_enum" AS ENUM (
  'pendiente',
  'atendida',
  'cancelada'
);

CREATE TYPE "estaciones_estado_enum" AS ENUM (
  'activa',
  'inactiva'
);

CREATE TABLE "usuarios" (
  "id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "email" varchar UNIQUE NOT NULL,
  "password" varchar NOT NULL,
  "rol" rol_usuario_enum NOT NULL DEFAULT 'cliente',
  "telefono" varchar,
  "nombre_completo" varchar NOT NULL DEFAULT '',
  "creado_en" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "admin_sistema" (
  "id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "usuario_id" uuid UNIQUE NOT NULL,
  "nombre" varchar NOT NULL DEFAULT '',
  "apellidos" varchar NOT NULL DEFAULT '',
  "telefono" varchar
);

CREATE TABLE "negocios" (
  "id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "admin_negocio_id" uuid,
  "nombre" varchar NOT NULL DEFAULT '',
  "categoria" varchar NOT NULL DEFAULT '',
  "descripcion" text,
  "telefono" varchar,
  "correo" varchar,
  "direccion" varchar,
  "imagen_url" varchar,
  "estado" boolean NOT NULL DEFAULT true,
  "horario_general" varchar,
  "creado_en" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "estaciones" (
  "id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "negocio_id" uuid NOT NULL,
  "nombre" varchar NOT NULL DEFAULT '',
  "tipo" varchar,
  "estado" estaciones_estado_enum NOT NULL DEFAULT 'activa',
  "creado_en" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "servicios" (
  "id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "negocio_id" uuid NOT NULL,
  "nombre" varchar NOT NULL DEFAULT '',
  "descripcion" text,
  "duracion_minutos" integer NOT NULL,
  "precio_centavos" integer NOT NULL DEFAULT 0,
  "creado_en" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "estacion_servicios" (
  "id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "estacion_id" uuid NOT NULL,
  "servicio_id" uuid NOT NULL
);

CREATE TABLE "horarios_atencion" (
  "id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "estacion_id" uuid NOT NULL,
  "dia_semana" smallint NOT NULL,
  "hora_inicio" time NOT NULL,
  "hora_fin" time NOT NULL,
  "creado_en" timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT "ck_dia_semana" CHECK (dia_semana BETWEEN 0 AND 6),
  CONSTRAINT "ck_hora_rango" CHECK (hora_fin > hora_inicio)
);

CREATE TABLE "citas" (
  "id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "cliente_id" uuid NOT NULL,
  "negocio_id" uuid NOT NULL,
  "estacion_id" uuid,
  "servicio_id" uuid NOT NULL,
  "fecha" date NOT NULL,
  "hora_inicio" time NOT NULL,
  "hora_fin" time NOT NULL,
  "estado" citas_estado_enum NOT NULL DEFAULT 'pendiente',
  "creado_en" timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT "ck_citas_hora_rango" CHECK (hora_fin > hora_inicio)
);

CREATE UNIQUE INDEX "uq_estacion_servicio" ON "estacion_servicios" ("estacion_id", "servicio_id");

CREATE INDEX "idx_horarios_estacion_dia" ON "horarios_atencion" ("estacion_id", "dia_semana");

CREATE INDEX "idx_citas_cliente_fecha" ON "citas" ("cliente_id", "fecha");

CREATE INDEX "idx_citas_negocio_fecha" ON "citas" ("negocio_id", "fecha");

ALTER TABLE "admin_sistema" ADD CONSTRAINT "fk_admin_sistema_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE;

ALTER TABLE "negocios" ADD FOREIGN KEY ("admin_negocio_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL;

ALTER TABLE "estaciones" ADD CONSTRAINT "fk_estaciones_negocio" FOREIGN KEY ("negocio_id") REFERENCES "negocios" ("id") ON DELETE CASCADE;

ALTER TABLE "servicios" ADD CONSTRAINT "fk_servicios_negocio" FOREIGN KEY ("negocio_id") REFERENCES "negocios" ("id") ON DELETE CASCADE;

ALTER TABLE "estacion_servicios" ADD CONSTRAINT "fk_estacion_servicios_estacion" FOREIGN KEY ("estacion_id") REFERENCES "estaciones" ("id") ON DELETE CASCADE;

ALTER TABLE "estacion_servicios" ADD CONSTRAINT "fk_estacion_servicios_servicio" FOREIGN KEY ("servicio_id") REFERENCES "servicios" ("id") ON DELETE CASCADE;

ALTER TABLE "horarios_atencion" ADD CONSTRAINT "fk_horarios_estacion" FOREIGN KEY ("estacion_id") REFERENCES "estaciones" ("id") ON DELETE CASCADE;

ALTER TABLE "citas" ADD CONSTRAINT "fk_citas_cliente" FOREIGN KEY ("cliente_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT;

ALTER TABLE "citas" ADD CONSTRAINT "fk_citas_negocio" FOREIGN KEY ("negocio_id") REFERENCES "negocios" ("id") ON DELETE RESTRICT;

ALTER TABLE "citas" ADD CONSTRAINT "fk_citas_estacion" FOREIGN KEY ("estacion_id") REFERENCES "estaciones" ("id") ON DELETE SET NULL;

ALTER TABLE "citas" ADD CONSTRAINT "fk_citas_servicio" FOREIGN KEY ("servicio_id") REFERENCES "servicios" ("id") ON DELETE RESTRICT;
