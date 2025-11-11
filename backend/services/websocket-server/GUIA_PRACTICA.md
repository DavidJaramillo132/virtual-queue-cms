# 🔧 Guía Práctica - WebSocket Server

## Tabla de Contenidos
1. [Instalación y Configuración](#instalación-y-configuración)
2. [Ejemplos de Código](#ejemplos-de-código)
3. [Casos de Uso](#casos-de-uso)
4. [Debugging](#debugging)

---

## Instalación y Configuración

### Requisitos
- Go 1.21+
- PostgreSQL (Supabase)
- Docker (opcional)

### Paso 1: Clonar y Configurar

```bash
cd backend/services/websocket-server
```

### Paso 2: Crear archivo `.env`

```env
JWT_SECRET=clave123
DATABASE_URL=postgres://postgres:contraseña@db.ahyeuobiaxqzezqubjox.supabase.co:5432/postgres?sslmode=require&connect_timeout=30
```

### Paso 3: Instalar Dependencias

```bash
go mod download
go mod tidy
```

### Paso 4: Ejecutar Servidor

```bash
cd cmd
go run main.go
```

**Salida esperada**:
```
2025/11/10 10:30:00 Database connection established
2025/11/10 10:30:00 WebSocket server listening on :8080
Intento 1/5 fallido, reintentando en 3 segundos...  # Si hay problemas de BD
```

---

## Ejemplos de Código

### Ejemplo 1: Conectar desde Angular

```typescript
// 1. En un servicio
import { Injectable } from '@angular/core';
import { WebsocketService } from './websocket.service';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  constructor(
    private ws: WebsocketService,
    private userService: UserService
  ) {}

  conectarEstadisticas() {
    // Obtener token del localStorage
    const token = localStorage.getItem('token');
    
    // Conectar a WebSocket
    this.ws.connect(token);

    // Esperar conexión
    this.ws.connectionStatus$
      .pipe(filter(connected => connected))
      .subscribe(() => {
        // Obtener ID del negocio del usuario
        const negocioId = this.userService.currentUserValue.negocio_id;
        
        // Suscribirse al canal específico
        this.ws.subscribe(`estadisticas:${negocioId}`);
      });

    // Escuchar estadísticas
    return this.ws.filterByType('stats');
  }
}

// 2. En el componente
@Component({
  selector: 'app-estadisticas',
  template: `
    <div *ngIf="connectionStatus$ | async as connected">
      <p [ngClass]="{ 'text-green-500': connected, 'text-red-500': !connected }">
        {{ connected ? 'Conectado' : 'Desconectado' }}
      </p>
      <div class="stats">
        <p>Total: {{ totalCitas() }}</p>
        <p>Hoy: {{ citasHoy() }}</p>
        <p>Completadas: {{ citasCompletadas() }}</p>
      </div>
    </div>
  `
})
export class EstadisticasComponent implements OnInit {
  totalCitas = signal(0);
  citasHoy = signal(0);
  citasCompletadas = signal(0);
  connectionStatus$: Observable<boolean>;

  constructor(private estadisticasService: EstadisticasService) {}

  ngOnInit() {
    // Conectar y recibir estadísticas
    this.estadisticasService.conectarEstadisticas().subscribe(stats => {
      this.totalCitas.set(stats.totalCitas);
      this.citasHoy.set(stats.citasHoy);
      this.citasCompletadas.set(stats.citasCompletadas);
    });
  }
}
```

### Ejemplo 2: Estructura de Mensaje WebSocket

**Mensaje de Suscripción (Cliente → Servidor)**:
```json
{
  "type": "subscribe",
  "data": {
    "channel": "estadisticas:negocio_123"
  }
}
```

**Mensaje de Estadísticas (Servidor → Cliente)**:
```json
{
  "type": "stats",
  "data": {
    "totalCitas": 25,
    "citasHoy": 5,
    "citasCompletadas": 20,
    "citasCanceladas": 3,
    "timestamp": "2025-11-10T10:30:00Z"
  }
}
```

### Ejemplo 3: Múltiples Canales

```typescript
// Suscribirse a múltiples canales
ngOnInit() {
  const negocioId = this.userService.currentUserValue.negocio_id;

  // Canal 1: Estadísticas
  this.ws.subscribe(`estadisticas:${negocioId}`);
  this.ws.filterByType('stats').subscribe(stats => {
    console.log('Estadísticas:', stats);
  });

  // Canal 2: Notificaciones
  this.ws.subscribe(`notificaciones:${negocioId}`);
  this.ws.filterByType('notification').subscribe(notif => {
    console.log('Notificación:', notif);
    this.toastr.info(notif.message);
  });

  // Canal 3: Cambios en Citas
  this.ws.subscribe(`citas:${negocioId}`);
  this.ws.filterByType('cita_updated').subscribe(cita => {
    console.log('Cita actualizada:', cita);
  });
}
```

### Ejemplo 4: Manejar Desconexiones

```typescript
export class EstadisticasComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.ws.connectionStatus$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged()
      )
      .subscribe(connected => {
        if (connected) {
          console.log('Conectado al WebSocket');
          this.showMessage('Conectado al servidor', 'success');
        } else {
          console.log('Desconectado del WebSocket');
          this.showMessage('Desconectado del servidor', 'warning');
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.ws.disconnect();
  }
}
```

### Ejemplo 5: Query SQL Custom

Para agregar nuevas estadísticas, modifica `estadisticas_service.go`:

```go
// En EstadisticasService
func (s *EstadisticasService) ObtenerEstadisticasAvanzadas(ctx context.Context, negocioId string) (*EstadisticasAvanzada, error) {
  query := `
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE DATE(fecha) = CURRENT_DATE) as hoy,
      COUNT(*) FILTER (WHERE estado = 'completada') as completadas,
      COUNT(*) FILTER (WHERE estado = 'cancelada') as canceladas,
      AVG(EXTRACT(EPOCH FROM (hora_fin - hora_inicio))/60)::INT as duracion_promedio,
      MAX(fecha) as ultima_cita
    FROM citas
    WHERE negocio_id = $1
  `
  
  var stats EstadisticasAvanzada
  err := s.db.QueryRowContext(ctx, query, negocioId).Scan(
    &stats.Total,
    &stats.Hoy,
    &stats.Completadas,
    &stats.Canceladas,
    &stats.DuracionPromedio,
    &stats.UltimaCita,
  )
  
  return &stats, err
}
```

---

## Casos de Uso

### Caso 1: Dashboard en Tiempo Real

```typescript
// EstadisticasComponent visualiza actualizaciones automáticas
// - Gráficos de Chart.js se actualizan cada 5 segundos
// - Números en cards cambian en vivo
// - Sin necesidad de refresh manual
```

**Flujo**:
```
Usuario abre /admin-local
    ↓
Conecta WebSocket
    ↓
Suscribe a "estadisticas:negocio_123"
    ↓
Servidor envía datos cada 5 segundos
    ↓
UI se actualiza automáticamente
    ↓
Usuario ve citas en tiempo real
```

### Caso 2: Notificación de Nueva Cita

```typescript
// 1. Usuario crea una cita desde REST API
POST /api/citas → CitaService.createCita()

// 2. Luego que se crea, notificar WebSocket
this.websocketNotification.notifyCitaChange(
  negocioId, 
  'created'
);

// 3. Servidor WebSocket distribuye evento
Hub.BroadcastToChannel("citas:negocio_123")

// 4. Dashboard recibe en tiempo real
this.ws.filterByType('cita_created').subscribe(cita => {
  this.citasService.agregarCita(cita);
  this.toastr.success('Nueva cita creada');
});
```

### Caso 3: Múltiples Usuarios del Mismo Negocio

```
Usuario A (Admin 1)                Usuario B (Admin 2)
    ↓                                   ↓
ws://localhost:8080/ws?token=JWT_A     ws://localhost:8080/ws?token=JWT_B
    ↓                                   ↓
Subscribe: estadisticas:negocio_123    Subscribe: estadisticas:negocio_123
    ↓                                   ↓
        Hub.Subscriptions["estadisticas:123"]
               ↙                    ↖
            Client A            Client B
               ↙                    ↖
        Ambos reciben:
        { type: 'stats', data: {...} }

✅ Ambos ven los mismos datos en tiempo real
```

---

## Debugging

### Activar Logs Detallados

En `main.go`, modificar para logs verbosos:

```go
func main() {
  // ... código existente ...
  
  // Agregar logs detallados
  log.Println("=== WEBSOCKET SERVER DEBUG MODE ===")
  log.Println("DATABASE_URL:", os.Getenv("DATABASE_URL"))
  log.Println("JWT_SECRET:", strings.Repeat("*", len(os.Getenv("JWT_SECRET"))))
  
  // Cuando se conecta cliente
  client := &Client{...}
  log.Printf("Cliente conectado: ID=%s, Time=%s", client.ID, time.Now())
}
```

### Verificar Conexión a Base de Datos

```bash
# Conectar a Supabase directamente
psql "postgresql://postgres:PASSWORD@db.ahyeuobiaxqzezqubjox.supabase.co:5432/postgres?sslmode=require"

# En psql
SELECT COUNT(*) FROM citas;
SELECT COUNT(*) FROM citas WHERE negocio_id = 'negocio_123';
```

### Ver Logs del WebSocket Server

```bash
# Terminal 1: Ejecutar servidor con logs
cd cmd && go run main.go

# Terminal 2: Ver logs en tiempo real
tail -f /var/log/websocket-server.log
```

### Testear Conexión WebSocket

Usando `websocat` (similar a `curl` pero para WebSocket):

```bash
# Instalar websocat (macOS)
brew install websocat

# Conectar a WebSocket
websocat "ws://localhost:8080/ws?token=tu_jwt_token_aqui"

# Enviar suscripción
{ "type": "subscribe", "data": { "channel": "estadisticas:negocio_123" } }
```

### Verificar en DevTools de Angular

```typescript
// En estadisticas.ts, agregar logging
this.ws.messages$.subscribe(msg => {
  console.log('📨 Mensaje recibido:', msg);
  console.table(msg.data);
});

// En DevTools de navegador (F12 → Console)
// Verás todos los mensajes en tiempo real
```

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `connection refused` | WebSocket no está escuchando | Verificar que servidor Go esté en puerto 8080 |
| `token inválido` | JWT incorrecto o expirado | Verificar token y que JWT_SECRET sea igual |
| `database error` | PostgreSQL no accesible | Verificar DATABASE_URL y credenciales |
| `no such host` | DNS no resuelve host | Limpiar caché DNS: `ipconfig /flushdns` |
| `socket operation timed out` | Red lenta o caída | Verificar conexión a Internet |

---

## Performance y Optimización

### Límite de Conexiones

```go
// En main.go, limitar conexiones simultáneas
const MAX_CONNECTIONS = 1000

// Verificar en Hub.Run()
if len(h.Clients) >= MAX_CONNECTIONS {
  log.Println("Max connections reached, rejecting new connection")
  // Rechazar conexión
}
```

### Reducir Tamaño de Mensajes

```go
// En vez de enviar todo siempre
type EstadisticasData struct {
  TotalCitas       int
  CitasHoy         int
  CitasCompletadas int
  CitasCanceladas  int
  Timestamp        time.Time
}

// Mejor: Delta (solo cambios)
type EstadisticasDelta struct {
  Changed map[string]interface{} // Solo campos que cambiaron
}
```

### Batching de Mensajes

```go
// En vez de enviar cada segundo
// Esperar 5 segundos y enviar lote

ticker := time.NewTicker(5 * time.Second)
var messageBatch []Message

for range ticker.C {
  // Agregar todos los mensajes del batch
  for _, msg := range messageBatch {
    h.Broadcast <- msg
  }
  messageBatch = []Message{} // Limpiar
}
```

---

## Despliegue en Producción

### Con Docker

```dockerfile
# Dockerfile en websocket-server/
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o websocket-server ./cmd/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/websocket-server .
COPY .env .

EXPOSE 8080
CMD ["./websocket-server"]
```

### Con Docker Compose

```yaml
# docker-compose.yml
services:
  websocket-server:
    build: ./backend/services/websocket-server
    ports:
      - "8080:8080"
    environment:
      JWT_SECRET: ${JWT_SECRET}
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      - postgres
```

### Monitoreo

```bash
# Verificar si está corriendo
curl http://localhost:8080/health

# Ver recursos
docker stats websocket-server

# Ver logs
docker logs -f websocket-server
```

---

## Recursos Adicionales

- [Documentación de Gorilla WebSocket](https://github.com/gorilla/websocket)
- [Go Context](https://golang.org/pkg/context/)
- [RxJS WebSocket](https://rxjs.dev/api/webSocket/webSocket)
- [Angular Signals](https://angular.io/guide/signals)

---

**Última actualización**: 2025-11-10
