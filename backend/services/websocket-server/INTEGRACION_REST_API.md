# 🔗 Integración: WebSocket + REST API

## Resumen Ejecutivo

El **WebSocket Server** y el **REST API (TypeScript)** trabajan juntos para:
1. **REST API**: Operaciones CRUD (crear, actualizar, eliminar citas)
2. **WebSocket**: Notifica cambios en tiempo real a clientes conectados

---

## Arquitectura de Integración

```
┌──────────────────────┐
│   Cliente Angular    │
└──────────┬───────────┘
           │
      ┌────┴─────┐
      │           │
      ▼           ▼
  REST API    WebSocket
  (Citas)     (Notificaciones)
      │           │
      └─────┬─────┘
            │
            ▼
      PostgreSQL
      (Base de datos)
```

### Flujo Detallado

```
1. Usuario crea cita en Angular
   └─> CitaService.createCita()
       └─> POST /api/citas

2. REST API recibe y valida
   └─> CitaController.create()
       └─> Guarda en PostgreSQL

3. REST API notifica a WebSocket
   └─> WebSocketNotificationService.notifyCitaChange()
       └─> HTTP POST localhost:8080/notify/cita

4. WebSocket Server recibe notificación
   └─> Handler procesa evento
       └─> Busca canales relevantes

5. WebSocket distribuye a clientes
   └─> Hub.BroadcastToChannel()
       └─> Todos los clientes suscritos reciben

6. Angular recibe en tiempo real
   └─> EstadisticasComponent.subscribe()
       └─> UI se actualiza automáticamente
```

---

## WebSocketNotificationService

**Ubicación**: `backend/services/rest-typescript/src/services/websocket-notification.service.ts`

**Responsabilidad**: Notificar al servidor WebSocket sobre cambios en citas

### Cómo funciona

```typescript
// En REST API (Node.js/TypeScript)

import { WebSocketNotificationService } from './services/websocket-notification.service';

const wsNotif = new WebSocketNotificationService();

// Cuando se crea una cita
app.post('/api/citas', async (req, res) => {
  try {
    const cita = await CitaService.create(req.body);
    
    // Notificar al WebSocket Server
    await wsNotif.notifyCitaChange(cita.negocio_id, 'created');
    
    res.json(cita);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cuando se actualiza una cita
app.put('/api/citas/:id', async (req, res) => {
  try {
    const cita = await CitaService.update(req.params.id, req.body);
    
    // Notificar al WebSocket Server
    await wsNotif.notifyCitaChange(cita.negocio_id, 'updated');
    
    res.json(cita);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Método notifyCitaChange

```typescript
async notifyCitaChange(negocioId: string, action: string): Promise<void> {
  try {
    // Enviar HTTP POST al WebSocket Server
    await axios.post(
      `${this.websocketUrl}/notify/cita`,  // http://localhost:8080/notify/cita
      {
        negocio_id: negocioId,
        action: action  // 'created', 'updated', 'deleted', 'status_changed'
      },
      { timeout: 5000 }
    );
    
    console.log(`Notificación enviada: ${action} para negocio ${negocioId}`);
  } catch (error) {
    console.error(`Error notificando WebSocket: ${error.message}`);
    // No lanzar error para no afectar operación principal
  }
}
```

---

## Integración Paso a Paso

### Paso 1: REST API notifica WebSocket

**En CitaController.ts**:

```typescript
import { WebSocketNotificationService } from '../services/websocket-notification.service';

export class CitaController {
  private wsNotification: WebSocketNotificationService;

  constructor() {
    this.wsNotification = new WebSocketNotificationService();
  }

