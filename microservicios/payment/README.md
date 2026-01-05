# Microservicio de Pagos - Virtual Queue CMS

Sistema de pagos con abstracción de pasarela, webhooks B2B bidireccionales y suscripciones premium. Implementa el **Pilar 2: Webhooks e Interoperabilidad B2B** del proyecto.

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Componentes Principales](#componentes-principales)
- [Pilar 2: Webhooks e Interoperabilidad B2B](#pilar-2-webhooks-e-interoperabilidad-b2b)
- [Guía de Integración B2B](#guía-de-integración-b2b)
- [Eventos Bidireccionales](#eventos-bidireccionales)
- [API Reference](#api-reference)
- [Configuración](#configuración)
- [Despliegue](#despliegue)

## 🎯 Descripción General

Este microservicio proporciona:

- ✅ **Payment Service Wrapper**: Abstracción de pasarelas de pago mediante el patrón Adapter
- ✅ **Registro de Partners**: Sistema para que otros grupos registren sus webhooks
- ✅ **Autenticación HMAC**: Verificación de webhooks con HMAC-SHA256
- ✅ **Eventos Bidireccionales**: Comunicación en ambas direcciones con grupos partners
- ✅ **Normalización de Webhooks**: Conversión de diferentes formatos a un estándar común
- ✅ **Suscripciones Premium**: Gestión de suscripciones para negocios

## 🏗️ Arquitectura

### Patrón Adapter para Pasarelas de Pago

El microservicio utiliza el patrón **Adapter** para abstraer las diferentes pasarelas de pago:

```
┌─────────────────────────────────────────┐
│   Payment Service (Este Microservicio)  │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │   ProveedorPagoBase (Interface)  │   │
│  └──────────────┬───────────────────┘   │
│                 │                       │
│    ┌────────────┼────────────┐          │
│    │            │            │          │
│  ┌─▼───┐    ┌──▼────┐   ┌───▼───┐       │
│  │Mock │    │Stripe │   │Mercado│       │
│  │Adapt│    │Adapt  │   │Pago   │       │
│  │     │    │       │   │Adapt  │       │
│  └─────┘    └───────┘   └───────┘       │
└─────────────────────────────────────────┘
```

### Flujo de Webhooks B2B

```
┌─────────────┐                     ┌──────────────┐
│   Partner   │                     │  Este Serv.  │
│  (Grupo B)  │                     │  (Grupo A)   │
└──────┬──────┘                     └──────┬───────┘
       │                                   │
       │  1. POST /partners/register       │
       │──────────────────────────────────>│
       │                                   │
       │  2. Response con HMAC Secret      │
       │<──────────────────────────────────│
       │                                   │
       │                                   │ Evento Interno
       │                                   │ (ej: booking.confirmed)
       │                                   │
       │  3. POST Webhook (HMAC Signed)    │
       │<──────────────────────────────────│
       │                                   │
       │  4. Respuesta 200 OK              │
       │──────────────────────────────────>│
       │                                   │
       │  5. POST Webhook (HMAC Signed)    │
       │──────────────────────────────────>│
       │  (ej: tour.purchased)             │
       │                                   │
       │  6. Respuesta 200 OK              │
       │<──────────────────────────────────│
```

## 🧩 Componentes Principales

### 1. Payment Service Wrapper (Adapter Pattern)

#### Interface Base: `ProveedorPagoBase`

Define el contrato que todos los adaptadores deben implementar:

```python
class ProveedorPagoBase(ABC):
    @property
    @abstractmethod
    def nombre(self) -> str:
        """Nombre del proveedor de pago."""
    
    @abstractmethod
    async def crear_pago(...) -> ResultadoPago:
        """Crea un nuevo pago."""
    
    @abstractmethod
    async def verificar_pago(...) -> ResultadoPago:
        """Verifica el estado de un pago."""
    
    @abstractmethod
    async def procesar_webhook(...) -> Dict[str, Any]:
        """Procesa un webhook de la pasarela."""
```

#### Adaptadores Implementados

1. **MockAdapter** (Obligatorio para desarrollo)
   - Simula una pasarela de pago sin conexión real
   - Útil para desarrollo y testing
   - Ubicación: `app/adaptador/mock_adapter.py`

2. **StripeAdapter** (Opcional)
   - Integración con Stripe
   - Requiere: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - Ubicación: `app/adaptador/stripe_adapter.py`

3. **MercadoPagoAdapter** (Opcional)
   - Integración con MercadoPago
   - Requiere: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`
   - Ubicación: `app/adaptador/mercadopago_adapter.py`

#### Factory Pattern

El `AdaptadorFactory` gestiona la creación de instancias:

```python
from app.adaptador import AdaptadorFactory

# Obtener adaptador configurado
adapter = AdaptadorFactory.obtener()  # Usa PASARELA_ACTIVA

# Obtener adaptador específico
adapter = AdaptadorFactory.obtener("mock")
```

### 2. Normalización de Webhooks

El `NormalizadorWebhooks` convierte los formatos específicos de cada pasarela a un formato común:

**Formato Normalizado:**
```json
{
  "id": "evt_abc123",
  "tipo": "payment.success",
  "datos": {
    "pago_id": "pay_123",
    "monto": 29.99,
    "moneda": "USD",
    "estado": "completado"
  },
  "metadatos": {
    "pasarela": "stripe",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### 3. Registro de Partners

Los partners pueden registrarse mediante la API para recibir notificaciones de eventos.

**Endpoint:** `POST /partners/register`

### 4. Autenticación HMAC

Todos los webhooks se firman y verifican usando **HMAC-SHA256** para garantizar:
- Autenticidad del origen
- Integridad de los datos
- Prevención de ataques de replay (mediante timestamp)

## 🔄 Pilar 2: Webhooks e Interoperabilidad B2B

Este microservicio implementa el **Pilar 2 (20%)** del proyecto, que incluye:

### ✅ Componentes Requeridos

1. **Payment Service Wrapper** ✅
   - ✅ Interface `ProveedorPagoBase` abstracta
   - ✅ Adapters: StripeAdapter, MercadoPagoAdapter, MockAdapter
   - ✅ Normalización de webhooks a formato común

2. **Registro de Partners** ✅
   - ✅ `POST /partners/register` - Registrar URL de webhook + eventos
   - ✅ Generación de secret compartido para HMAC
   - ✅ Gestión de partners (listar, actualizar, eliminar)

3. **Autenticación HMAC** ✅
   - ✅ Firma HMAC-SHA256 en todos los webhooks
   - ✅ Verificación de firma en webhooks entrantes
   - ✅ Prevención de replay attacks con timestamp

4. **Eventos Bidireccionales** ✅
   - ✅ Notificación de eventos a partners suscritos
   - ✅ Recepción de webhooks de partners externos
   - ✅ Procesamiento de eventos externos

## 🔗 Guía de Integración B2B

### Paso 1: Registrar tu Partner

Tu grupo (ej: Grupo B - Tours) debe registrarse en este servicio:

```bash
POST http://payments-service:8000/partners/register
Content-Type: application/json

{
  "nombre": "Tours Ecuador",
  "webhook_url": "https://api.toursecuador.com/webhooks/virtual-queue",
  "eventos_suscritos": [
    "booking.confirmed",
    "payment.success",
    "subscription.activated"
  ],
  "descripcion": "Integración con sistema de tours",
  "contacto_email": "tech@toursecuador.com"
}
```

**Respuesta:**
```json
{
  "id": "partner_abc123def456",
  "nombre": "Tours Ecuador",
  "webhook_url": "https://api.toursecuador.com/webhooks/virtual-queue",
  "eventos_suscritos": ["booking.confirmed", "payment.success"],
  "hmac_secret": "whsec_a1b2c3d4e5f6...",  // ⚠️ GUARDAR ESTE SECRET
  "activo": true,
  "creado_en": "2024-01-01T00:00:00Z"
}
```

⚠️ **IMPORTANTE**: Guarda el `hmac_secret` de forma segura. Se usará para firmar todos los webhooks que envíes.

### Paso 2: Implementar Endpoint para Recibir Webhooks

En tu servicio (Grupo B), crea un endpoint que reciba webhooks de este servicio (Grupo A):

```python
# Ejemplo en FastAPI (Grupo B)
from fastapi import FastAPI, Request, Header, HTTPException
import hmac
import hashlib
import time

app = FastAPI()

HMAC_SECRET = "whsec_a1b2c3d4e5f6..."  # El que recibiste al registrarte

@app.post("/webhooks/virtual-queue")
async def recibir_webhook_grupo_a(
    request: Request,
    x_webhook_signature: str = Header(..., alias="X-Webhook-Signature"),
    x_webhook_timestamp: str = Header(..., alias="X-Webhook-Timestamp"),
    x_event_type: str = Header(..., alias="X-Event-Type"),
    x_event_id: str = Header(..., alias="X-Event-ID")
):
    """
    Endpoint para recibir webhooks del Grupo A (Virtual Queue CMS).
    """
    body = await request.body()
    timestamp = int(x_webhook_timestamp)
    
    # Verificar firma HMAC
    if not verificar_hmac(body, x_webhook_signature, HMAC_SECRET, timestamp):
        raise HTTPException(status_code=401, detail="Firma HMAC inválida")
    
    # Parsear payload
    payload = await request.json()
    
    # Procesar evento según tipo
    tipo_evento = payload.get("tipo_evento")
    datos = payload.get("datos", {})
    
    if tipo_evento == "booking.confirmed":
        # Ejemplo: Cuando se confirma una reserva en Grupo A
        reserva_id = datos.get("reserva_id")
        usuario_id = datos.get("usuario_id")
        
        # Lógica de tu negocio: ofrecer tours relacionados
        # ...
        
        return {"status": "ok", "mensaje": "Evento procesado"}
    
    return {"status": "ok"}


def verificar_hmac(payload: bytes, firma: str, secreto: str, timestamp: int) -> bool:
    """Verifica firma HMAC-SHA256."""
    tiempo_actual = int(time.time())
    if abs(tiempo_actual - timestamp) > 300:  # 5 minutos de tolerancia
        return False
    
    mensaje = f"{timestamp}.".encode() + payload
    firma_esperada = hmac.new(
        secreto.encode(),
        mensaje,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(firma_esperada, firma)
```

### Paso 3: Enviar Webhooks al Grupo A

Cuando tu servicio (Grupo B) necesite notificar al Grupo A, envía un webhook firmado:

```python
# Ejemplo: Enviar webhook cuando se compra un tour (Grupo B)
import httpx
import hmac
import hashlib
import time
import json

HMAC_SECRET = "whsec_a1b2c3d4e5f6..."  # El que recibiste al registrarte
GRUPO_A_WEBHOOK_URL = "http://payments-service:8000/webhooks/external"

async def notificar_tour_comprado(tour_id: str, usuario_id: str, precio: float):
    """
    Notifica al Grupo A que se compró un tour.
    """
    payload = {
        "origen": "tours-ecuador",
        "tipo_evento": "tour.purchased",
        "datos": {
            "tour_id": tour_id,
            "usuario_id": usuario_id,
            "precio": precio,
            "fecha": "2024-01-01T00:00:00Z"
        }
    }
    
    payload_bytes = json.dumps(payload).encode()
    timestamp = int(time.time())
    
    # Generar firma HMAC
    mensaje = f"{timestamp}.".encode() + payload_bytes
    firma = hmac.new(
        HMAC_SECRET.encode(),
        mensaje,
        hashlib.sha256
    ).hexdigest()
    
    # Enviar webhook
    headers = {
        "Content-Type": "application/json",
        "X-Webhook-Signature": firma,
        "X-Webhook-Timestamp": str(timestamp),
        "X-Partner-ID": "partner_abc123def456"  # Tu partner ID
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GRUPO_A_WEBHOOK_URL,
            content=payload_bytes,
            headers=headers
        )
        response.raise_for_status()
        return response.json()
```

## 🔄 Eventos Bidireccionales

### Flujo Completo de Ejemplo: Hotel ↔ Tours

**Escenario**: Grupo A (Hotel) notifica reserva → Grupo B (Tours) ofrece paquetes → Grupo B notifica compra → Grupo A actualiza itinerario

#### 1. Grupo A → Grupo B: Reserva Confirmada

**Grupo A (Este servicio)** genera evento interno:
```python
# En el código de Grupo A (cuando se confirma una reserva)
await ServicioPartners.notificar_evento(
    evento=TipoEvento.BOOKING_CONFIRMED,
    datos={
        "reserva_id": "res_123",
        "usuario_id": "usr_456",
        "fecha_llegada": "2024-02-15",
        "fecha_salida": "2024-02-20",
        "hotel_id": "hotel_789"
    }
)
```

**Grupo B** recibe webhook:
```
POST https://api.toursecuador.com/webhooks/virtual-queue
Headers:
  X-Webhook-Signature: abc123...
  X-Webhook-Timestamp: 1704067200
  X-Event-Type: booking.confirmed
  X-Event-ID: evt_xyz789

Body:
{
  "evento_id": "evt_xyz789",
  "tipo_evento": "booking.confirmed",
  "datos": {
    "reserva_id": "res_123",
    "usuario_id": "usr_456",
    "fecha_llegada": "2024-02-15",
    "fecha_salida": "2024-02-20"
  },
  "metadatos": {
    "pasarela_origen": "stripe"
  }
}
```

#### 2. Grupo B → Grupo A: Tour Comprado

**Grupo B** envía webhook a Grupo A:
```bash
POST http://payments-service:8000/webhooks/external
Headers:
  X-Webhook-Signature: def456...
  X-Webhook-Timestamp: 1704070800
  X-Partner-ID: partner_abc123def456

Body:
{
  "origen": "tours-ecuador",
  "tipo_evento": "tour.purchased",
  "datos": {
    "tour_id": "tour_001",
    "usuario_id": "usr_456",
    "reserva_id": "res_123",
    "precio": 150.00,
    "fecha_tour": "2024-02-16"
  }
}
```

**Grupo A** procesa el evento y puede actualizar el itinerario del huésped.

### Tipos de Eventos Disponibles

#### Eventos de Reservas/Citas
- `booking.confirmed` - Reserva confirmada
- `booking.cancelled` - Reserva cancelada
- `booking.updated` - Reserva actualizada
- `booking.completed` - Reserva completada

#### Eventos de Pagos
- `payment.success` - Pago exitoso
- `payment.failed` - Pago fallido
- `payment.refunded` - Pago reembolsado

#### Eventos de Suscripciones
- `subscription.created` - Suscripción creada
- `subscription.activated` - Suscripción activada
- `subscription.cancelled` - Suscripción cancelada
- `subscription.renewed` - Suscripción renovada

#### Eventos de Servicios
- `service.activated` - Servicio activado
- `service.deactivated` - Servicio desactivado

#### Eventos de Negocios
- `business.created` - Negocio creado
- `business.updated` - Negocio actualizado

#### Eventos B2B Personalizados
- `order.created` - Orden creada
- `tour.purchased` - Tour comprado
- `external.service` - Servicio externo genérico

## 📡 API Reference

### Partners

#### Registrar Partner
```http
POST /partners/register
Content-Type: application/json

{
  "nombre": "string",
  "webhook_url": "https://...",
  "eventos_suscritos": ["booking.confirmed", "payment.success"],
  "descripcion": "string (opcional)",
  "contacto_email": "string (opcional)",
  "metadatos": {} (opcional)
}
```

#### Listar Partners
```http
GET /partners?solo_activos=true
```

#### Obtener Partner
```http
GET /partners/{partner_id}
```

#### Actualizar Partner
```http
PATCH /partners/{partner_id}
Content-Type: application/json

{
  "webhook_url": "https://nueva-url.com/webhook",
  "eventos_suscritos": ["booking.confirmed"],
  "regenerar_secret": false
}
```

#### Eliminar Partner
```http
DELETE /partners/{partner_id}
```

### Webhooks

#### Recibir Webhook de Partner Externo
```http
POST /webhooks/external
Content-Type: application/json
X-Webhook-Signature: abc123...
X-Webhook-Timestamp: 1704067200
X-Partner-ID: partner_abc123 (opcional)

{
  "origen": "tours-ecuador",
  "tipo_evento": "tour.purchased",
  "datos": {
    "tour_id": "tour_001",
    "usuario_id": "usr_456"
  }
}
```

#### Webhook de Pasarela (Stripe)
```http
POST /webhooks/stripe
Content-Type: application/json

{
  // Formato específico de Stripe
}
```

#### Webhook de Pasarela (MercadoPago)
```http
POST /webhooks/mercadopago
Content-Type: application/json

{
  // Formato específico de MercadoPago
}
```

#### Webhook Mock (Testing)
```http
POST /webhooks/mock
Content-Type: application/json

{
  "tipo": "payment.success",
  "pago_id": "pay_123",
  "monto": 29.99
}
```

### Otros Endpoints

#### Health Check
```http
GET /health
```

#### Información del Servicio
```http
GET /
```

#### Documentación Swagger
```http
GET /docs
```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del microservicio:

```env
# Configuración General
DEBUG=false
PASARELA_ACTIVA=mock  # mock, stripe, mercadopago

# Stripe (si PASARELA_ACTIVA=stripe)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# MercadoPago (si PASARELA_ACTIVA=mercadopago)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=...

# Suscripciones
PRECIO_SUSCRIPCION_MENSUAL=29.99
DIAS_PRUEBA_GRATIS=7

# Webhooks
WEBHOOK_TIMEOUT=30
WEBHOOK_REINTENTOS=3

# HMAC (⚠️ CAMBIAR EN PRODUCCIÓN)
HMAC_SECRET_GLOBAL=secreto_desarrollo_cambiar_en_produccion

# CORS
ALLOWED_ORIGINS=http://localhost:4200,https://tudominio.com

# URLs de Servicios
REST_API_URL=http://rest-typescript:3000
GRAPHQL_URL=http://graphql-service:5000/graphql
```

### Configuración por Pasarela

#### Mock (Desarrollo)
```env
PASARELA_ACTIVA=mock
```
No requiere configuración adicional. Útil para desarrollo y testing.

#### Stripe (Producción)
```env
PASARELA_ACTIVA=stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

#### MercadoPago (Producción)
```env
PASARELA_ACTIVA=mercadopago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=...
```

## 🚀 Despliegue

### Docker

El servicio incluye un `Dockerfile` optimizado:

```bash
# Construir imagen
docker build -t payment-service:latest .

# Ejecutar contenedor
docker run -d \
  --name payment-service \
  -p 8000:8000 \
  --env-file .env \
  payment-service:latest
```

### Docker Compose

El servicio está configurado en `docker-compose.yml`:

```yaml
payments-service:
  build:
    context: ./microservicios/payment
    dockerfile: Dockerfile
  container_name: payments-service
  ports:
    - "8002:8000"
  env_file:
    - ./microservicios/payment/.env
  environment:
    - TZ=America/Guayaquil
  networks:
    - app-net
```

Ejecutar:
```bash
docker-compose up -d payments-service
```

### Verificar Despliegue

```bash
# Health check
curl http://localhost:8002/health

# Ver documentación
open http://localhost:8002/docs
```

## 🔒 Seguridad

### HMAC Authentication

Todos los webhooks deben estar firmados con HMAC-SHA256:

1. **Al enviar webhook**: Genera firma usando `hmac_secret` compartido
2. **Al recibir webhook**: Verifica firma antes de procesar
3. **Timestamp**: Incluido en firma para prevenir replay attacks
4. **Tolerancia**: 5 minutos por defecto

### Mejores Prácticas

1. **Guarda el HMAC Secret de forma segura** (variables de entorno, secrets manager)
2. **Usa HTTPS** en producción para webhooks
3. **Valida el timestamp** para prevenir replay attacks
4. **Implementa idempotencia** en el procesamiento de eventos
5. **Regenera el secret** si se compromete (`PATCH /partners/{id}` con `regenerar_secret: true`)

## 📚 Ejemplos de Integración

### Ejemplo 1: Grupo Hotel + Grupo Tours

Ver sección [Eventos Bidireccionales](#eventos-bidireccionales) arriba.

### Ejemplo 2: Integración con Sistema de Reservas

```python
# En tu servicio (Grupo B)
from fastapi import FastAPI, Request, Header
import httpx

app = FastAPI()
HMAC_SECRET = "whsec_..."
PARTNER_ID = "partner_..."

@app.post("/webhooks/virtual-queue")
async def recibir_webhook(request: Request, ...):
    # Verificar HMAC
    # Procesar evento
    # Responder 200 OK
    
    # Si quieres notificar algo de vuelta:
    await notificar_evento_a_grupo_a(
        tipo="order.created",
        datos={"order_id": "ord_123", "usuario_id": "usr_456"}
    )
```

## 🧪 Testing

### Probar Webhook Mock

```bash
curl -X POST http://localhost:8002/webhooks/mock \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "payment.success",
    "pago_id": "pay_test_123",
    "monto": 29.99
  }'
```

### Probar Webhook con HMAC

```python
import httpx
import hmac
import hashlib
import time
import json

HMAC_SECRET = "whsec_..."
payload = {"origen": "test", "tipo_evento": "external.service", "datos": {}}
payload_bytes = json.dumps(payload).encode()
timestamp = int(time.time())

mensaje = f"{timestamp}.".encode() + payload_bytes
firma = hmac.new(HMAC_SECRET.encode(), mensaje, hashlib.sha256).hexdigest()

response = httpx.post(
    "http://localhost:8002/webhooks/external",
    content=payload_bytes,
    headers={
        "X-Webhook-Signature": firma,
        "X-Webhook-Timestamp": str(timestamp),
        "Content-Type": "application/json"
    }
)
print(response.json())
```

## 📝 Notas Importantes

1. **Requisito de Integración**: Cada grupo debe coordinarse con al menos otro grupo para implementar webhooks bidireccionales.

2. **Formato de Eventos**: Los eventos se normalizan a un formato común, pero los partners pueden enviar eventos personalizados usando `external.service`.

3. **Reintentos**: El servicio reintenta enviar webhooks automáticamente (3 intentos por defecto) con backoff exponencial.

4. **Almacenamiento**: Los partners se almacenan en memoria (para desarrollo). En producción, considerar usar base de datos.

5. **Documentación Swagger**: Disponible en `/docs` cuando el servicio está corriendo.

## 🤝 Soporte

Para preguntas o problemas:
1. Revisa la documentación Swagger en `/docs`
2. Revisa los logs del servicio
3. Contacta al equipo de desarrollo

---

**Versión**: 1.0.0  
**Última actualización**: Enero 2024

