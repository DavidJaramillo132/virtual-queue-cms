# 📡 Arquitectura WebSocket Server - Virtual Queue CMS

## Tabla de Contenidos
1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Estructura de Carpetas](#estructura-de-carpetas)
4. [Componentes Principales](#componentes-principales)
5. [Flujo de Datos](#flujo-de-datos)
6. [Conexión Front-End](#conexión-front-end)
7. [Guía de Integración](#guía-de-integración)
8. [Ejemplo Práctico](#ejemplo-práctico)

---

## Visión General

El **WebSocket Server** es un servidor en tiempo real construido con **Go** que permite:

- ✅ Conexiones persistentes entre cliente y servidor
- ✅ Actualizaciones en tiempo real de estadísticas de citas
- ✅ Suscripción a canales específicos por negocio
- ✅ Autenticación con JWT
- ✅ Polling automático de datos de la base de datos cada 5 segundos

**Puerto**: 8080  
**Protocolo**: WebSocket (ws://localhost:8080/ws)  
**Base de datos**: PostgreSQL (Supabase)

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENTE (Angular)                           │
│  - WebsocketService (RxJS + Angular)                           │
│  - Estadísticas Component                                       │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ WebSocket
                   │ ws://localhost:8080/ws?token=JWT
                   │
┌──────────────────▼──────────────────────────────────────────────┐
│               WebSocket Server (Go)                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Handler (handlers/websocket.go)                         │  │
│  │ - Acepta conexiones WebSocket                           │  │
│  │ - Valida JWT                                            │  │
│  │ - Inicia goroutines (lectura/escritura)               │  │
│  └────────┬────────────────────────────────────────────────┘  │
│           │                                                     │
│  ┌────────▼────────────────────────────────────────────────┐  │
│  │ Hub (hub/hub.go)                                        │  │
│  │ - Centro de control de conexiones                       │  │
│  │ - Gestiona suscripciones a canales                     │  │
│  │ - Distribuye mensajes a clientes                       │  │
│  └────────┬────────────────────────────────────────────────┘  │
│           │                                                     │
│  ┌────────▼────────────────────────────────────────────────┐  │
│  │ Estadísticas Service (services/estadisticas_service.go)│  │
│  │ - Conecta a PostgreSQL                                 │  │
│  │ - Ejecuta queries para obtener estadísticas            │  │   
│  └────────┬───────────────────────────────────────────────┘  │
│           │                                                  │
└───────────┼──────────────────────────────────────────────────┘
            │
            │ SQL Queries
            │
┌───────────▼─────────────────────────────────────────────────────┐
│              PostgreSQL (Supabase)                              │
│  - Base de datos: citas                                        │
│  - Campos: estado, fecha, negocio_id, hora_inicio, etc        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estructura de Carpetas

```
websocket-server/
├── cmd/
│   └── main.go                    # Punto de entrada - Inicia servidor
├── internal/
│   ├── handlers/
│   │   └── websocket.go           # Maneja conexiones WebSocket
│   ├── hub/
│   │   ├── hub.go                 # Centro de control del hub
│   │   └── client.go              # Goroutines de lectura/escritura
│   ├── models/
│   │   └── message.go             # Estructuras de datos
│   ├── services/
│   │   └── estadisticas_service.go # Consultas a BD
│   └── utils/
│       └── auth.go                # Validación JWT
├── .env                           # Variables de entorno
├── go.mod                         # Dependencias
└── README.md                      # Documentación básica
```

---

## Componentes Principales

### 1. **Handler WebSocket** (`handlers/websocket.go`)

**Responsabilidad**: Aceptar conexiones WebSocket, validar JWT y crear clientes

```go
// Función que se ejecuta cuando un cliente intenta conectarse
func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
  // 1. Obtener token JWT del query parameter
  token := r.URL.Query().Get("token")
  
  // 2. Validar token con clave secreta
  usuarioID := auth.ValidarJWT(token, secretKey)
  
  // 3. Crear conexión WebSocket
  ws, _ := upgrader.Upgrade(w, r, nil)
  
  // 4. Crear cliente y registrarlo en el hub
  client := &Client{
    ID: usuarioID,
    Send: make(chan Message, 256),
    Conn: ws,
  }
  hub.Register <- client
  
  // 5. Iniciar goroutines de lectura y escritura
  go client.ReadPump()  // Escucha mensajes del cliente
  go client.WritePump() // Envía mensajes al cliente
}
```

**Flujo**:
1. Cliente Angular intenta conectar con `ws://localhost:8080/ws?token=JWT_TOKEN`
2. Servidor valida el JWT
3. Si es válido, crea una conexión persistente
4. Inicia dos goroutines (threads ligeros de Go):
   - **ReadPump**: Escucha que el cliente envíe
   - **WritePump**: Envía mensajes al cliente

---

### 2. **Hub** (`hub/hub.go`)

**Responsabilidad**: Centro de control - gestiona todas las conexiones y canales

```go
type Hub struct {
  // Canales de control
  Register   chan *Client                    // Registrar nuevo cliente
  Unregister chan *Client                    // Desconectar cliente
  Broadcast  chan Message                    // Enviar a todos
  
  // Clientes activos
  Clients map[*Client]bool                  // Clientes conectados
  
  // Suscripciones por canal
  // Ejemplo: "estadisticas:negocio_123" → [client1, client2]
  Subscriptions map[string]map[*Client]bool
}

// Método del Hub
func (h *Hub) Run() {
  for {
    select {
    // Nuevo cliente se conecta
    case client := <- h.Register:
      h.Clients[client] = true
      
    // Cliente se desconecta
    case client := <- h.Unregister:
      delete(h.Clients, client)
      
    // Broadcast a un canal específico
    case msg := <- h.Broadcast:
      // Enviar a todos los clientes suscritos al canal
      for client := range h.Subscriptions[msg.Channel] {
        client.Send <- msg
      }
    }
  }
}
```

**Responsabilidades**:
- Registrar/desregistrar clientes
- Mantener mapeo de suscripciones por canal
- Distribuir mensajes a los clientes suscritos

---

### 3. **Cliente WebSocket** (`hub/client.go`)

**Responsabilidad**: Maneja la comunicación bidireccional con un cliente específico

```go
type Client struct {
  ID   string                    // ID del usuario
  Send chan Message              // Canal para enviar mensajes
  Conn *websocket.Conn           // Conexión WebSocket
}

// ReadPump: Escucha mensajes que envía el cliente
func (c *Client) ReadPump(hub *Hub) {
  for {
    var msg Message
    // Leer JSON del cliente
    err := c.Conn.ReadJSON(&msg)
    
    if msg.Type == "subscribe" {
      // Cliente se suscribe al canal "estadisticas:negocio_123"
      channel := msg.Data["channel"]
      hub.Subscribe(c, channel)
    }
  }
}

// WritePump: Envía mensajes al cliente
func (c *Client) WritePump() {
  for {
    // Esperar que haya un mensaje en el canal Send
    msg := <-c.Send
    
    // Convertir a JSON y enviar al cliente
    c.Conn.WriteJSON(msg)
  }
}
```

**Ciclo de vida**:
1. Cliente se conecta → se crea instancia de `Client`
2. ReadPump escucha `subscribe` del cliente
3. Hub registra la suscripción en `Subscriptions["estadisticas:123"]`
4. Cuando hay datos nuevos, se envían a través del canal `Send`
5. WritePump toma el mensaje y lo envía a través del WebSocket

---

### 4. **Estadísticas Service** (`services/estadisticas_service.go`)

**Responsabilidad**: Conectar a PostgreSQL y ejecutar queries

```go
type EstadisticasService struct {
  db *sql.DB  // Conexión a PostgreSQL
}

func (s *EstadisticasService) ObtenerEstadisticas(ctx context.Context, negocioID string) (*EstadisticasData, error) {
  query := `
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE DATE(fecha) = CURRENT_DATE) as hoy,
      COUNT(*) FILTER (WHERE estado = 'completada') as completadas,
      COUNT(*) FILTER (WHERE estado = 'cancelada') as canceladas
    FROM citas
    WHERE negocio_id = $1
  `
  
  // Ejecutar query
  err := s.db.QueryRowContext(ctx, query, negocioID).Scan(
    &stats.TotalCitas,
    &stats.CitasHoy,
    &stats.CitasCompletadas,
    &stats.CitasCanceladas,
  )
  
  return stats, err
}
```

**Query SQL**:
```sql
SELECT 
  COUNT(*) as total,                                    -- Total de citas
  COUNT(*) FILTER (WHERE DATE(fecha) = CURRENT_DATE) as hoy,         -- De hoy
  COUNT(*) FILTER (WHERE estado = 'completada') as completadas,      -- Completadas
  COUNT(*) FILTER (WHERE estado = 'cancelada') as canceladas         -- Canceladas
FROM citas
WHERE negocio_id = $1;
```

---

### 5. **Autenticación** (`utils/auth.go`)

**Responsabilidad**: Validar JWT y extraer información del usuario

```go
func ValidarJWT(tokenString string, secretKey string) (string, error) {
  // Parsear token
  token, err := jwt.ParseWithClaims(tokenString, &jwt.StandardClaims{}, 
    func(token *jwt.Token) (interface{}, error) {
      return []byte(secretKey), nil
    })
  
  if claims, ok := token.Claims.(*jwt.StandardClaims); ok && token.Valid {
    // JWT válido, retornar ID del usuario
    return claims.Subject, nil
  }
  
  return "", errors.New("token inválido")
}
```

---

## Flujo de Datos

### Paso 1: Cliente se conecta

```
┌─────────────────────────┐
│  1. Cliente Angular     │
│  WebsocketService       │
│  .connect(token)        │
└────────────┬────────────┘
             │
             │ WebSocket Connection Request
             │ ws://localhost:8080/ws?token=eyJhb...
             │
┌────────────▼────────────┐
│  2. Handler            │
│  HandleWebSocket()     │
│  - Valida JWT          │
│  - Crea conexión       │
└────────────┬────────────┘
             │
             │ Connection Established
             │
┌────────────▼────────────┐
│  3. Hub                │
│  Registra cliente      │
│  Clients[client] = true│
└────────────────────────┘
```

### Paso 2: Cliente se suscribe a canal

```
┌──────────────────────────────┐
│  1. Client (Angular)         │
│  subscribe("estadisticas:123")
└────────────┬─────────────────┘
             │
             │ { type: "subscribe", data: { channel: "estadisticas:123" } }
             │
┌────────────▼──────────────────┐
│  2. Client.ReadPump()         │
│  Lee mensaje del cliente      │
└────────────┬──────────────────┘
             │
             │ Procesa suscripción
             │
┌────────────▼──────────────────────────────────┐
│  3. Hub.Subscribe()                           │
│  Subscriptions["estadisticas:123"][client] = true
└────────────────────────────────────────────────┘
```

### Paso 3: Servidor publica estadísticas cada 5 segundos

```
┌────────────────────────────────────┐
│  1. main.go - Polling Loop         │
│  ticker := time.NewTicker(5s)      │
│  Cada 5 segundos:                  │
└────────────┬───────────────────────┘
             │
             │ Para cada negocio con clientes suscritos
             │
┌────────────▼─────────────────────────────────┐
│  2. EstadisticasService                     │
│  ObtenerEstadisticas(ctx, negocioID)        │
│  - Ejecuta query SQL                        │
│  - Retorna: { total, hoy, completadas, ... }
└────────────┬─────────────────────────────────┘
             │
             │ { type: "stats", data: { totalCitas: 10, ... } }
             │
┌────────────▼─────────────────────────────────┐
│  3. Hub.BroadcastToChannel()                │
│  Envía a canal: "estadisticas:negocio_123"  │
│  - Todos los clientes suscritos reciben msg │
└────────────┬─────────────────────────────────┘
             │
             │ Para cada cliente en Subscriptions["estadisticas:123"]
             │
┌────────────▼──────────────────┐
│  4. Client.Send Channel       │
│  msg → client.Send            │
└────────────┬──────────────────┘
             │
             │ client.WritePump() lee del Send
             │
┌────────────▼──────────────────┐
│  5. WebSocket.WriteJSON()     │
│  Envía JSON al cliente        │
└────────────┬──────────────────┘
             │
             │ JSON mediante WebSocket
             │
┌────────────▼──────────────────┐
│  6. Client Angular            │
│  messagesSubject$.next(msg)   │
│  RxJS Observable actualiza UI │
└──────────────────────────────┘
```

---

## Conexión Front-End

### WebsocketService (Angular)

```typescript
@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private socket$: WebSocketSubject<WebSocketMessage>;
  public messages$ = new Subject<WebSocketMessage>();
  public connectionStatus$ = new Subject<boolean>();

  /**
   * Conecta al servidor WebSocket
   * @param token JWT para autenticación
   */
  connect(token: string): void {
    const wsUrl = `ws://localhost:8080/ws?token=${token}`;
    
    this.socket$ = webSocket<WebSocketMessage>({
      url: wsUrl,
      openObserver: {
        next: () => {
          console.log('Conectado a WebSocket');
          this.connectionStatus$.next(true);
        }
      },
      closeObserver: {
        next: () => {
          console.log('Desconectado de WebSocket');
          this.connectionStatus$.next(false);
          // Intentar reconectar
        }
      }
    });

    // Suscribirse a mensajes entrantes
    this.socket$.subscribe({
      next: (message) => {
        this.messages$.next(message);
      }
    });
  }

  /**
   * Envía mensaje de suscripción a un canal
   * @param channel Nombre del canal (ej: "estadisticas:negocio_123")
   */
  subscribe(channel: string): void {
    this.socket$.next({
      type: 'subscribe',
      data: { channel }
    });
  }

  /**
   * Filtra mensajes por tipo
   * @param messageType Tipo de mensaje
   * @returns Observable de mensajes filtrados
   */
  filterByType<T>(messageType: string): Observable<T> {
    return this.messages$.pipe(
      filter(msg => msg.type === messageType),
      map(msg => msg.data as T)
    );
  }
}
```

### Estadísticas Component (Angular)

```typescript
@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './estadisticas.html'
})
export class EstadisticasComponent implements OnInit, OnDestroy {
  // Señales de Angular para reactividad
  totalCitas = signal(0);
  citasHoy = signal(0);
  citasCompletadas = signal(0);
  citasCanceladas = signal(0);

  constructor(
    private websocketService: WebsocketService,
    private userService: UserService
  ) {}

  ngOnInit() {
    // 1. Obtener token del usuario
    const token = localStorage.getItem('token');
    const user = this.userService.currentUserValue;

    // 2. Conectar al WebSocket
    this.websocketService.connect(token);

    // 3. Esperar a que esté conectado
    this.websocketService.connectionStatus$.pipe(
      filter(connected => connected)
    ).subscribe(() => {
      // 4. Suscribirse al canal de estadísticas del negocio
      this.websocketService.subscribe(`estadisticas:${user.negocio_id}`);

      // 5. Escuchar mensajes de tipo "stats"
      this.websocketService.filterByType<EstadisticasData>('stats').subscribe(
        (data) => {
          // 6. Actualizar señales (actualiza UI automáticamente)
          this.totalCitas.set(data.totalCitas);
          this.citasHoy.set(data.citasHoy);
          this.citasCompletadas.set(data.citasCompletadas);
          this.citasCanceladas.set(data.citasCanceladas);
        }
      );
    });
  }

  ngOnDestroy() {
    this.websocketService.disconnect();
  }
}
```

---

## Guía de Integración

### 1. **Iniciar Servidor WebSocket**

```bash
cd backend/services/websocket-server/cmd
go run main.go
```

**Esperado en consola**:
```
2025/11/10 10:30:00 Database connection established
2025/11/10 10:30:00 WebSocket server listening on :8080
```

### 2. **Variables de Entorno** (`.env`)

```env
JWT_SECRET=clave123
DATABASE_URL=postgres://usuario:password@host:5432/database?sslmode=require&connect_timeout=30
```

### 3. **En el Frontend**

```typescript
// 1. Conectar a WebSocket después de login
this.websocketService.connect(token);

// 2. Suscribirse a canal
this.websocketService.subscribe(`estadisticas:${negocioId}`);

// 3. Escuchar mensajes
this.websocketService.filterByType('stats').subscribe(data => {
  console.log('Estadísticas actualizadas:', data);
});
```

### 4. **Integración con operaciones CRUD**

Cuando se crea/actualiza/elimina una cita, notificar al WebSocket:

```typescript
// En CitaService después de crear una cita
createCita(cita: ICita): Observable<ICita> {
  return this.http.post<ICita>(this.apiUrl, cita).pipe(
    tap(() => {
      // Notificar al WebSocket sobre el cambio
      this.notifyWebSocket(cita.negocio_id, 'created');
    })
  );
}
```

---

## Ejemplo Práctico

### Escenario: Dashboard de Estadísticas en Tiempo Real

**Paso 1: Admin Local se conecta**
```
┌─────────────────────────────────────────┐
│ Admin Local abre /admin-local           │
│ - Se carga EstadisticasComponent        │
│ - Valida autenticación (AuthGuard)      │
│ - Obtiene token JWT                     │
└─────────────────────────────────────────┘
```

**Paso 2: Conectar WebSocket**
```typescript
ngOnInit() {
  const token = localStorage.getItem('token');
  this.websocketService.connect(token);  // Conectar a ws://localhost:8080/ws?token=...
}
```

**Paso 3: Suscribirse a estadísticas**
```typescript
this.websocketService.connectionStatus$
  .pipe(filter(connected => connected))
  .subscribe(() => {
    const negocioId = this.userService.currentUserValue.negocio_id;
    this.websocketService.subscribe(`estadisticas:${negocioId}`);
  });
```

**Paso 4: Servidor envía estadísticas cada 5 segundos**
```
Servidor Go (cada 5 segundos):
1. Query SQL: SELECT COUNT(*) ... FROM citas WHERE negocio_id = '123'
2. Resultado: { totalCitas: 10, citasHoy: 3, completadas: 8, canceladas: 2 }
3. Enviar a canal: "estadisticas:123"
4. Todos los clientes suscritos reciben el mensaje
```

**Paso 5: UI actualiza en tiempo real**
```typescript
// Recibe mensaje
{
  type: 'stats',
  data: {
    totalCitas: 10,
    citasHoy: 3,
    citasCompletadas: 8,
    citasCanceladas: 2,
    timestamp: 2025-11-10T10:30:00Z
  }
}

// Actualizar señales (Angular Signals)
this.totalCitas.set(10);
this.citasHoy.set(3);
// ... UI se actualiza automáticamente gracias a signals
```

**Paso 6: Dashboard muestra datos en tiempo real**
- Gráficos se actualizan cada 5 segundos
- Cards muestran números actualizados
- Sin necesidad de refresh manual

---

## Resumen de la Arquitectura

| Componente | Lenguaje | Responsabilidad |
|-----------|----------|-----------------|
| **main.go** | Go | Inicia servidor, polling cada 5s |
| **handlers/websocket.go** | Go | Acepta conexiones, valida JWT |
| **hub/hub.go** | Go | Gestiona conexiones y suscripciones |
| **hub/client.go** | Go | Comunicación bidireccional |
| **estadisticas_service.go** | Go | Consultas a PostgreSQL |
| **utils/auth.go** | Go | Validación JWT |
| **WebsocketService** | TypeScript | Conecta y recibe mensajes |
| **EstadisticasComponent** | TypeScript | Muestra datos en UI |
| **PostgreSQL** | SQL | Almacena datos de citas |

---

## Ventajas de esta Arquitectura

✅ **Tiempo Real**: Actualizaciones instantáneas sin polling del cliente  
✅ **Escalable**: Hub soporta múltiples clientes simultáneamente  
✅ **Eficiente**: Goroutines de Go son muy ligeras  
✅ **Seguro**: Autenticación JWT en cada conexión  
✅ **Canales Específicos**: Cada negocio recibe solo sus datos  
✅ **Reconexión Automática**: RxJS maneja reconexiones  
✅ **Bajo Acoplamiento**: Frontend y Backend independientes  

---

## Troubleshooting

### ❌ "WebSocket already connected"
- Cliente intenta conectar dos veces
- Solución: Verificar `ngOnInit` no se ejecuta dos veces

### ❌ "Error connecting to database"
- DATABASE_URL incorrecta o servidor BD fuera
- Solución: Verificar `.env` y que PostgreSQL esté en línea

### ❌ "Cannot subscribe: Socket not initialized"
- Se intenta suscribir antes de estar conectado
- Solución: Usar `connectionStatus$` para esperar conexión

### ❌ "Token inválido"
- JWT expirado o con clave secreta incorrecta
- Solución: Verificar `JWT_SECRET` coincida en frontend y backend

---

## Próximos Pasos

1. **Notificaciones de Cambios**: Cuando se crea/actualiza una cita, notificar WebSocket
2. **Historial**: Guardar datos históricos para gráficos de tendencias
3. **Alertas**: Enviar notificaciones cuando hay cambios importantes
4. **Escalabilidad**: Usar Redis para múltiples instancias del servidor

---

**Documento creado**: 2025-11-10  
**Versión**: 1.0  
**Autor**: Virtual Queue CMS Team
