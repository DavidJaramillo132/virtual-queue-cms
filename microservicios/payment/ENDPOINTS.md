# 📡 API Endpoints - Microservicio de Pagos

Documentación completa de todos los endpoints disponibles en el microservicio de pagos.

---

## 📋 Índice Rápido

| Módulo | Prefijo | Descripción |
|--------|---------|-------------|
| [General](#-general) | `/` | Información del servicio y health check |
| [Pagos](#-pagos) | `/pagos` | Crear pagos, reembolsos, estado |
| [Suscripciones](#-suscripciones-premium) | `/suscripciones` | Gestión de suscripciones premium |
| [Webhooks](#-webhooks) | `/webhooks` | Recepción de eventos de pasarelas y partners |
| [Partners B2B](#-partners-b2b) | `/partners` | Registro y gestión de partners |
| [Cola Premium](#-cola-premium) | `/cola` | Sistema de cola con prioridad |
| [Configuración](#️-configuración) | `/config` | Configuración pública del servicio |
| [Descuentos](#-descuentos) | `/descuentos` | Gestión de descuentos de usuarios |

---

## 🏠 General

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/` | Información general del servicio y lista de endpoints disponibles |
| `GET` | `/health` | Health check para monitoreo. Retorna estado del servicio y pasarela activa |
| `GET` | `/docs` | Documentación interactiva Swagger UI |
| `GET` | `/redoc` | Documentación alternativa con ReDoc |

---

## 💳 Pagos

**Prefijo:** `/pagos`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/pagos/` | **Crear pago** - Procesa un nuevo pago a través de la pasarela configurada (mock, stripe, mercadopago). Retorna ID de transacción y URL de checkout si aplica |
| `GET` | `/pagos/{pago_id}` | **Obtener estado** - Consulta el estado actual de un pago por su ID |
| `POST` | `/pagos/reembolso` | **Procesar reembolso** - Ejecuta un reembolso total o parcial de un pago existente |
| `GET` | `/pagos/pasarelas/disponibles` | **Listar pasarelas** - Muestra todas las pasarelas de pago disponibles y cuál está activa |

### Ejemplo: Crear un pago

```bash
curl -X POST http://localhost:8000/pagos/ \
  -H "Content-Type: application/json" \
  -d '{
    "negocio_id": "neg_123",
    "usuario_id": "usr_456",
    "monto": 29.99,
    "moneda": "USD",
    "tipo": "suscripcion",
    "descripcion": "Suscripción Premium Mensual"
  }'
```

---

## ⭐ Suscripciones Premium

**Prefijo:** `/suscripciones`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/suscripciones/` | **Crear suscripción** - Crea una nueva suscripción premium. Inicia con período de prueba gratuito |
| `GET` | `/suscripciones/{suscripcion_id}` | **Obtener suscripción** - Consulta los detalles de una suscripción por su ID |
| `GET` | `/suscripciones/usuario/{usuario_id}` | **Por usuario** - Obtiene la suscripción activa de un usuario específico |
| `GET` | `/suscripciones/usuario/{usuario_id}/verificar` | **Verificar premium** - Verifica si un usuario tiene suscripción activa y retorna beneficios |
| `POST` | `/suscripciones/cancelar` | **Cancelar** - Cancela una suscripción. Permanece activa hasta el final del período pagado |
| `POST` | `/suscripciones/{suscripcion_id}/renovar` | **Renovar** - Renueva manualmente una suscripción |
| `GET` | `/suscripciones/premium/usuarios` | **Listar usuarios premium** - Lista IDs de todos los usuarios con suscripción activa |
| `GET` | `/suscripciones/planes/info` | **Info de planes** - Información de planes disponibles, precios y beneficios |

### Ejemplo: Verificar si usuario es premium

```bash
curl -X GET http://localhost:8000/suscripciones/usuario/usr_456/verificar
```

**Respuesta:**
```json
{
  "es_premium": true,
  "beneficios": {
    "prioridad_cola": true,
    "fila_vip": true,
    "reservas_prioritarias": true,
    "cancelacion_flexible": true,
    "soporte_prioritario": true,
    "notificaciones_avanzadas": true,
    "sin_publicidad": true,
    "limite_citas_diarias": 10
  }
}
```

---

## 🔔 Webhooks

**Prefijo:** `/webhooks`

### Webhooks de Pasarelas de Pago

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/webhooks/stripe` | **Stripe** - Recibe eventos de Stripe. Header: `Stripe-Signature` |
| `POST` | `/webhooks/mercadopago` | **MercadoPago** - Recibe eventos de MercadoPago. Header: `X-Signature` |
| `POST` | `/webhooks/mock` | **Mock** - Webhook del adaptador mock (solo testing) |

### Webhooks de Integraciones Externas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/webhooks/external` | **Externo genérico** - Endpoint principal B2B. Requiere firma HMAC |
| `POST` | `/webhooks/partners/{partner_id}` | **Partner específico** - Recibe webhooks de partners registrados |
| `POST` | `/webhooks/test` | **Prueba** - Endpoint de prueba sin auth (solo desarrollo) |

### Gestión de Eventos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/webhooks/eventos?limite=50` | **Eventos procesados** - Lista los últimos eventos procesados |

### Headers Requeridos para Webhooks Externos

**Formato Simple (Recomendado):**
```http
POST /webhooks/partners/{partner_id}
Content-Type: application/json
X-Webhook-Signature: {firma_hmac_hexadecimal}
X-Webhook-Timestamp: 1705590000
X-Partner-ID: {partner_uuid}
```

**Ejemplo completo:**
```bash
curl -X POST http://localhost:8000/webhooks/partners/7351757e-7f56-4133-af42-b8e8522b6316 \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: a1b2c3d4e5f6..." \
  -H "X-Webhook-Timestamp: 1705590000" \
  -H "X-Partner-ID: 7351757e-7f56-4133-af42-b8e8522b6316" \
  -d '{"event_type": "payment.success", "data": {...}}'
```

---

## 🤝 Partners B2B

**Prefijo:** `/partners`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/partners/register` | **Registrar** - Registra un nuevo partner B2B. Retorna ID y secreto HMAC |
| `GET` | `/partners/?solo_activos=true` | **Listar** - Lista todos los partners registrados |
| `GET` | `/partners/{partner_id}` | **Obtener** - Información de un partner específico |
| `PATCH` | `/partners/{partner_id}` | **Actualizar** - Actualiza partner. Puede regenerar secreto HMAC |
| `DELETE` | `/partners/{partner_id}` | **Eliminar** - Elimina un partner del sistema |
| `GET` | `/partners/eventos/disponibles` | **Eventos disponibles** - Lista tipos de eventos para suscripción |
| `POST` | `/partners/verificar-webhook` | **Verificar URL** - Verifica que URL de webhook sea accesible |
| `POST` | `/partners/notificar/{evento}` | **Notificación manual** - Envía notificación a partners suscritos |

### Tipos de Eventos Disponibles

| Evento | Descripción |
|--------|-------------|
| `booking.confirmed` | Se confirma una reserva/cita |
| `booking.cancelled` | Se cancela una reserva/cita |
| `booking.updated` | Se actualiza una reserva/cita |
| `booking.completed` | Se completa una reserva/cita |
| `payment.success` | Pago procesado exitosamente |
| `payment.failed` | Fallo en el procesamiento del pago |
| `payment.refunded` | Se procesó un reembolso |
| `subscription.created` | Se crea una suscripción |
| `subscription.activated` | Se activa una suscripción |
| `subscription.cancelled` | Se cancela una suscripción |
| `subscription.renewed` | Se renueva una suscripción |
| `service.activated` | Se activa un servicio |
| `service.deactivated` | Se desactiva un servicio |
| `business.created` | Se crea un negocio |
| `business.updated` | Se actualiza un negocio |
| `order.created` | Se crea una orden |
| `tour.purchased` | Se compra un tour |
| `external.service` | Evento de servicio externo |

### Ejemplo: Registrar partner

```bash
curl -X POST http://localhost:8000/partners/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Mi Aplicación",
    "webhook_url": "https://miapp.com/webhooks/payment",
    "eventos_suscritos": ["payment.success", "subscription.created"]
  }'
```

---

## 📊 Cola Premium

**Prefijo:** `/cola`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/cola/agregar` | **Agregar** - Agrega cita a la cola. Citas premium tienen prioridad automática |
| `GET` | `/cola/siguiente/{negocio_id}` | **Siguiente** - Obtiene y remueve la siguiente cita a atender |
| `GET` | `/cola/posicion/{cita_id}` | **Posición** - Consulta la posición actual de una cita en la cola |
| `DELETE` | `/cola/cancelar/{cita_id}` | **Cancelar** - Remueve una cita de la cola |
| `GET` | `/cola/negocio/{negocio_id}` | **Estado cola** - Estado completo de la cola del negocio |
| `GET` | `/cola/estadisticas/{negocio_id}` | **Estadísticas** - Estadísticas detalladas de la cola |
| `DELETE` | `/cola/limpiar/{negocio_id}` | **Limpiar** - Limpia la cola (solo administradores) |

### Ejemplo: Agregar a cola

```bash
curl -X POST http://localhost:8000/cola/agregar \
  -H "Content-Type: application/json" \
  -d '{
    "cita_id": "cita_789",
    "negocio_id": "neg_123",
    "usuario_id": "usr_456",
    "es_premium": true
  }'
```

---

## ⚙️ Configuración

**Prefijo:** `/config`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/config/stripe` | **Config Stripe** - Configuración pública de Stripe (publishable key) para frontend |
| `GET` | `/config/info` | **Info general** - Información general del servicio (sin secretos) |

---

## 🏷️ Descuentos

**Prefijo:** `/descuentos`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/descuentos/usuario/{usuario_id}` | **Por usuario** - Obtiene todos los descuentos activos de un usuario |
| `GET` | `/descuentos/stats` | **Estadísticas** - Estadísticas generales de descuentos |

---

## 🔐 Autenticación HMAC

Los webhooks externos requieren firma HMAC-SHA256 para verificar autenticidad.

### Generar firma (Formato Simple)

```python
import hmac
import hashlib
import time
import json

def generar_firma_hmac(payload: bytes, secreto: str, timestamp: int) -> str:
    """
    Genera firma HMAC-SHA256 en formato simple.
    
    Args:
        payload: Datos a firmar en bytes
        secreto: Secreto compartido HMAC
        timestamp: Timestamp Unix
        
    Returns:
        Firma hexadecimal
    """
    mensaje = f"{timestamp}.".encode() + payload
    firma = hmac.new(
        secreto.encode(),
        mensaje,
        hashlib.sha256
    ).hexdigest()
    return firma

# Uso
timestamp = int(time.time())
evento = {"event_type": "payment.success", "data": {"amount": 100}}
payload = json.dumps(evento, ensure_ascii=False).encode('utf-8')
firma = generar_firma_hmac(payload, "tu_secreto_hmac", timestamp)

# Headers a enviar:
headers = {
    "Content-Type": "application/json",
    "X-Webhook-Signature": firma,
    "X-Webhook-Timestamp": str(timestamp),
    "X-Partner-ID": "tu_partner_id"
}
```

---

## 🚀 Iniciar Servicio

```bash
# Desarrollo
uvicorn main:app --reload --port 8000

# Producción  
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 📚 Recursos Adicionales

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`
- **Arquitectura detallada**: Ver [ARCHITECTURE.md](ARCHITECTURE.md)
- **README principal**: Ver [README.md](README.md)
