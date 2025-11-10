# WebSocket Server - Real-time Statistics

Servidor WebSocket implementado en Go para proporcionar actualizaciones en tiempo real de las estadísticas de citas del sistema.

## 🚀 Características

- ✅ Actualizaciones en tiempo real cuando se crean/actualizan/cancelan citas
- ✅ Notificaciones instantáneas desde el REST API (sin polling)
- ✅ Autenticación JWT
- ✅ Subscripción por canales (por negocio)
- ✅ Reconexión automática
- ✅ Independiente del servicio REST (alta disponibilidad)
- ✅ Optimizado con Gorilla WebSocket

## 📊 Estadísticas proporcionadas

- **Citas Hoy**: Total de citas programadas para hoy
- **Total de Citas**: Todas las citas en el sistema
- **Citas Completadas**: Citas con estado "atendida"
- **Citas Canceladas**: Citas con estado "cancelada"

## 🔧 Configuración

### Variables de entorno

```bash
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
JWT_SECRET=tu_secret_key
```

### Instalación de dependencias

```bash
go mod download
```

### Ejecutar localmente

```bash
go run cmd/main.go
```

### Compilar

```bash
go build -o websocket-server cmd/main.go
```

## 🐳 Docker

### Construir imagen

```bash
docker build -t websocket-server .
```

### Ejecutar contenedor

```bash
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="your_secret" \
  websocket-server
```

## 📡 Uso del WebSocket

### Conectar (desde el frontend)

```typescript
const token = localStorage.getItem('access_token');
const ws = new WebSocket(`ws://localhost:8080/ws?token=${token}`);
```

### Suscribirse a un canal

```json
{
  "type": "subscribe",
  "data": {
    "channel": "estadisticas:negocio_123"
  }
}
```

### Recibir estadísticas (actualizaciones en tiempo real)

```json
{
  "type": "stats",
  "data": {
    "negocio_id": "negocio_123",
    "citas_hoy": 12,
    "total_citas": 156,
    "citas_completadas": 142,
    "citas_canceladas": 8,
    "timestamp": 1234567890
  }
}
```

## 🔔 Endpoint de Notificaciones (REST API)

El servidor WebSocket expone un endpoint HTTP para recibir notificaciones del REST API cuando se crean, actualizan o cancelan citas:

### POST `/notify/cita`

**Body:**
```json
{
  "negocio_id": "uuid-del-negocio",
  "action": "created" // "created", "updated", "deleted", "status_changed"
}
```

**Response:**
- `200 OK`: Notificación procesada correctamente
- `400 Bad Request`: Datos inválidos
- `500 Internal Server Error`: Error al obtener estadísticas

Este endpoint es llamado automáticamente por el REST API cuando se realizan cambios en las citas. No es necesario llamarlo manualmente desde el frontend.

## 🏗️ Arquitectura

```
cmd/
  main.go           # Punto de entrada, polling loop
internal/
  handlers/
    websocket.go    # Handler HTTP -> WebSocket upgrade
  hub/
    hub.go          # Gestión de conexiones y canales
    client.go       # Cliente WebSocket individual
  models/
    message.go      # Tipos de mensajes
  services/
    estadisticas_service.go  # Consultas a la BD
  utils/
    auth.go         # Validación JWT
```

## 🔐 Seguridad

- ✅ Autenticación JWT obligatoria
- ✅ Validación de token en cada conexión
- ✅ Subscripción solo a canales autorizados
- ✅ Sin exposición de datos sensibles

## 🚦 Estados de conexión

- **Conectado** (verde): Recibiendo actualizaciones en tiempo real
- **Desconectado** (rojo): Sin conexión, intentando reconectar
- **Reconectando**: Reintentos automáticos con backoff exponencial

## 📈 Optimizaciones

- Actualizaciones en tiempo real (sin polling innecesario)
- Notificaciones solo cuando hay cambios reales
- Query optimizado con `FILTER` en PostgreSQL
- Broadcast solo a clientes suscritos
- Buffer de mensajes de 256 por cliente
- Graceful shutdown

## 🔄 Flujo de datos

```mermaid
graph LR
    A[Frontend] -->|Crea/Actualiza Cita| B[REST API]
    B -->|Notifica| C[WebSocket Server]
    C -->|Consulta BD| D[Base de Datos]
    D -->|Estadísticas| C
    C -->|Broadcast| E[Hub]
    E -->|Mensaje WebSocket| F[Client 1]
    E -->|Mensaje WebSocket| G[Client 2]
    E -->|Mensaje WebSocket| H[Client N]
    F -->|Actualiza UI| I[Frontend Angular]
    G -->|Actualiza UI| I
    H -->|Actualiza UI| I
```

## 📝 Notas

- El servidor funciona independientemente del REST API
- Las actualizaciones se envían solo cuando hay cambios reales (creación, actualización, cancelación de citas)
- Conexión persistente con reconexión automática
- Compatible con múltiples negocios simultáneamente
- El REST API debe estar configurado para notificar al WebSocket cuando se realizan cambios en las citas

## 🐛 Troubleshooting

### Error: "Cannot connect to database"
- Verificar DATABASE_URL
- Comprobar conectividad a PostgreSQL
- Revisar credenciales

### Error: "Invalid JWT token"
- Verificar JWT_SECRET coincide con el del REST API
- Comprobar que el token no haya expirado
- Validar formato del token

### No se reciben actualizaciones
- Verificar subscripción al canal correcto
- Comprobar que el negocio_id existe en la BD
- Revisar logs del servidor

## 📚 Referencias

- [Gorilla WebSocket](https://github.com/gorilla/websocket)
- [PostgreSQL FILTER](https://www.postgresql.org/docs/current/sql-expressions.html#SYNTAX-AGGREGATES)
- [JWT Authentication](https://jwt.io/)
