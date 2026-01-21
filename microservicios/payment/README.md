# 💳 Microservicio de Pagos - Virtual Queue CMS

Sistema de pagos con abstracción de pasarela, webhooks B2B bidireccionales y suscripciones premium. Implementa el **Pilar 2: Webhooks e Interoperabilidad B2B** del proyecto.

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [✅ Cumplimiento de Requisitos](#-cumplimiento-de-requisitos)
- [Arquitectura](#-arquitectura)
- [Payment Service Wrapper (Patrón Adapter)](#-payment-service-wrapper-patrón-adapter)
- [Registro de Partners](#-registro-de-partners)
- [Autenticación HMAC](#-autenticación-hmac)
- [Eventos Bidireccionales](#-eventos-bidireccionales)
- [Guía de Integración B2B](#-guía-de-integración-b2b)
- [API Reference](#-api-reference)
- [Configuración y Variables de Entorno](#️-configuración-y-variables-de-entorno)
- [Despliegue](#-despliegue)
- [Testing](#-testing)

---

## 🎯 Descripción General

Este microservicio proporciona una solución integral para gestión de pagos empresariales, implementando todos los componentes requeridos para el **Pilar 2: Webhooks e Interoperabilidad B2B**.

### Características Principales

| Característica | Estado | Descripción |
|---------------|--------|-------------|
| Payment Service Wrapper | ✅ Implementado | Abstracción de pasarelas mediante Adapter Pattern |
| Interface PaymentProvider | ✅ Implementado | Contrato abstracto `ProveedorPagoBase` |
| StripeAdapter | ✅ Implementado | Integración completa con Stripe API |
| MercadoPagoAdapter | ✅ Implementado | Integración con MercadoPago |
| MockAdapter | ✅ Implementado | Obligatorio para desarrollo/testing |
| Normalización de Webhooks | ✅ Implementado | Formato común para todas las pasarelas |
| Registro de Partners | ✅ Implementado | API `POST /partners/register` |
| Generación HMAC Secret | ✅ Implementado | Secreto compartido para firma |
| Autenticación HMAC-SHA256 | ✅ Implementado | Firma y verificación de webhooks |
| Eventos Bidireccionales | ✅ Implementado | Comunicación en ambas direcciones |

---

## ✅ Cumplimiento de Requisitos

### 1. Payment Service Wrapper ✅

El microservicio implementa un **Payment Service Wrapper** que abstrae la pasarela de pago mediante el patrón **Adapter**.

#### Interface `ProveedorPagoBase` (PaymentProvider abstracta)

**Ubicación**: `app/adaptador/base.py`

```python
class ProveedorPagoBase(ABC):
    """Interfaz abstracta para proveedores de pago."""
    
    @property
    @abstractmethod
    def nombre(self) -> str:
        """Nombre del proveedor de pago."""
        pass
    
    @abstractmethod
    async def crear_pago(
        self, monto: float, moneda: str, descripcion: str, ...
    ) -> ResultadoPago:
        """Crea un nuevo pago en la pasarela."""
        pass
    
    @abstractmethod
    async def verificar_pago(self, id_transaccion: str) -> ResultadoPago:
        """Verifica el estado de un pago."""
        pass
    
    @abstractmethod
    async def procesar_reembolso(self, id_transaccion: str, ...) -> ResultadoReembolso:
        """Procesa un reembolso total o parcial."""
        pass
    
    @abstractmethod
    def normalizar_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Normaliza un webhook de la pasarela al formato interno."""
        pass
    
    @abstractmethod
    def verificar_firma_webhook(self, payload: bytes, firma: str, secreto: str) -> bool:
        """Verifica la firma de un webhook."""
        pass
```

#### Adapters Implementados

| Adapter | Ubicación | Estado | Descripción |
|---------|-----------|--------|-------------|
| **MockAdapter** | `app/adaptador/mock_adapter.py` | ✅ Obligatorio | Simula pagos para desarrollo |
| **StripeAdapter** | `app/adaptador/stripe_adapter.py` | ✅ Implementado | Integración con Stripe |
| **MercadoPagoAdapter** | `app/adaptador/mercadopago_adapter.py` | ✅ Opcional | Integración con MercadoPago |

#### Factory Pattern

**Ubicación**: `app/adaptador/factory.py`

```python
from app.adaptador import AdaptadorFactory

# Obtener adaptador según configuración (PASARELA_ACTIVA)
adapter = AdaptadorFactory.obtener()

# Obtener adaptador específico
adapter = AdaptadorFactory.obtener("mock")
adapter = AdaptadorFactory.obtener("stripe")
adapter = AdaptadorFactory.obtener("mercadopago")
```

#### Normalización de Webhooks

**Ubicación**: `app/webhooks/normalizador.py`

El `NormalizadorWebhooks` convierte formatos específicos de cada pasarela a un **formato común**:

```json
{
  "id": "evt_abc123",
  "tipo": "payment.success",
  "datos": {
    "pago_id": "pay_123",
    "monto": 29.99,
    "moneda": "USD",
    "estado": "completado",
    "usuario_id": "usr_456",
    "negocio_id": "neg_789"
  },
  "metadatos": {
    "pasarela": "stripe",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

---

### 2. Registro de Partners ✅

API completa para que otros grupos registren sus webhooks y eventos suscritos.

**Ubicación**: `app/partners/servicio.py` y `app/controladores/partners.py`

#### Endpoint Principal: `POST /partners/register`

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

#### Respuesta con HMAC Secret Generado

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

#### Generación de HMAC Secret

**Ubicación**: `app/seguridad/hmac_auth.py`

```python
def generar_secreto(longitud: int = 32) -> str:
    """Genera un secreto aleatorio seguro para HMAC."""
    return f"whsec_{secrets.token_hex(longitud)}"
```

---

### 3. Autenticación HMAC ✅

Todos los webhooks se firman y verifican usando **HMAC-SHA256**.

**Ubicación**: `app/seguridad/hmac_auth.py`

#### Generar Firma HMAC

```python
def generar_firma_hmac(
    payload: bytes,
    secreto: str,
    timestamp: Optional[int] = None
) -> tuple[str, int]:
    """Genera una firma HMAC-SHA256 para un payload."""
    ts = timestamp or int(time.time())
    
    # Concatenar timestamp con payload para prevenir replay attacks
    mensaje = f"{ts}.".encode() + payload
    
    firma = hmac.new(
        secreto.encode(),
        mensaje,
        hashlib.sha256
    ).hexdigest()
    
    return firma, ts
```

#### Verificar Firma HMAC

```python
def verificar_firma_hmac(
    payload: bytes,
    firma: str,
    secreto: str,
    timestamp: int,
    tolerancia_segundos: int = 300  # 5 minutos
) -> bool:
    """Verifica una firma HMAC-SHA256."""
    # Verificar que el timestamp esté dentro de la tolerancia
    tiempo_actual = int(time.time())
    if abs(tiempo_actual - timestamp) > tolerancia_segundos:
        return False
    
    # Calcular firma esperada
    mensaje = f"{timestamp}.".encode() + payload
    firma_esperada = hmac.new(
        secreto.encode(),
        mensaje,
        hashlib.sha256
    ).hexdigest()
    
    # Comparación segura contra timing attacks
    return hmac.compare_digest(firma_esperada, firma)
```

#### Headers de Webhook

| Header | Descripción |
|--------|-------------|
| `X-Webhook-Signature` | Firma HMAC-SHA256 del payload |
| `X-Webhook-Timestamp` | Timestamp Unix del mensaje |
| `X-Event-Type` | Tipo de evento |
| `X-Event-ID` | ID único del evento |
| `X-Partner-ID` | ID del partner (opcional) |

---

### 4. Eventos Bidireccionales ✅

Comunicación en ambas direcciones con grupos partners.

**Ubicación**: `app/partners/servicio.py`

#### Flujo de Comunicación

```
┌─────────────────┐                          ┌─────────────────┐
│     Grupo A     │                          │     Grupo B     │
│   (Este Serv.)  │                          │   (Partner)     │
└────────┬────────┘                          └────────┬────────┘
         │                                            │
         │  1. POST /partners/register                │
         │◄───────────────────────────────────────────│
         │                                            │
         │  2. Response con HMAC Secret               │
         │───────────────────────────────────────────►│
         │                                            │
         │  Evento interno: booking.confirmed         │
         │                                            │
         │  3. POST Webhook (HMAC Signed)             │
         │───────────────────────────────────────────►│
         │                                            │
         │  4. HTTP 200 OK                            │
         │◄───────────────────────────────────────────│
         │                                            │
         │                                            │ Evento interno:
         │                                            │ tour.purchased
         │  5. POST /webhooks/external (HMAC Signed)  │
         │◄───────────────────────────────────────────│
         │                                            │
         │  6. HTTP 200 OK                            │
         │───────────────────────────────────────────►│
```

#### Notificación a Partners

```python
@staticmethod
async def notificar_evento(
    evento: TipoEvento,
    datos: Dict[str, Any],
    metadatos: Optional[Dict[str, Any]] = None
):
    """Notifica un evento a todos los partners suscritos."""
    # 1. Obtener partners interesados en este evento
    partners = AlmacenPartners.listar_por_evento(evento)
    
    # 2. Crear notificación
    notificacion = NotificacionPartner(
        evento_id=str(uuid.uuid4()),
        tipo=evento,
        timestamp=datetime.utcnow(),
        datos=datos
    )
    
    # 3. Enviar a cada partner (async)
    tasks = [
        enviar_webhook_a_partner(partner, notificacion)
        for partner in partners if partner.activo
    ]
    
    # 4. Ejecutar en paralelo
    await asyncio.gather(*tasks, return_exceptions=True)
```

#### Recepción de Webhooks Externos

**Endpoint**: `POST /webhooks/external`

```python
@router.post("/external")
async def recibir_webhook_externo(
    request: Request,
    x_webhook_signature: str = Header(...),
    x_webhook_timestamp: str = Header(...),
    x_partner_id: Optional[str] = Header(None)
):
    """Recibe webhooks de partners externos."""
    body = await request.body()
    
    # Verificar firma HMAC
    if not verificar_firma_hmac(body, x_webhook_signature, secreto, timestamp):
        raise HTTPException(status_code=401, detail="Firma HMAC inválida")
    
    # Normalizar y procesar evento
    payload = await request.json()
    evento = NormalizadorWebhooks.normalizar_externo(
        origen=payload.get("origen"),
        tipo_evento=payload.get("tipo_evento"),
        datos=payload.get("datos", {})
    )
    
    # Procesar evento
    resultado = await ProcesadorWebhooks.procesar(evento)
    
    return {"status": "ok", "procesado": True}
```

---

## 🏗️ Arquitectura

### Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                    Cliente (Frontend)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP REST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│            FastAPI Application (main.py)                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                  Routers/Controladores                  │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐  │  │
│  │  │ Pagos   │ │Partners │ │Webhooks │ │Suscripciones │  │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └──────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ MockAdapter │     │   Stripe    │     │ MercadoPago │
│   (Dev)     │     │   Adapter   │     │   Adapter   │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────────────────────┐
                    │    Pasarelas Externas       │
                    │  Stripe API │ MercadoPago   │
                    └─────────────────────────────┘
```

### Flujo de Webhooks B2B

```
┌──────────────────────────────────────────────────────────────┐
│                    Webhooks Flow                             │
│                                                              │
│  Pasarelas (Stripe/MP)  ──→  Normalizador  ──→  Procesador   │
│         │                                           │        │
│         ▼                                           ▼        │
│  Formato Original           Formato Común      Lógica Negocio│
│                                                     │        │
│                                                     ▼        │
│  Partners Externos  ◄──  Servicio Partners  ◄──  Sistema     │
│                              (HMAC Signed)                   │
└──────────────────────────────────────────────────────────────┘
```

### Estructura de Archivos

```
microservicios/payment/
├── app/
│   ├── __init__.py
│   ├── config.py                 # Configuración centralizada
│   │
│   ├── adaptador/                # Patrón Adapter para pasarelas
│   │   ├── __init__.py
│   │   ├── base.py               # Interface ProveedorPagoBase
│   │   ├── factory.py            # Factory Pattern
│   │   ├── mock_adapter.py       # MockAdapter (obligatorio)
│   │   ├── stripe_adapter.py     # StripeAdapter
│   │   └── mercadopago_adapter.py# MercadoPagoAdapter
│   │
│   ├── controladores/            # Endpoints HTTP
│   │   ├── pagos.py
│   │   ├── partners.py           # POST /partners/register
│   │   ├── webhooks.py           # Webhooks entrantes
│   │   └── suscripciones.py
│   │
│   ├── modelos/                  # Modelos de datos
│   │   ├── pago.py
│   │   ├── partner.py
│   │   └── webhook.py
│   │
│   ├── partners/                 # Lógica de partners B2B
│   │   ├── almacen.py            # Almacenamiento de partners
│   │   └── servicio.py           # Servicio de notificaciones
│   │
│   ├── seguridad/                # Autenticación HMAC
│   │   └── hmac_auth.py          # Funciones HMAC-SHA256
│   │
│   ├── servicios/                # Lógica de negocio
│   │   ├── suscripciones.py
│   │   └── cola_premium.py
│   │
│   └── webhooks/                 # Procesamiento de webhooks
│       ├── normalizador.py       # Normalización a formato común
│       └── procesador.py         # Lógica de procesamiento
│
├── main.py                       # Punto de entrada
├── Dockerfile
├── requirements.txt
└── .env                          # Variables de entorno
```

---

## 🔗 Guía de Integración B2B

### Ejemplo: Integración Hotel ↔ Tours

**Escenario**: Grupo A (Hotel) notifica reserva → Grupo B (Tours) ofrece paquetes → Grupo B notifica tour comprado → Grupo A actualiza itinerario.

### Paso 1: Partner (Grupo B) se Registra

```bash
# Grupo B se registra para recibir webhooks
POST http://payments-service:8000/partners/register
Content-Type: application/json

{
  "nombre": "Tours Ecuador",
  "webhook_url": "https://api.toursecuador.com/webhooks/hotel",
  "eventos_suscritos": ["booking.confirmed", "payment.success"],
  "contacto_email": "tech@toursecuador.com"
}

# Respuesta
{
  "id": "partner_tours_123",
  "hmac_secret": "whsec_abc123def456..."  // ⚠️ GUARDAR
}
```

### Paso 2: Partner (Grupo B) Implementa Endpoint para Recibir

```python
# En el servicio de Tours (Grupo B)
from fastapi import FastAPI, Request, Header, HTTPException
import hmac, hashlib, time

app = FastAPI()
HMAC_SECRET = "whsec_abc123def456..."  # El que recibió al registrarse

@app.post("/webhooks/hotel")
async def recibir_webhook_hotel(
    request: Request,
    x_webhook_signature: str = Header(...),
    x_webhook_timestamp: str = Header(...)
):
    body = await request.body()
    timestamp = int(x_webhook_timestamp)
    
    # Verificar firma HMAC
    if not verificar_hmac(body, x_webhook_signature, HMAC_SECRET, timestamp):
        raise HTTPException(status_code=401, detail="Firma inválida")
    
    # Procesar evento
    payload = await request.json()
    
    if payload["tipo_evento"] == "booking.confirmed":
        # Ofrecer tours relacionados a la reserva
        reserva_id = payload["datos"]["reserva_id"]
        usuario_id = payload["datos"]["usuario_id"]
        await ofrecer_tours(usuario_id, reserva_id)
    
    return {"status": "ok"}


def verificar_hmac(payload: bytes, firma: str, secreto: str, timestamp: int) -> bool:
    tiempo_actual = int(time.time())
    if abs(tiempo_actual - timestamp) > 300:  # 5 minutos
        return False
    
    mensaje = f"{timestamp}.".encode() + payload
    firma_esperada = hmac.new(secreto.encode(), mensaje, hashlib.sha256).hexdigest()
    
    return hmac.compare_digest(firma_esperada, firma)
```

### Paso 3: Partner (Grupo B) Envía Webhooks de Vuelta

```python
# Cuando Grupo B necesita notificar a Grupo A (tour comprado)
import httpx, hmac, hashlib, time, json

HMAC_SECRET = "whsec_abc123def456..."
GRUPO_A_WEBHOOK_URL = "http://payments-service:8000/webhooks/external"

async def notificar_tour_comprado(tour_id: str, usuario_id: str, precio: float):
    payload = {
        "origen": "tours-ecuador",
        "tipo_evento": "tour.purchased",
        "datos": {
            "tour_id": tour_id,
            "usuario_id": usuario_id,
            "precio": precio,
            "fecha_tour": "2024-02-16T10:00:00Z"
        }
    }
    
    payload_bytes = json.dumps(payload).encode()
    timestamp = int(time.time())
    
    # Generar firma HMAC
    mensaje = f"{timestamp}.".encode() + payload_bytes
    firma = hmac.new(HMAC_SECRET.encode(), mensaje, hashlib.sha256).hexdigest()
    
    # Enviar webhook
    headers = {
        "Content-Type": "application/json",
        "X-Webhook-Signature": firma,
        "X-Webhook-Timestamp": str(timestamp),
        "X-Partner-ID": "partner_tours_123"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GRUPO_A_WEBHOOK_URL,
            content=payload_bytes,
            headers=headers
        )
        return response.json()
```

---

## 📡 API Reference

### Partners

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/partners/register` | Registrar nuevo partner |
| `GET` | `/partners` | Listar partners |
| `GET` | `/partners/{id}` | Obtener partner |
| `PATCH` | `/partners/{id}` | Actualizar partner |
| `DELETE` | `/partners/{id}` | Eliminar partner |

### Webhooks

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/webhooks/external` | Recibir webhook de partner externo |
| `POST` | `/webhooks/stripe` | Webhook de Stripe |
| `POST` | `/webhooks/mercadopago` | Webhook de MercadoPago |
| `POST` | `/webhooks/mock` | Webhook de testing |

### Pagos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/pagos` | Crear pago |
| `GET` | `/pagos/{id}` | Obtener pago |
| `POST` | `/pagos/reembolso` | Procesar reembolso |

### Otros

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Documentación Swagger |

---

## ⚙️ Configuración y Variables de Entorno

### Variables Requeridas

```env
# Configuración General
DEBUG=false
PASARELA_ACTIVA=mock  # mock | stripe | mercadopago

# HMAC (⚠️ CAMBIAR EN PRODUCCIÓN)
HMAC_SECRET_GLOBAL=secreto_desarrollo_cambiar_en_produccion

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

# CORS
ALLOWED_ORIGINS=http://localhost:4200,https://tudominio.com

# URLs de Servicios
REST_API_URL=http://rest-typescript:3000
GRAPHQL_URL=http://graphql-service:5000/graphql
```

---

## 🚀 Despliegue

### Docker

```bash
# Construir imagen
docker build -t payment-service:latest .

# Ejecutar
docker run -d \
  --name payment-service \
  -p 8000:8000 \
  --env-file .env \
  payment-service:latest
```

### Docker Compose

```bash
docker-compose up -d payments-service
```

### Verificar Despliegue

```bash
# Health check
curl http://localhost:8002/health

# Ver documentación Swagger
open http://localhost:8002/docs
```

---

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
# Script de prueba: generar_firma_webhook.py
import httpx, hmac, hashlib, time, json

HMAC_SECRET = "whsec_tu_secreto"
payload = {
    "origen": "test",
    "tipo_evento": "tour.purchased",
    "datos": {"tour_id": "tour_001"}
}

payload_bytes = json.dumps(payload).encode()
timestamp = int(time.time())

mensaje = f"{timestamp}.".encode() + payload_bytes
firma = hmac.new(HMAC_SECRET.encode(), mensaje, hashlib.sha256).hexdigest()

response = httpx.post(
    "http://localhost:8002/webhooks/external",
    content=payload_bytes,
    headers={
        "Content-Type": "application/json",
        "X-Webhook-Signature": firma,
        "X-Webhook-Timestamp": str(timestamp)
    }
)
print(response.json())
```

---

## 📚 Tipos de Eventos Soportados

### Eventos de Reservas/Citas
- `booking.confirmed` - Reserva confirmada
- `booking.cancelled` - Reserva cancelada
- `booking.updated` - Reserva actualizada
- `booking.completed` - Reserva completada

### Eventos de Pagos
- `payment.success` - Pago exitoso
- `payment.failed` - Pago fallido
- `payment.refunded` - Pago reembolsado

### Eventos de Suscripciones
- `subscription.created` - Suscripción creada
- `subscription.activated` - Suscripción activada
- `subscription.cancelled` - Suscripción cancelada

### Eventos de Servicios
- `service.activated` - Servicio activado
- `order.created` - Orden creada
- `tour.purchased` - Tour comprado

---

## 🔒 Seguridad

### Mejores Prácticas

1. **Guarda el HMAC Secret de forma segura** (variables de entorno, secrets manager)
2. **Usa HTTPS** en producción para webhooks
3. **Valida el timestamp** para prevenir replay attacks (5 min tolerancia)
4. **Implementa idempotencia** en procesamiento de eventos
5. **Regenera el secret** si se compromete (`PATCH /partners/{id}` con `regenerar_secret: true`)

---

## 📝 Resumen de Cumplimiento

| Requisito | Estado | Evidencia |
|-----------|--------|-----------|
| Payment Service Wrapper con Adapter Pattern | ✅ | `app/adaptador/base.py`, `app/adaptador/factory.py` |
| Interface PaymentProvider abstracta | ✅ | `ProveedorPagoBase` en `base.py` |
| StripeAdapter implementado | ✅ | `app/adaptador/stripe_adapter.py` |
| MercadoPagoAdapter (opcional) | ✅ | `app/adaptador/mercadopago_adapter.py` |
| MockAdapter (obligatorio) | ✅ | `app/adaptador/mock_adapter.py` |
| Normalización de webhooks | ✅ | `app/webhooks/normalizador.py` |
| `POST /partners/register` | ✅ | `app/controladores/partners.py` |
| Generación de secret HMAC | ✅ | `app/seguridad/hmac_auth.py` |
| Autenticación HMAC-SHA256 | ✅ | `generar_firma_hmac()`, `verificar_firma_hmac()` |
| Eventos bidireccionales | ✅ | `ServicioPartners.notificar_evento()`, `/webhooks/external` |

---

**⚠️ Requisito de Integración**: Cada grupo debe coordinarse con al menos otro grupo para implementar webhooks bidireccionales. Contacte a su grupo partner y siga la [Guía de Integración B2B](#-guía-de-integración-b2b).
