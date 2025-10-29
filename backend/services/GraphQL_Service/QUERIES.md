# Queries disponibles en GraphQL Service

Endpoint GraphQL: `http://localhost:3001/graphql`

Este documento lista las queries expuestas por el esquema GraphQL del servicio y ejemplos de cómo invocarlas (consulta GraphQL y ejemplo con curl). Los nombres y descripciones se obtuvieron del archivo `schema.py`.

---

## Notas rápidas
- Puedes abrir `http://localhost:3001/graphql` en el navegador para usar el Playground/GraphiQL si el servidor lo permite.
- Todas las peticiones usan POST a `/graphql` con JSON: `{ "query": "..." }`.
- IMPORTANT: El servidor GraphQL reenvía la cabecera `Authorization` (por ejemplo `Authorization: Bearer <JWT>`) a la API REST interna. Si el frontend guarda el JWT, inclúyelo en la cabecera cuando llames al endpoint GraphQL para que las llamadas REST posteriores se realicen autenticadas.

---

## Queries de Usuarios

### usuarios
- Descripción: Obtener todos los usuarios.
- Argumentos: ninguno
- Retorna: `[Usuario]`

Ejemplo de consulta:

query {
  usuarios {
    id
    nombre_completo
    email
    telefono
    rol
    creado_en
  }
}

Ejemplo curl (con token en header):

```bash
curl -s -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query":"{ usuarios { id nombre_completo email telefono rol creado_en } }"}'
```

---

### usuario(id: String)
- Descripción: Obtener un usuario por ID.
- Argumentos:
  - `id` (String!)
- Retorna: `Usuario`

Ejemplo de consulta:

query {
  usuario(id: "USER_ID") {
    id
    nombre_completo
    email
    telefono
    rol
    creado_en
  }
}

Ejemplo curl (con token en header):

```bash
curl -s -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query":"{ usuario(id:\"USER_ID\") { id nombre_completo email telefono rol creado_en } }"}'
```

---

### usuarios_con_citas_pendientes
- Descripción: Lista los usuarios con sus citas pendientes.
- Argumentos: ninguno
- Retorna: `[UsuarioCitasDTO]` (contiene `usuario` y `citas` con `fecha` y `servicio`)

Ejemplo consulta:

query {
  usuarios_con_citas_pendientes {
    usuario
    citas {
      fecha
      servicio
    }
  }
}

Ejemplo curl (con token en header):

```bash
curl -s -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query":"{ usuarios_con_citas_pendientes { usuario citas { fecha servicio } } }"}'
```

---

### usuarios_con_citas_atendidas
- Descripción: Lista los usuarios con sus citas atendidas.
- Argumentos: ninguno
- Retorna: `[UsuarioCitasDTO]`

---

### perfil_completo_usuario(usuario_id: String)
- Descripción: Perfil completo del usuario con métricas de citas.
- Argumentos:
  - `usuario_id` (String!)
- Retorna: `PerfilCompletoUsuario` (campos: `id, nombre, email, telefono, total_citas, citas_completadas, citas_pendientes, citas_canceladas`)

Ejemplo:

{
  perfilCompletoUsuario(usuarioId: "djdavidjaramillo@gmail.com") {
    id
    nombreCompleto
    email
    telefono
    totalCitas
    citasCompletadas
    citasPendientes
    citasCanceladas
  }
}

> Nota: Esta query requiere que incluyas la cabecera `Authorization` con el JWT, porque obtiene datos desde la API REST autenticada.

Ejemplo curl (obligatorio incluir token):

```bash
curl -s -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query":"{ perfil_completo_usuario(usuario_id:\"USER_ID\") { id nombre email telefono total_citas citas_completadas citas_pendientes citas_canceladas } }"}'
```

---

## Queries de Citas

### citas
- Descripción: Obtener todas las citas.
- Argumentos: ninguno
- Retorna: `[Cita]`

Campos comunes de `Cita`: `id, usuario_id, servicio_id, negocio_id, fecha, estado, notas, creado_en`.