  // Crear cita
  async create(req: Request, res: Response) {
    try {
      const citaData = req.body;
      const cita = await CitaRepo.create(citaData);

      // 🔔 Notificar al WebSocket
      await this.wsNotification.notifyCitaChange(
        cita.negocio_id,
        'created'
      );

      res.status(201).json(cita);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Actualizar estado de cita
  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      const cita = await CitaRepo.updateStatus(id, estado);

      // 🔔 Notificar al WebSocket
      await this.wsNotification.notifyCitaChange(
        cita.negocio_id,
        'status_changed'
      );

      res.json(cita);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Eliminar cita
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const cita = await CitaRepo.getById(id);

      await CitaRepo.delete(id);

      // 🔔 Notificar al WebSocket
      await this.wsNotification.notifyCitaChange(
        cita.negocio_id,
        'deleted'
      );

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

### Paso 2: WebSocket Server recibe notificación

**En main.go**:

```go
// Endpoint para recibir notificaciones del REST API
router.HandleFunc("/notify/cita", func(w http.ResponseWriter, r *http.Request) {
  if r.Method != "POST" {
    http.Error(w, "Método no permitido", http.StatusMethodNotAllowed)
    return
  }

  var notification struct {
    NegocioID string `json:"negocio_id"`
    Action    string `json:"action"`
  }

  err := json.NewDecoder(r.Body).Decode(&notification)
  if err != nil {
    http.Error(w, "Solicitud inválida", http.StatusBadRequest)
    return
  }

  // Crear mensaje para WebSocket
  message := Message{
    Type: "cita_" + notification.Action,  // "cita_created", "cita_updated", etc.
    Channel: "estadisticas:" + notification.NegocioID,
    Data: map[string]interface{}{
      "action": notification.Action,
      "timestamp": time.Now(),
    },
  }

  // Enviar a todos los clientes suscritos
  hub.BroadcastToChannel(message)

  w.Header().Set("Content-Type", "application/json")
  json.NewEncoder(w).Encode(map[string]string{
    "status": "notificación recibida",
  })
}).Methods("POST")
```

### Paso 3: Frontend recibe actualización

**En EstadisticasService.ts**:

```typescript
// Escuchar cambios de citas
onCitaChange(): Observable<any> {
  return this.websocketService.filterByType('cita_created')
    .pipe(
      merge(this.websocketService.filterByType('cita_updated')),
      merge(this.websocketService.filterByType('cita_deleted')),
      merge(this.websocketService.filterByType('status_changed'))
    );
}
```

**En EstadisticasComponent.ts**:

```typescript
ngOnInit() {
  // Escuchar cambios en citas
  this.estadisticasService.onCitaChange()
    .pipe(takeUntil(this.destroy$))
    .subscribe((cambio) => {
      console.log('Cambio detectado:', cambio);

      // Forzar actualización de estadísticas
      this.cargarEstadisticas();

      // O mostrar notificación
      this.mostrarNotificacion(cambio);
    });
}

private mostrarNotificacion(cambio: any) {
  switch (cambio.action) {
    case 'created':
      this.toastr.success('Nueva cita creada en tiempo real');
      break;
    case 'updated':
      this.toastr.info('Cita actualizada');
      break;
    case 'deleted':
      this.toastr.warning('Cita eliminada');
      break;
    case 'status_changed':
      this.toastr.info('Estado de cita actualizado');
      break;
  }
}
```

---

## Secuencia de Eventos Completa

### Escenario: Usuario A marca una cita como completada

```
1️⃣ Usuario A en Angular
   ┌─────────────────────────────────────┐
   │ cita-list.component.html            │
   │ <button (click)="marcarCompletada()">│
   └────────────────┬────────────────────┘
                    │
2️⃣ CitaService
   ┌─────────────────────────────────────┐
   │ this.http.put(/api/citas/123, {...})│
   └────────────────┬────────────────────┘
                    │
3️⃣ REST API (TypeScript)
   ┌─────────────────────────────────────┐
   │ PUT /api/citas/123                  │
   │ CitaController.updateStatus()       │
   │ - Actualiza en BD                   │
   │ - Notifica WebSocket ✔️            │
   └────────────────┬────────────────────┘
                    │
4️⃣ WebSocket Notification
   ┌─────────────────────────────────────┐
   │ POST localhost:8080/notify/cita    │
   │ { action: "status_changed" }       │
   └────────────────┬────────────────────┘
                    │
5️⃣ WebSocket Server (Go)
   ┌─────────────────────────────────────┐
   │ Handler recibe notificación         │
   │ Crea Message type: "status_changed"│
   │ Hub.BroadcastToChannel()            │
   └────────────────┬────────────────────┘
                    │
          ┌─────────┴──────────┐
          │                    │
6️⃣ Cliente A         6️⃣ Cliente B
   ┌──────────────┐  ┌──────────────┐
   │ Suscrito:    │  │ Suscrito:    │
   │ estadísticas │  │ estadísticas │
   │ :negocio_123 │  │ :negocio_123 │
   └──────┬───────┘  └──────┬───────┘
          │                 │
7️⃣ Reciben mensaje:
   { type: "status_changed", data: {...} }
          │                 │
          ▼                 ▼
   Ambos actualizan UI
   - Cita marca como completada
   - Total de completadas aumenta
   - Gráficos se actualizan
```

---

## Variables de Entorno Necesarias

### En REST API (.env)

```env
# Existentes
DB_HOST=db.ahyeuobiaxqzezqubjox.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASS=contraseña
DB_NAME=postgres

# Nuevo - WebSocket
WEBSOCKET_URL=http://localhost:8080
# O si está en Docker
# WEBSOCKET_URL=http://websocket-server:8080
```

### En WebSocket Server (.env)

```env
JWT_SECRET=clave123
DATABASE_URL=postgres://postgres:contraseña@db.ahyeuobiaxqzezqubjox.supabase.co:5432/postgres?sslmode=require&connect_timeout=30
```

---

## Endpoints del WebSocket Server

| Endpoint | Método | Descripción | Body |
|----------|--------|-------------|------|
| `/ws` | WebSocket | Conexión principal | `?token=JWT` |
| `/notify/cita` | POST | Notificar cambio de cita | `{ negocio_id, action }` |
| `/health` | GET | Verificar salud | - |

---

## Timing y Latencia

### Tiempo Aproximado de Propagación

```
REST API recibe → Procesa → Notifica WebSocket
     ↓                ↓            ↓
   10ms          10-50ms        5-20ms
                          Total: 25-80ms

WebSocket distribuye → Cliente recibe → Actualiza UI
        ↓                    ↓            ↓
     5-10ms             5-20ms        100-200ms
                    Total: 110-230ms

Tiempo total UI: 135-310ms
(Prácticamente instantáneo para usuario)
```

---

## Manejo de Errores

### Si WebSocket Server no está disponible

```typescript
// WebSocketNotificationService captura el error
async notifyCitaChange(negocioId: string, action: string) {
  try {
    await axios.post(
      `${this.websocketUrl}/notify/cita`,
      { negocio_id: negocioId, action }
    );
  } catch (error) {
    // NO lanzar error - solo loggear
    console.error(`WebSocket notificación falló: ${error.message}`);
    // La operación de crear/actualizar cita continúa exitosa
    // Los clientes tendrán que esperar a que WebSocket se recupere
  }
}
```

### Si hay múltiples instancias del REST API

Todos notifican al mismo WebSocket Server:

```
REST API 1 ─┐
REST API 2 ─┼──> WebSocket Server → Clientes
REST API 3 ─┘
```

---

## Testing

### Test 1: Crear Cita y Verificar WebSocket

```bash
# Terminal 1: Iniciar WebSocket Server
cd backend/services/websocket-server/cmd
go run main.go

# Terminal 2: Iniciar REST API
cd backend/services/rest-typescript
npm run dev

# Terminal 3: Conectar WebSocket Client
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  "http://localhost:8080/ws?token=tu_jwt_token"

# Terminal 4: Crear cita vía REST API
curl -X POST http://localhost:3000/api/citas \
  -H "Content-Type: application/json" \
  -d '{
    "negocio_id": "negocio_123",
    "cliente_id": "cliente_456",
    "servicio_id": "servicio_789",
    "fecha": "2025-11-15",
    "hora_inicio": "10:00",
    "hora_fin": "10:30",
    "estado": "pendiente"
  }'

# Terminal 3: Deberías ver el mensaje en el WebSocket
```

### Test 2: Múltiples Clientes

```typescript
// En DevTools de navegador (F12 → Console)

// Cliente 1 - Admin A
websocketService.connect(tokenA);
websocketService.subscribe('estadisticas:negocio_123');

// Otro navegador - Cliente 2 - Admin B
websocketService.connect(tokenB);
websocketService.subscribe('estadisticas:negocio_123');

// Crear cita desde API
// Ambos clientes deberían recibir actualización simultáneamente
```

---

## Troubleshooting Integración

| Problema | Causa | Solución |
|----------|-------|----------|
| WebSocket notificación no llega | URL incorrecta en .env | Verificar `WEBSOCKET_URL` en REST API |
| Clientes no reciben actualización | WebSocket server caído | `go run main.go` en websocket-server/cmd |
| Timeout 5000ms en notificación | WebSocket tardío | Aumentar timeout en WebSocketNotificationService |
| Error 404 /notify/cita | Endpoint no existe | Verificar main.go tenga router.HandleFunc("/notify/cita") |
| Múltiples notificaciones duplicadas | Llamada duplicada | Verificar que updateStatus se llame una sola vez |

---

## Optimizaciones Futuras

1. **Message Queue**: Usar Redis para queue de notificaciones
2. **Load Balancing**: Múltiples instancias de WebSocket con Redis Pub/Sub
3. **Rate Limiting**: Limitar número de notificaciones por segundo
4. **Compresión**: Comprimir mensajes grandes antes de enviar
5. **Caché**: Cachear estadísticas para consultas frecuentes

---

## Diagrama de Dependencias

```
Frontend (Angular)
├── WebsocketService (RxJS)
├── WebsocketNotificationService (axios)
└── CitaService (HttpClient)
    │
    └──> REST API (TypeScript)
         ├── CitaController
         ├── CitaService
         └── WebSocketNotificationService (axios)
             │
             └──> WebSocket Server (Go)
                  ├── Hub
                  ├── Client (RxJS)
                  └── EstadisticasService
                      │
                      └──> PostgreSQL
```

---

**Documento actualizado**: 2025-11-10  
**Versión**: 1.0
