# Guía de Integración WebSocket - Frontend

## 📦 Servicios creados

### 1. WebsocketService (`services/websocket.service.ts`)

Servicio base para manejar la conexión WebSocket.

**Métodos principales:**
- `connect(token: string)`: Conecta al WebSocket con autenticación JWT
- `subscribe(channel: string)`: Suscribe a un canal específico
- `filterByType<T>(messageType: string)`: Filtra mensajes por tipo
- `disconnect()`: Cierra la conexión
- `isSocketConnected()`: Verifica el estado de conexión

**Observables:**
- `messages$`: Stream de todos los mensajes recibidos
- `connectionStatus$`: Stream del estado de conexión (true/false)

### 2. EstadisticasService (`services/estadisticas.service.ts`)

Servicio específico para estadísticas en tiempo real.

**Métodos principales:**
- `obtenerEstadisticasEnTiempoReal(token, negocioId)`: Observable con estadísticas
- `getConnectionStatus()`: Observable del estado de conexión
- `desconectar()`: Cierra la conexión WebSocket

## 🔧 Uso en componentes

### Ejemplo básico

```typescript
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { EstadisticasService } from '../services/estadisticas.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <div>
      <p>Conectado: {{ isConnected() }}</p>
      <p>Citas Hoy: {{ estadisticas().citas_hoy }}</p>
    </div>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  private estadisticasService = inject(EstadisticasService);
  
  estadisticas = signal({
    citas_hoy: 0,
    total_citas: 0,
    citas_completadas: 0,
    citas_canceladas: 0
  });
  
  isConnected = signal(false);

  ngOnInit() {
    const token = localStorage.getItem('access_token')!;
    const negocioId = this.obtenerNegocioId();
    
    // Conectar y recibir actualizaciones
    this.estadisticasService
      .obtenerEstadisticasEnTiempoReal(token, negocioId)
      .subscribe(stats => {
        this.estadisticas.set({
          citas_hoy: stats.citas_hoy,
          total_citas: stats.total_citas,
          citas_completadas: stats.citas_completadas,
          citas_canceladas: stats.citas_canceladas
        });
      });
    
    // Monitorear estado de conexión
    this.estadisticasService.getConnectionStatus()
      .subscribe(connected => this.isConnected.set(connected));
  }

  ngOnDestroy() {
    this.estadisticasService.desconectar();
  }

  private obtenerNegocioId(): string {
    return localStorage.getItem('negocio_id') || '1';
  }
}
```

## 🎨 Componente de Estadísticas

Ya implementado en `presentation/adminLocal/estadisticas/estadisticas.ts`

**Características:**
- ✅ Conexión automática al WebSocket en `ngOnInit`
- ✅ Actualización reactiva con signals
- ✅ Indicador visual de conexión (verde/rojo)
- ✅ Botón de reconexión manual
- ✅ Timestamp de última actualización
- ✅ Desconexión automática en `ngOnDestroy`

## 🔐 Autenticación

El WebSocket requiere un token JWT válido:

```typescript
const token = localStorage.getItem('access_token');
```

El token se valida en el servidor y debe:
- Ser válido y no estar expirado
- Coincidir con el JWT_SECRET del servidor
- Contener la información del usuario/negocio

## 📡 Formato de mensajes

### Suscripción a canal

```json
{
  "type": "subscribe",
  "data": {
    "channel": "estadisticas:negocio_123"
  }
}
```

### Estadísticas recibidas

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

## 🔄 Reconexión automática

El servicio WebSocket implementa reconexión automática con:
- **Máximo de intentos**: 5
- **Delay exponencial**: 1s, 2s, 4s, 8s, 16s
- **Delay máximo**: 30 segundos

```typescript
// La reconexión es automática, pero también puedes forzarla:
reconectar() {
  this.estadisticasService.desconectar();
  this.conectarWebSocket();
}
```

## 🚦 Indicadores visuales

### Estado de conexión

```html
<div class="flex items-center space-x-2">
  <fa-icon 
    [icon]="faCircle" 
    [ngClass]="isConnected() ? 'text-green-500 animate-pulse' : 'text-red-500'"
    class="text-xs">
  </fa-icon>
  <span [ngClass]="isConnected() ? 'text-green-600' : 'text-red-600'">
    {{ isConnected() ? 'Conectado' : 'Desconectado' }}
  </span>
</div>
```

### Última actualización

```html
<span class="text-xs text-gray-500">
  Actualizado: {{ lastUpdate() | date:'HH:mm:ss' }}
</span>
```

## 🧪 Testing local

### 1. Iniciar el servidor WebSocket

```bash
cd backend/services/websocket-server
go run cmd/main.go
```

### 2. Configurar variables de entorno

Crear archivo `.env`:
```
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
```

### 3. Iniciar el frontend

```bash
cd frontend/virtual-queue-cms
ng serve
```

### 4. Verificar conexión

Abrir DevTools -> Network -> WS y buscar:
- Conexión a `ws://localhost:8080/ws?token=...`
- Mensajes de tipo `stats` cada 5 segundos

## 📊 Métricas en tiempo real

Las siguientes métricas se actualizan automáticamente:

| Métrica | Descripción | Query |
|---------|-------------|-------|
| `citas_hoy` | Citas programadas hoy | `COUNT(*) FILTER (WHERE fecha = CURRENT_DATE)` |
| `total_citas` | Total de citas | `COUNT(*)` |
| `citas_completadas` | Citas atendidas | `COUNT(*) FILTER (WHERE estado = 'atendida')` |
| `citas_canceladas` | Citas canceladas | `COUNT(*) FILTER (WHERE estado = 'cancelada')` |

## 🐛 Debugging

### Ver mensajes en consola

```typescript
// En WebsocketService, los logs están habilitados:
console.log('📨 Message received:', message);
console.log('✅ WebSocket connected');
console.log('🔌 WebSocket disconnected');
```

### Verificar token

```typescript
const token = localStorage.getItem('access_token');
console.log('Token:', token);

// Decodificar (solo para debug, no en producción)
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Payload:', payload);
```

### Monitorear reconexiones

```typescript
this.estadisticasService.getConnectionStatus().subscribe(connected => {
  console.log('Connection status:', connected ? 'CONNECTED' : 'DISCONNECTED');
});
```

## 🚀 Despliegue en producción

### 1. Cambiar URL del WebSocket

En `websocket.service.ts`:
```typescript
// Desarrollo
const wsUrl = `ws://localhost:8080/ws?token=${token}`;

// Producción
const wsUrl = `wss://tu-dominio.com/ws?token=${token}`;
```

### 2. Habilitar WSS (WebSocket Secure)

Configurar nginx o proxy reverso:
```nginx
location /ws {
  proxy_pass http://localhost:8080;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
}
```

## 💡 Tips y buenas prácticas

1. **Siempre desconectar en ngOnDestroy**: Evita fugas de memoria
2. **Usar signals para reactividad**: Mejor rendimiento que Observables directos
3. **Validar token antes de conectar**: Evita conexiones fallidas
4. **Manejar estados de loading**: Mostrar skeleton mientras se conecta
5. **Implementar fallback**: Si WebSocket falla, usar polling HTTP
6. **Logs en desarrollo**: Mantener console.log para debugging
7. **Monitorear latencia**: Usar timestamps para medir delay

## 📚 Referencias

- [RxJS WebSocket](https://rxjs.dev/api/webSocket/webSocket)
- [Angular Signals](https://angular.io/guide/signals)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