Ejemplo:

query {
  citas {
    id
    usuario_id
    servicio_id
    fecha
    estado
  }
}

Ejemplo curl (con token opcional):

```bash
curl -s -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query":"{ citas { id usuario_id servicio_id fecha estado } }"}'
```

---

### cita(id: String)
- Descripción: Obtener una cita por ID.
- Argumentos: `id` (String!)
- Retorna: `Cita`

---

### metricas_temporales
- Descripción: Métricas temporales de citas (totales, hoy, semana, mes).
- Argumentos: ninguno
- Retorna: `MetricasTemporales` (`total_citas, citas_hoy, citas_semana, citas_mes`)

Ejemplo:

query {
  metricas_temporales {
    total_citas
    citas_hoy
    citas_semana
    citas_mes
  }
}

Ejemplo curl (con token opcional):

```bash
curl -s -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query":"{ metricas_temporales { total_citas citas_hoy citas_semana citas_mes } }"}'
```

---

## Queries de Servicios y Negocios

### servicios
- Descripción: Obtener todos los servicios.
- Argumentos: ninguno
- Retorna: `[Servicio]`

Ejemplo:

query {
  servicios {
    id
    nombre
    descripcion
  }
}

Ejemplo curl (con token opcional):

```bash
curl -s -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query":"{ servicios { id nombre descripcion } }"}'
```

---

### servicio(id: String)
- Descripción: Obtener un servicio por ID.
- Argumentos: `id` (String!)
- Retorna: `Servicio`

---

### ranking_servicios
- Descripción: Ranking de servicios más solicitados.
- Argumentos: ninguno
- Retorna: `[RankingServicios]` (estructura dependiente del tipo)

---

### negocios
- Descripción: Obtener todos los negocios.
- Argumentos: ninguno
- Retorna: `[Negocio]`

### negocio(id: String)
- Descripción: Obtener un negocio por ID.
- Argumentos: `id` (String!)
- Retorna: `Negocio`

### dashboard_negocio(negocio_id: String)
- Descripción: Dashboard con métricas para un negocio.
- Argumentos: `negocio_id` (String!)
- Retorna: `DashboardNegocio`

### resumen_negocio(negocio_id: String)
- Descripción: Resumen del negocio.
- Argumentos: `negocio_id` (String!)
- Retorna: `ResumenNegocio`

---

## Queries de Estaciones

### estaciones
- Descripción: Obtener todas las estaciones.
- Argumentos: ninguno
- Retorna: `[Estacion]`

### estacion(id: String)
- Descripción: Obtener una estación por ID.
- Argumentos: `id` (String!)
- Retorna: `Estacion`

---

## Queries de Fila

### filas
- Descripción: Obtener todas las filas.
- Argumentos: ninguno
- Retorna: `[Fila]`

### fila(id: String)
- Descripción: Obtener una fila por ID.
- Argumentos: `id` (String!)
- Retorna: `Fila`

---

## Queries de Horarios de Atención

### horarios_atencion
- Descripción: Obtener todos los horarios de atención.
- Argumentos: ninguno
- Retorna: `[HorarioAtencion]`

### horario_atencion(id: String)
- Descripción: Obtener un horario por ID.
- Argumentos: `id` (String!)
- Retorna: `HorarioAtencion`

---

## Queries de Admin Sistema

### admin_sistema
- Descripción: Obtener todos los administradores del sistema.
- Argumentos: ninguno
- Retorna: `[AdminSistema]`

---

## Ejemplo completo con curl (obtener un usuario y sus citas pendientes)

```bash
curl -s -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query":"{ usuario(id:\"USER_ID\") { id nombre_completo email } usuarios_con_citas_pendientes { usuario citas { fecha servicio } } }"}'
```

---

## Notas finales
- Si necesitas ejemplos adicionales (mutations o esquemas de input), indícalo y los agregaré.
- Si quieres que el archivo incluya fragmentos con todos los campos posibles para cada tipo, puedo auto-generarlos leyendo los `gql_types/*` y agregarlos.
