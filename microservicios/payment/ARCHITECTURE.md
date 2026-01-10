# Arquitectura del Microservicio de Pagos

Este documento explica el funcionamiento interno del microservicio de Pagos, su arquitectura y la función de cada archivo.

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Flujo de Ejecución](#flujo-de-ejecución)
3. [Componentes Principales](#componentes-principales)
4. [Estructura de Archivos](#estructura-de-archivos)
5. [Patrones de Diseño](#patrones-de-diseño)

---

## Visión General

El microservicio de Pagos es un sistema integral que gestiona:
- **Pagos con múltiples pasarelas** (Stripe, MercadoPago, Mock)
- **Suscripciones premium** con periodo de prueba gratuito
- **Sistema de webhooks bidireccionales** (recibir y enviar)
- **Integración B2B** con partners externos
- **Sistema de colas con prioridad** para usuarios premium
- **Reembolsos** y gestión de transacciones

### Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────┐
│                    Cliente (Frontend)                   │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP REST
                     ▼
┌─────────────────────────────────────────────────────────┐
│          FastAPI Application (main.py)                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Routers/Controladores               │   │
│  │  - Pagos      - Partners    - Webhooks          │   │
│  │  - Suscripciones    - Cola Premium              │   │
│  └─────────┬────────────────────────────────────────┘   │
└───────────┼──────────────────────────────────────────────┘
            │
┌───────────┴──────────────────────────────────────────────┐
│               Capa de Adaptadores (Factory)              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ MockAdapter │  │   Stripe    │  │ MercadoPago │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└───────────┬──────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────┐
│              Pasarelas Externas                         │
│  - Stripe API     - MercadoPago API     - Mock          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Webhooks Flow                        │
│                                                          │
│  Pasarelas  ──→  Normalizador  ──→  Procesador         │
│     │                                     │              │
│     ▼                                     ▼              │
│  Partners  ◄──  Servicio Partners  ◄──  Sistema        │
│  Externos       (Notificaciones)                        │
└─────────────────────────────────────────────────────────┘
```

---

## Flujo de Ejecución

### 1. Crear un Pago

```
POST /pagos
{
  "monto": 29.99,
  "moneda": "USD",
  "negocio_id": "uuid-negocio",
  "usuario_id": "uuid-usuario",
  "descripcion": "Suscripción Premium",
  "tipo": "suscripcion"
}
```

**Flujo:**

1. **Request llega al controlador** (`app/controladores/pagos.py`)
   - Valida el request según modelo `CrearPagoRequest`

2. **Controlador obtiene adaptador** vía Factory
   ```python
   adaptador = obtener_adaptador()  # Usa configuración PASARELA_ACTIVA
   ```

3. **Adaptador crea el pago** en la pasarela
   - **Mock**: Genera pago simulado instantáneamente
   - **Stripe**: Crea checkout session vía Stripe API
   - **MercadoPago**: Crea preference vía MercadoPago API

4. **Retorna resultado**
   ```json
   {
     "id": "uuid-interno",
     "estado": "pendiente",
     "url_checkout": "https://checkout.stripe.com/...",
     "id_transaccion_externa": "cs_test_..."
   }
   ```

5. **Usuario completa pago** en la pasarela externa

6. **Pasarela envía webhook** → `/webhooks/stripe` o `/webhooks/mercadopago`

7. **Procesador normaliza y procesa** el webhook
   - Actualiza estado del pago
   - Si es suscripción: activa/renueva suscripción
   - Notifica a partners interesados

---

### 2. Crear Suscripción Premium

```
POST /suscripciones
{
  "usuario_id": "uuid-usuario",
  "tipo": "premium",
  "metodo_pago_id": "pm_stripe_..."
}
```

**Flujo:**

1. **Controlador recibe request** (`app/controladores/suscripciones.py`)

2. **Delega al servicio** (`app/servicios/suscripciones.py`)
   ```python
   ServicioSuscripciones.crear_suscripcion(request)
   ```

3. **Servicio crea suscripción**
   - Genera ID único
   - Estado inicial: `PRUEBA` (periodo gratuito)
   - Calcula fecha de fin de prueba
   - Calcula fecha del primer cobro

4. **Actualiza usuario en REST API**
   ```python
   # PATCH /api/usuarios/{usuario_id}
   {"es_premium": true}
   ```

5. **Crea pago programado** (si tiene método de pago)
   - Programa cobro para el fin del periodo de prueba

6. **Notifica a partners** (evento: SUSCRIPCION_CREADA)
   - Envía webhooks a partners suscritos

7. **Retorna suscripción**
   ```json
   {
     "id": "uuid",
     "estado": "prueba",
     "dias_prueba_restantes": 7,
     "beneficios": {
       "prioridad_cola": true,
       "fila_vip": true,
       ...
     }
   }
   ```

---

### 3. Procesar Webhook de Pasarela

```
POST /webhooks/stripe
Headers:
  Stripe-Signature: t=...,v1=...
Body:
  { "type": "payment_intent.succeeded", ... }
```

**Flujo:**

1. **Verificar firma** del webhook
   ```python
   adaptador.verificar_firma_webhook(body, signature, secret)
   ```

2. **Normalizar webhook** (`app/webhooks/normalizador.py`)
   - Convierte formato de pasarela a formato interno
   - Stripe → WebhookEventoInterno
   - MercadoPago → WebhookEventoInterno

3. **Procesador ejecuta lógica** (`app/webhooks/procesador.py`)
   
   **Por tipo de evento:**
   
   - **PAGO_EXITOSO**:
     - Actualiza estado del pago
     - Si es suscripción: activa/renueva
     - Notifica partners
   
   - **PAGO_FALLIDO**:
     - Marca pago como fallido
     - Si es suscripción: suspende
     - Notifica partners
   
   - **REEMBOLSO_PROCESADO**:
     - Actualiza pago original
     - Si es suscripción: cancela
     - Notifica partners

4. **Notificar a partners** interesados
   - Filtra partners por tipo de evento
   - Genera firma HMAC
   - Envía webhook asíncrono
   - Maneja reintentos

5. **Retorna confirmación** a la pasarela
   ```json
   {"recibido": true, "procesado": true}
   ```

---

### 4. Integración B2B con Partners

#### Registrar Partner

```
POST /partners/registrar
{
  "nombre": "Sistema Externo CRM",
  "webhook_url": "https://crm.ejemplo.com/webhooks/payments",
  "eventos_suscritos": ["pago_exitoso", "suscripcion_creada"]
}
```

**Flujo:**

1. **Servicio crea partner** (`app/partners/servicio.py`)
   - Genera ID único: `partner_abc123...`
   - Genera secreto HMAC para firmar webhooks
   - Guarda en almacén

2. **Retorna credenciales**
   ```json
   {
     "id": "partner_abc123...",
     "hmac_secret": "sk_live_...",
     "eventos_suscritos": ["pago_exitoso", "suscripcion_creada"]
   }
   ```

#### Recibir Webhook de Partner

```
POST /webhooks/external
Headers:
  X-Webhook-Signature: sha256=...
  X-Webhook-Timestamp: 1704556800
  X-Partner-ID: partner_abc123
Body:
  {
    "tipo": "external_service",
    "datos": {...}
  }
```

**Flujo:**

1. **Verificar firma HMAC** (`app/seguridad/hmac_auth.py`)
   - Reconstruye firma esperada
   - Compara con firma recibida
   - Valida timestamp (previene replay attacks)

2. **Normalizar evento** externo
   - Convierte a `WebhookEventoInterno`

3. **Procesar según tipo**
   - Ejecuta lógica de negocio
   - Actualiza sistemas internos

4. **Confirmar recepción**

---

### 5. Sistema de Cola Premium

```
POST /cola/agregar
{
  "cita_id": "uuid-cita",
  "negocio_id": "uuid-negocio",
  "usuario_id": "uuid-usuario"
}
```

**Flujo:**

1. **Verificar si usuario es premium**
   ```python
   es_premium = await ServicioSuscripciones.verificar_premium(usuario_id)
   ```

2. **Crear elemento de cola**
   - Premium: `prioridad = 1`
   - Normal: `prioridad = 5`

3. **Agregar a heap** del negocio
   ```python
   ColaPremium.agregar(elemento)
   ```

4. **Calcular posición**
   - Cuenta elementos con mayor/igual prioridad
   - Premium siempre antes que normal

5. **Notificar vía WebSocket**
   - Envía actualización de posición
   - Tiempo estimado de espera

6. **Procesar cola**
   ```python
   siguiente = ColaPremium.siguiente(negocio_id)
   # Retorna el elemento con mayor prioridad
   ```

---

## Componentes Principales

### 1. FastAPI Application (`main.py`)

**Función:** Punto de entrada de la aplicación

**Responsabilidades:**
- Configurar FastAPI
- Registrar routers
- Configurar CORS
- Middleware de logging
- Gestionar lifecycle (startup/shutdown)
- Validar configuración al inicio

**Código clave:**
```python
app = FastAPI(
    title="Virtual Queue CMS - Microservicio de Pagos",
    lifespan=lifespan
)

# CORS
app.add_middleware(CORSMiddleware, allow_origins=allowed_origins)

# Routers
app.include_router(pagos_router)
app.include_router(partners_router)
app.include_router(webhooks_router)
app.include_router(suscripciones_router)
app.include_router(cola_router)
```

**Endpoints expuestos:**
- `GET /` - Información del servicio
- `GET /health` - Health check
- `GET /config` - Configuración actual

---

### 2. Configuration (`app/config.py`)

**Función:** Configuración centralizada

**Responsabilidades:**
- Cargar variables de entorno
- Proveer valores por defecto
- Validar configuración crítica
- Exponer configuración a toda la aplicación

**Variables principales:**
```python
class Configuracion:
    # Pasarelas
    PASARELA_ACTIVA: str = "mock"  # mock, stripe, mercadopago
    
    # Stripe
    STRIPE_SECRET_KEY: Optional[str]
    STRIPE_WEBHOOK_SECRET: Optional[str]
    
    # MercadoPago
    MERCADOPAGO_ACCESS_TOKEN: Optional[str]
    MERCADOPAGO_WEBHOOK_SECRET: Optional[str]
    
    # Suscripciones
    PRECIO_SUSCRIPCION_MENSUAL: float = 29.99
    DIAS_PRUEBA_GRATIS: int = 7
    
    # Seguridad
    HMAC_SECRET_GLOBAL: str  # Para partners B2B
    
    # Servicios
    REST_API_URL: str
    GRAPHQL_URL: str
```

**Validación:**
```python
def validar(cls):
    if cls.PASARELA_ACTIVA == "stripe" and not cls.STRIPE_SECRET_KEY:
        raise ValueError("STRIPE_SECRET_KEY requerido")
    
    if not cls.DEBUG and cls.HMAC_SECRET_GLOBAL == "secreto_desarrollo...":
        raise ValueError("Cambiar HMAC_SECRET_GLOBAL en producción")
```

---

### 3. Controladores (`app/controladores/`)

Manejan requests HTTP y delegan lógica de negocio.

#### Pagos Controller (`pagos.py`)

**Endpoints:**
- `POST /pagos` - Crear pago
- `GET /pagos/{pago_id}` - Consultar pago
- `POST /pagos/reembolso` - Procesar reembolso

**Lógica:**
```python
@router.post("/", response_model=PagoResponse)
async def crear_pago(request: CrearPagoRequest):
    adaptador = obtener_adaptador()
    
    resultado = await adaptador.crear_pago(
        monto=request.monto,
        moneda=request.moneda,
        descripcion=request.descripcion,
        metadatos={...}
    )
    
    if not resultado.exitoso:
        raise HTTPException(status_code=400, detail=resultado.error)
    
    return PagoResponse(...)
```

#### Suscripciones Controller (`suscripciones.py`)

**Endpoints:**
- `POST /suscripciones` - Crear suscripción
- `GET /suscripciones/{id}` - Obtener suscripción
- `GET /suscripciones/usuario/{usuario_id}` - Suscripción de usuario
- `GET /suscripciones/usuario/{usuario_id}/verificar` - Verificar premium
- `POST /suscripciones/cancelar` - Cancelar suscripción
- `POST /suscripciones/{id}/renovar` - Renovar suscripción
- `GET /suscripciones/premium/usuarios` - Listar usuarios premium
- `GET /suscripciones/planes/info` - Info de planes

#### Webhooks Controller (`webhooks.py`)

**Endpoints:**
- `POST /webhooks/stripe` - Recibir webhook de Stripe
- `POST /webhooks/mercadopago` - Recibir webhook de MercadoPago
- `POST /webhooks/mock` - Webhook de testing
- `POST /webhooks/external` - Webhook de partners

**Seguridad:**
```python
@router.post("/stripe")
async def webhook_stripe(
    request: Request,
    stripe_signature: str = Header(None)
):
    body = await request.body()
    
    # Verificar firma
    if not adaptador.verificar_firma_webhook(body, signature, secret):
        raise HTTPException(status_code=401, detail="Firma inválida")
    
    # Procesar
    return await ProcesadorWebhooks.procesar_webhook_pasarela("stripe", payload)
```

#### Partners Controller (`partners.py`)

**Endpoints:**
- `POST /partners/registrar` - Registrar partner
- `GET /partners/{id}` - Obtener partner
- `GET /partners` - Listar partners
- `PATCH /partners/{id}` - Actualizar partner
- `POST /partners/{id}/desactivar` - Desactivar partner
- `POST /partners/{id}/webhook/test` - Probar webhook

#### Cola Controller (`cola.py`)

**Endpoints:**
- `POST /cola/agregar` - Agregar a cola
- `GET /cola/siguiente/{negocio_id}` - Siguiente en cola
- `GET /cola/posicion/{cita_id}` - Posición en cola
- `DELETE /cola/remover/{cita_id}` - Remover de cola
- `GET /cola/estadisticas/{negocio_id}` - Estadísticas de cola

---

### 4. Adaptadores de Pago (`app/adaptador/`)

#### Base Adapter (`base.py`)

**Función:** Interface abstracta para proveedores de pago

**Contrato:**
```python
class ProveedorPagoBase(ABC):
    @property
    @abstractmethod
    def nombre(self) -> str:
        pass
    
    @abstractmethod
    async def crear_pago(...) -> ResultadoPago:
        pass
    
    @abstractmethod
    async def verificar_pago(id_transaccion) -> ResultadoPago:
        pass
    
    @abstractmethod
    async def procesar_reembolso(...) -> ResultadoReembolso:
        pass
    
    @abstractmethod
    def verificar_firma_webhook(body, signature, secret) -> bool:
        pass
    
    @abstractmethod
    def normalizar_webhook(payload) -> Dict:
        pass
```

#### Factory (`factory.py`)

**Patrón Factory + Singleton**

```python
class AdaptadorFactory:
    _adaptadores = {
        "mock": MockAdapter,
        "stripe": StripeAdapter,
        "mercadopago": MercadoPagoAdapter
    }
    
    _instancias = {}
    
    @classmethod
    def obtener(cls, nombre: str = None) -> ProveedorPagoBase:
        nombre = nombre or configuracion.PASARELA_ACTIVA
        
        if nombre not in cls._instancias:
            cls._instancias[nombre] = cls._adaptadores[nombre]()
        
        return cls._instancias[nombre]
```

#### Mock Adapter (`mock_adapter.py`)

**Función:** Adaptador de prueba sin pasarela real

**Características:**
- Simula pagos exitosos instantáneamente
- No requiere configuración externa
- Ideal para desarrollo y testing

```python
async def crear_pago(...) -> ResultadoPago:
    return ResultadoPago(
        exitoso=True,
        id_transaccion=str(uuid.uuid4()),
        estado=EstadoPago.COMPLETADO,
        monto=monto,
        moneda=moneda
    )
```

#### Stripe Adapter (`stripe_adapter.py`)

**Función:** Integración con Stripe

**Características:**
- Checkout sessions
- Payment intents
- Webhooks firmados
- Manejo de suscripciones

```python
async def crear_pago(...) -> ResultadoPago:
    import stripe
    stripe.api_key = configuracion.STRIPE_SECRET_KEY
    
    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items=[{
            'price_data': {
                'currency': moneda.lower(),
                'product_data': {'name': descripcion},
                'unit_amount': int(monto * 100)
            },
            'quantity': 1
        }],
        mode='payment',
        success_url=url_retorno,
        cancel_url=url_cancelacion,
        metadata=metadatos
    )
    
    return ResultadoPago(
        exitoso=True,
        id_transaccion=session.id,
        id_externo=session.payment_intent,
        url_checkout=session.url,
        estado=EstadoPago.PENDIENTE
    )
```

#### MercadoPago Adapter (`mercadopago_adapter.py`)

**Función:** Integración con MercadoPago

**Características:**
- Preferences API
- Payment API
- Webhooks IPN
- Soporte para múltiples países LATAM

---

### 5. Servicios (`app/servicios/`)

#### Servicio Suscripciones (`suscripciones.py`)

**Responsabilidades:**
- Crear/actualizar/cancelar suscripciones
- Gestionar periodos de prueba
- Renovaciones automáticas
- Verificar estado premium
- Sincronizar con REST API

**Métodos clave:**

```python
class ServicioSuscripciones:
    @staticmethod
    async def crear_suscripcion(request):
        # 1. Crear suscripción
        suscripcion = SuscripcionData(
            id=str(uuid.uuid4()),
            usuario_id=request.usuario_id,
            tipo=request.tipo,
            estado=EstadoSuscripcion.PRUEBA,
            precio_mensual=configuracion.PRECIO_SUSCRIPCION_MENSUAL,
            fecha_inicio=datetime.utcnow(),
            dias_prueba_restantes=configuracion.DIAS_PRUEBA_GRATIS
        )
        
        # 2. Calcular fechas
        suscripcion.fecha_proximo_cobro = (
            datetime.utcnow() + 
            timedelta(days=configuracion.DIAS_PRUEBA_GRATIS)
        )
        
        # 3. Guardar
        AlmacenSuscripciones.guardar(suscripcion)
        
        # 4. Actualizar usuario en REST API
        await actualizar_usuario_premium(usuario_id, True)
        
        # 5. Notificar partners
        await ServicioPartners.notificar_evento(
            TipoEvento.SUSCRIPCION_CREADA,
            suscripcion.to_dict()
        )
        
        return suscripcion
    
    @staticmethod
    async def verificar_premium(usuario_id):
        suscripcion = AlmacenSuscripciones.obtener_por_usuario(usuario_id)
        
        if not suscripcion:
            return VerificarPremiumResponse(es_premium=False)
        
        es_activa = suscripcion.estado in [
            EstadoSuscripcion.ACTIVA,
            EstadoSuscripcion.PRUEBA
        ]
        
        return VerificarPremiumResponse(
            es_premium=es_activa,
            tipo_suscripcion=suscripcion.tipo,
            estado=suscripcion.estado,
            beneficios=suscripcion.beneficios
        )
```

#### Servicio Cola Premium (`cola_premium.py`)

**Responsabilidades:**
- Gestionar colas con prioridad
- Ordenar por premium/normal
- Calcular posiciones
- Estadísticas de cola

**Estructura:**

```python
class ColaPremium:
    _colas: Dict[str, List[ElementoCola]] = {}  # Por negocio
    
    @classmethod
    def agregar(cls, elemento: ElementoCola):
        # Usa heap para mantener orden eficiente
        heapq.heappush(cls._colas[negocio_id], elemento)
    
    @classmethod
    def siguiente(cls, negocio_id):
        # Obtiene elemento con mayor prioridad
        return heapq.heappop(cls._colas[negocio_id])
    
    @classmethod
    def obtener_posicion(cls, cita_id):
        # Cuenta elementos antes en la cola
        cola = cls._colas[negocio_id]
        return sum(1 for e in cola if e <= elemento_actual)
```

**Elemento de Cola:**
```python
@dataclass(order=True)
class ElementoCola:
    prioridad: int  # 1=Premium, 5=Normal
    timestamp: float
    cita_id: str
    usuario_id: str
    es_premium: bool
```

---

### 6. Partners (`app/partners/`)

#### Servicio Partners (`servicio.py`)

**Responsabilidades:**
- Registrar/gestionar partners B2B
- Enviar webhooks a partners
- Manejar reintentos
- Auditoría de webhooks

**Notificación a Partners:**

```python
@staticmethod
async def notificar_evento(
    tipo_evento: TipoEvento,
    datos: Dict[str, Any]
):
    # 1. Obtener partners interesados
    partners = AlmacenPartners.listar_por_evento(tipo_evento)
    
    # 2. Crear notificación
    notificacion = NotificacionPartner(
        evento_id=str(uuid.uuid4()),
        tipo=tipo_evento,
        timestamp=datetime.utcnow(),
        datos=datos
    )
    
    # 3. Enviar a cada partner (async)
    tasks = []
    for partner in partners:
        if partner.activo:
            task = enviar_webhook_a_partner(partner, notificacion)
            tasks.append(task)
    
    # 4. Ejecutar en paralelo
    await asyncio.gather(*tasks, return_exceptions=True)

@staticmethod
async def enviar_webhook_a_partner(partner, notificacion):
    # 1. Generar firma HMAC
    timestamp = int(datetime.utcnow().timestamp())
    payload = notificacion.model_dump_json()
    firma = generar_firma_hmac(payload, timestamp, partner.hmac_secret)
    
    # 2. Preparar headers
    headers = {
        "Content-Type": "application/json",
        "X-Webhook-Signature": firma,
        "X-Webhook-Timestamp": str(timestamp),
        "X-Event-Type": notificacion.tipo.value
    }
    
    # 3. Enviar con reintentos
    for intento in range(configuracion.WEBHOOK_REINTENTOS):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    partner.webhook_url,
                    content=payload,
                    headers=headers,
                    timeout=configuracion.WEBHOOK_TIMEOUT
                )
                
                if response.status_code == 200:
                    partner.webhooks_exitosos += 1
                    return True
        
        except Exception as e:
            if intento == configuracion.WEBHOOK_REINTENTOS - 1:
                partner.webhooks_fallidos += 1
                return False
            
            await asyncio.sleep(2 ** intento)  # Backoff exponencial
```

#### Almacén Partners (`almacen.py`)

**Función:** Almacenamiento en memoria de partners

```python
class AlmacenPartners:
    _partners: Dict[str, PartnerData] = {}
    
    @classmethod
    def listar_por_evento(cls, tipo_evento):
        return [
            p for p in cls._partners.values()
            if tipo_evento in p.eventos_suscritos and p.activo
        ]
```

---

### 7. Webhooks (`app/webhooks/`)

#### Procesador (`procesador.py`)

**Responsabilidades:**
- Procesar webhooks de pasarelas
- Actualizar estados
- Ejecutar lógica de negocio
- Notificar a partners

```python
class ProcesadorWebhooks:
    @staticmethod
    async def procesar_webhook_pasarela(pasarela, payload):
        # 1. Normalizar
        evento = NormalizadorWebhooks.normalizar(pasarela, payload)
        
        # 2. Procesar según tipo
        if evento.tipo == TipoEvento.PAGO_EXITOSO:
            await cls._procesar_pago_exitoso(evento)
        elif evento.tipo == TipoEvento.PAGO_FALLIDO:
            await cls._procesar_pago_fallido(evento)
        elif evento.tipo == TipoEvento.REEMBOLSO_PROCESADO:
            await cls._procesar_reembolso(evento)
        
        # 3. Notificar partners
        await ServicioPartners.notificar_evento(evento.tipo, evento.datos)
        
        return WebhookRecibidoResponse(recibido=True, procesado=True)
    
    @staticmethod
    async def _procesar_pago_exitoso(evento):
        # Actualizar pago
        pago_id = evento.datos.get("pago_id")
        
        # Si es suscripción, activar/renovar
        if evento.datos.get("tipo") == "suscripcion":
            suscripcion_id = evento.datos.get("suscripcion_id")
            await ServicioSuscripciones.activar_por_pago(suscripcion_id)
```

#### Normalizador (`normalizador.py`)

**Responsabilidades:**
- Normalizar webhooks de diferentes pasarelas
- Convertir a formato interno común
- Mapear tipos de eventos

```python
class NormalizadorWebhooks:
    @staticmethod
    def normalizar(pasarela, payload):
        adaptador = obtener_adaptador(pasarela)
        datos = adaptador.normalizar_webhook(payload)
        
        return WebhookEventoInterno(
            id=datos["id"],
            tipo=TipoEvento(datos["tipo"]),
            pasarela=pasarela,
            evento_original=datos["evento_original"],
            datos=datos["datos"],
            timestamp=datetime.fromisoformat(datos["timestamp"])
        )
```

**Mapeo de eventos Stripe:**
```
payment_intent.succeeded → PAGO_EXITOSO
payment_intent.payment_failed → PAGO_FALLIDO
charge.refunded → REEMBOLSO_PROCESADO
customer.subscription.created → SUSCRIPCION_CREADA
customer.subscription.updated → SUSCRIPCION_RENOVADA
customer.subscription.deleted → SUSCRIPCION_CANCELADA
```

---

### 8. Seguridad (`app/seguridad/`)

#### HMAC Auth (`hmac_auth.py`)

**Responsabilidades:**
- Generar secretos HMAC
- Firmar payloads
- Verificar firmas
- Prevenir replay attacks

```python
def generar_secreto() -> str:
    """Genera un secreto HMAC seguro."""
    return secrets.token_urlsafe(32)

def generar_firma_hmac(
    payload: str,
    timestamp: int,
    secret: str
) -> str:
    """
    Genera firma HMAC-SHA256.
    
    Formato: sha256=<hex_digest>
    """
    mensaje = f"{timestamp}.{payload}"
    firma = hmac.new(
        secret.encode(),
        mensaje.encode(),
        hashlib.sha256
    ).hexdigest()
    return f"sha256={firma}"

def verificar_firma_hmac(
    payload: str,
    timestamp: int,
    firma_recibida: str,
    secret: str,
    ventana_tiempo: int = 300
) -> bool:
    """
    Verifica firma HMAC.
    
    Args:
        ventana_tiempo: Segundos de tolerancia (default: 5 min)
    
    Returns:
        True si es válida, False si no
    """
    # 1. Verificar timestamp
    ahora = int(datetime.utcnow().timestamp())
    if abs(ahora - timestamp) > ventana_tiempo:
        return False  # Muy antiguo o muy futuro
    
    # 2. Generar firma esperada
    firma_esperada = generar_firma_hmac(payload, timestamp, secret)
    
    # 3. Comparar de forma segura
    return hmac.compare_digest(firma_esperada, firma_recibida)
```

---

### 9. Modelos (`app/modelos/`)

Definen estructuras de datos usando Pydantic.

#### Pago (`pago.py`)

```python
class EstadoPago(str, Enum):
    PENDIENTE = "pendiente"
    COMPLETADO = "completado"
    FALLIDO = "fallido"
    CANCELADO = "cancelado"
    REEMBOLSADO = "reembolsado"

class CrearPagoRequest(BaseModel):
    monto: float
    moneda: str = "USD"
    negocio_id: str
    usuario_id: str
    tipo: str  # suscripcion, cita, servicio
    descripcion: Optional[str] = None
    metadatos: Optional[Dict[str, Any]] = None

class PagoResponse(BaseModel):
    id: str
    negocio_id: str
    usuario_id: str
    monto: float
    moneda: str
    estado: EstadoPago
    tipo: str
    pasarela: str
    id_transaccion_externa: Optional[str]
    url_checkout: Optional[str]
    descripcion: Optional[str]
    metadatos: Dict[str, Any]
    creado_en: datetime
    actualizado_en: datetime
```

#### Suscripción (`suscripcion.py`)

```python
class EstadoSuscripcion(str, Enum):
    PRUEBA = "prueba"
    ACTIVA = "activa"
    CANCELADA = "cancelada"
    SUSPENDIDA = "suspendida"
    VENCIDA = "vencida"

class BeneficiosPremium(BaseModel):
    prioridad_cola: bool = True
    fila_vip: bool = True
    reservas_prioritarias: bool = True
    cancelacion_flexible: bool = True
    soporte_prioritario: bool = True
    notificaciones_avanzadas: bool = True
    sin_publicidad: bool = True
    limite_citas_diarias: int = 10  # Normal: 3

class SuscripcionResponse(BaseModel):
    id: str
    usuario_id: str
    tipo: TipoSuscripcion
    estado: EstadoSuscripcion
    precio_mensual: float
    moneda: str
    fecha_inicio: datetime
    fecha_fin: Optional[datetime]
    fecha_proximo_cobro: Optional[datetime]
    dias_prueba_restantes: int
    beneficios: BeneficiosPremium
```

#### Partner (`partner.py`)

```python
class TipoEvento(str, Enum):
    PAGO_EXITOSO = "pago_exitoso"
    PAGO_FALLIDO = "pago_fallido"
    REEMBOLSO_PROCESADO = "reembolso_procesado"
    SUSCRIPCION_CREADA = "suscripcion_creada"
    SUSCRIPCION_RENOVADA = "suscripcion_renovada"
    SUSCRIPCION_CANCELADA = "suscripcion_cancelada"
    EXTERNAL_SERVICE = "external_service"

class RegistrarPartnerRequest(BaseModel):
    nombre: str
    webhook_url: str
    eventos_suscritos: List[TipoEvento]
    descripcion: Optional[str] = None
    contacto_email: Optional[str] = None
    metadatos: Optional[Dict[str, Any]] = None
```

---

## Estructura de Archivos

```
payment/
├── Dockerfile
├── .dockerignore
├── .gitignore
├── .env
├── .env.example
├── main.py                             # Punto de entrada FastAPI
├── requirements.txt                    # Dependencias
├── README.md                           # Documentación de usuario
├── ARCHITECTURE.md                     # Este archivo
│
└── app/
    ├── __init__.py
    │
    ├── config.py                       # Configuración centralizada
    │   └── Clase Configuracion:
    │       - Variables de entorno
    │       - Validación
    │       - Info de pasarelas
    │
    ├── adaptador/                      # Adaptadores de pago
    │   ├── __init__.py
    │   ├── base.py                     # Interface abstracta
    │   │   └── Clases:
    │   │       - ProveedorPagoBase (ABC)
    │   │       - ResultadoPago
    │   │       - ResultadoReembolso
    │   │
    │   ├── factory.py                  # Factory + Singleton
    │   │   └── AdaptadorFactory:
    │   │       - obtener()
    │   │       - registrar()
    │   │       - listar_disponibles()
    │   │
    │   ├── mock_adapter.py             # Adaptador de prueba
    │   │   └── MockAdapter:
    │   │       - crear_pago()
    │   │       - verificar_pago()
    │   │       - procesar_reembolso()
    │   │
    │   ├── stripe_adapter.py           # Integración Stripe
    │   │   └── StripeAdapter:
    │   │       - crear_pago() → Checkout Session
    │   │       - verificar_firma_webhook()
    │   │       - normalizar_webhook()
    │   │
    │   └── mercadopago_adapter.py      # Integración MercadoPago
    │       └── MercadoPagoAdapter:
    │           - crear_pago() → Preference
    │           - verificar_firma_webhook()
    │           - normalizar_webhook()
    │
    ├── controladores/                  # Controladores HTTP
    │   ├── __init__.py
    │   │
    │   ├── pagos.py                    # Endpoint /pagos
    │   │   └── Rutas:
    │   │       - POST / → crear_pago()
    │   │       - GET /{id} → obtener_pago()
    │   │       - POST /reembolso
    │   │
    │   ├── suscripciones.py            # Endpoint /suscripciones
    │   │   └── Rutas:
    │   │       - POST / → crear_suscripcion()
    │   │       - GET /{id}
    │   │       - GET /usuario/{id}
    │   │       - GET /usuario/{id}/verificar
    │   │       - POST /cancelar
    │   │       - POST /{id}/renovar
    │   │
    │   ├── webhooks.py                 # Endpoint /webhooks
    │   │   └── Rutas:
    │   │       - POST /stripe
    │   │       - POST /mercadopago
    │   │       - POST /mock
    │   │       - POST /external
    │   │
    │   ├── partners.py                 # Endpoint /partners
    │   │   └── Rutas:
    │   │       - POST /registrar
    │   │       - GET /{id}
    │   │       - GET /
    │   │       - PATCH /{id}
    │   │       - POST /{id}/desactivar
    │   │
    │   └── cola.py                     # Endpoint /cola
    │       └── Rutas:
    │           - POST /agregar
    │           - GET /siguiente/{negocio_id}
    │           - GET /posicion/{cita_id}
    │           - DELETE /remover/{cita_id}
    │
    ├── modelos/                        # Modelos Pydantic
    │   ├── __init__.py
    │   ├── pago.py                     # Modelos de pagos
    │   ├── suscripcion.py              # Modelos de suscripciones
    │   ├── partner.py                  # Modelos de partners
    │   └── webhook.py                  # Modelos de webhooks
    │
    ├── servicios/                      # Lógica de negocio
    │   ├── __init__.py
    │   │
    │   ├── suscripciones.py            # Servicio de suscripciones
    │   │   └── Clases:
    │   │       - ServicioSuscripciones
    │   │       - AlmacenSuscripciones
    │   │       - SuscripcionData
    │   │
    │   └── cola_premium.py             # Sistema de colas
    │       └── Clases:
    │           - ColaPremium
    │           - ElementoCola
    │           - PrioridadCola
    │
    ├── partners/                       # Gestión de partners B2B
    │   ├── __init__.py
    │   │
    │   ├── servicio.py                 # Servicio de partners
    │   │   └── ServicioPartners:
    │   │       - registrar_partner()
    │   │       - notificar_evento()
    │   │       - enviar_webhook_a_partner()
    │   │
    │   └── almacen.py                  # Almacenamiento
    │       └── Clases:
    │           - AlmacenPartners
    │           - PartnerData
    │
    ├── webhooks/                       # Procesamiento de webhooks
    │   ├── __init__.py
    │   │
    │   ├── procesador.py               # Procesador principal
    │   │   └── ProcesadorWebhooks:
    │   │       - procesar_webhook_pasarela()
    │   │       - _procesar_pago_exitoso()
    │   │       - _procesar_pago_fallido()
    │   │       - _procesar_reembolso()
    │   │
    │   └── normalizador.py             # Normalizador
    │       └── NormalizadorWebhooks:
    │           - normalizar()
    │           - normalizar_externo()
    │
    └── seguridad/                      # Seguridad
        ├── __init__.py
        └── hmac_auth.py                # Autenticación HMAC
            └── Funciones:
                - generar_secreto()
                - generar_firma_hmac()
                - verificar_firma_hmac()
```

---

## Patrones de Diseño

### 1. Adapter Pattern

**Ubicación:** `app/adaptador/`

**Propósito:** Permitir múltiples pasarelas de pago sin cambiar código

**Implementación:**
```python
# Interface
class ProveedorPagoBase(ABC):
    @abstractmethod
    async def crear_pago(...): pass

# Implementaciones
class StripeAdapter(ProveedorPagoBase):
    async def crear_pago(...):
        # Lógica específica de Stripe

class MercadoPagoAdapter(ProveedorPagoBase):
    async def crear_pago(...):
        # Lógica específica de MercadoPago
```

**Beneficios:**
- Fácil agregar nuevas pasarelas
- Código del controlador independiente de pasarela
- Misma interface para todas

---

### 2. Factory Pattern

**Ubicación:** `app/adaptador/factory.py`

**Propósito:** Crear instancias correctas de adaptadores

**Implementación:**
```python
class AdaptadorFactory:
    _adaptadores = {
        "mock": MockAdapter,
        "stripe": StripeAdapter,
        "mercadopago": MercadoPagoAdapter
    }
    
    @classmethod
    def obtener(cls, nombre=None):
        nombre = nombre or configuracion.PASARELA_ACTIVA
        return cls._adaptadores[nombre]()
```

**Beneficios:**
- Creación centralizada
- Fácil cambiar pasarela
- Extensible

---

### 3. Singleton Pattern

**Ubicación:** Factory y Almacenes

**Propósito:** Una sola instancia compartida

**Implementación:**
```python
class AdaptadorFactory:
    _instancias = {}
    
    @classmethod
    def obtener(cls, nombre):
        if nombre not in cls._instancias:
            cls._instancias[nombre] = cls._adaptadores[nombre]()
        return cls._instancias[nombre]
```

---

### 4. Repository Pattern

**Ubicación:** `AlmacenSuscripciones`, `AlmacenPartners`

**Propósito:** Abstracción de almacenamiento de datos

**Implementación:**
```python
class AlmacenSuscripciones:
    _suscripciones: Dict[str, SuscripcionData] = {}
    
    @classmethod
    def guardar(cls, suscripcion):
        cls._suscripciones[suscripcion.id] = suscripcion
    
    @classmethod
    def obtener(cls, id):
        return cls._suscripciones.get(id)
```

**Beneficios:**
- Fácil cambiar a BD real
- Lógica de acceso centralizada
- Testeable

---

### 5. Observer Pattern (vía Webhooks)

**Ubicación:** Sistema de notificaciones a partners

**Propósito:** Notificar a múltiples observers de eventos

**Implementación:**
```python
# Evento ocurre
await ServicioPartners.notificar_evento(
    TipoEvento.PAGO_EXITOSO,
    datos_pago
)

# Servicio notifica a todos los observers
partners = AlmacenPartners.listar_por_evento(tipo_evento)
for partner in partners:
    await enviar_webhook_a_partner(partner, notificacion)
```

---

### 6. Strategy Pattern

**Ubicación:** Procesamiento de webhooks

**Propósito:** Diferentes estrategias según tipo de evento

**Implementación:**
```python
if evento.tipo == TipoEvento.PAGO_EXITOSO:
    await cls._procesar_pago_exitoso(evento)
elif evento.tipo == TipoEvento.PAGO_FALLIDO:
    await cls._procesar_pago_fallido(evento)
elif evento.tipo == TipoEvento.REEMBOLSO_PROCESADO:
    await cls._procesar_reembolso(evento)
```

---

### 7. Template Method Pattern

**Ubicación:** Adaptadores

**Propósito:** Estructura común, implementación específica

**Template en base:**
```python
async def crear_pago(...):
    # Template method que cada adaptador implementa
    pass
```

**Implementación específica:**
```python
async def crear_pago(...):
    # 1. Validar
    # 2. Llamar API externa
    # 3. Procesar respuesta
    # 4. Retornar ResultadoPago
```

---

### 8. Priority Queue Pattern

**Ubicación:** `app/servicios/cola_premium.py`

**Propósito:** Cola con prioridad para premium

**Implementación:**
```python
import heapq

class ColaPremium:
    @classmethod
    def agregar(cls, elemento):
        heapq.heappush(cls._colas[negocio_id], elemento)
    
    @classmethod
    def siguiente(cls, negocio_id):
        return heapq.heappop(cls._colas[negocio_id])
```

**Elemento ordenado:**
```python
@dataclass(order=True)
class ElementoCola:
    prioridad: int  # 1 = premium, 5 = normal
    timestamp: float
    # Menor prioridad = primero en la cola
```

---

## Flujo de Datos Completo

### Ejemplo: Flujo completo de suscripción

```
1. Usuario se suscribe (Frontend)
   ↓
2. POST /suscripciones
   {
     "usuario_id": "uuid",
     "tipo": "premium"
   }
   ↓
3. ServicioSuscripciones.crear_suscripcion()
   - Crea suscripción en estado PRUEBA
   - Calcula fecha fin de prueba (7 días)
   ↓
4. PATCH /api/usuarios/{id} (REST API)
   {"es_premium": true}
   ↓
5. Notificar partners
   → Webhook a CRM: "suscripcion_creada"
   → Webhook a Analytics: "suscripcion_creada"
   ↓
6. Después de 7 días...
   ↓
7. Sistema crea pago automático
   adaptador.crear_pago(29.99, "Renovación Premium")
   ↓
8. Stripe procesa pago
   ↓
9. Stripe envía webhook
   POST /webhooks/stripe
   {
     "type": "payment_intent.succeeded",
     "data": {...}
   }
   ↓
10. ProcesadorWebhooks normaliza y procesa
    - Actualiza suscripción: PRUEBA → ACTIVA
    - Programa próximo cobro: +30 días
    ↓
11. Notificar partners
    → Webhook: "pago_exitoso"
    → Webhook: "suscripcion_renovada"
    ↓
12. Usuario recibe confirmación
```

---

## Consideraciones de Seguridad

1. **Firmas HMAC** - Todos los webhooks firmados
2. **Validación de timestamp** - Previene replay attacks
3. **Secretos en variables de entorno** - No en código
4. **Validación de firmas de pasarelas** - Stripe, MercadoPago
5. **HTTPS obligatorio en producción**
6. **Sanitización de inputs** - Pydantic valida todo
7. **Rate limiting** - Considerar agregar
8. **Usuario no-root en Docker**

---

## Escalabilidad

1. **Asyncio** - Todas las operaciones I/O asíncronas
2. **Almacenamiento en memoria** - Fácil migrar a Redis/DB
3. **Webhooks asíncronos** - No bloquean requests
4. **Cola con heap** - O(log n) para operaciones
5. **Horizontal scaling** - Stateless (con DB compartida)
6. **Cache** - Se puede agregar para suscripciones
7. **Message Queue** - Se puede agregar Celery/RabbitMQ

---

## Migración a Producción

### Recomendaciones:

1. **Base de datos real**
   - Migrar almacenes a PostgreSQL
   - Usar SQLAlchemy o similar

2. **Cache distribuido**
   - Redis para suscripciones activas
   - Cache de verificaciones premium

3. **Message Queue**
   - RabbitMQ o SQS para webhooks
   - Reintentos automáticos

4. **Monitoreo**
   - Prometheus + Grafana
   - Logs estructurados
   - Alertas de webhooks fallidos

5. **Secretos**
   - AWS Secrets Manager
   - Azure Key Vault
   - Vault

6. **Rate limiting**
   - Redis para contadores
   - Límites por IP/usuario

---

## Testing

### Estrategias:

1. **Mock Adapter** - Para tests sin pasarelas reales
2. **Fixtures** - Datos de prueba consistentes
3. **Tests de integración** - Con Stripe/MercadoPago en sandbox
4. **Tests de webhooks** - Simular firmas válidas/inválidas
5. **Tests de cola** - Verificar priorización
6. **Tests de partners** - Simular notificaciones

---

Este documento describe la arquitectura completa del microservicio de Pagos. Para comenzar a usarlo, consulta el [README.md](README.md).
