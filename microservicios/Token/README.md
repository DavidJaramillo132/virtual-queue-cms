# Token Microservicio - Auth Service

Microservicio de autenticacion independiente que implementa el **Pilar 1** del proyecto Virtual Queue CMS.

---

## Descripcion General

Este microservicio es responsable exclusivamente de la gestion de autenticacion, siguiendo el principio de responsabilidad unica. Evita el antipatro de llamadas constantes al servicio de autenticacion en cada request, ya que los demas servicios validan tokens **localmente**.

---

## Arquitectura

```
                                 FLUJO DE AUTENTICACION
                                 
    +-------------+      1. Login       +-------------+      2. Auth      +-------------+
    |   Frontend  | ------------------> |  REST API   | -----------------> |   Token     |
    |  (Angular)  |                     | (TypeScript)|                    |   Service   |
    +-------------+                     +-------------+                    +-------------+
          |                                   |                                  |
          |                                   |                                  |
          | 3. Almacena tokens                |                                  |
          |    en localStorage                |                                  |
          v                                   v                                  |
    +-------------+     4. Peticiones   +-------------+                          |
    |   Frontend  | ------------------> |  REST API   |                          |
    |  (Angular)  |   con Bearer Token  |  Middleware | <-- JWT_SECRET ----------+
    +-------------+                     +-------------+    (compartido)
                                              |
                                              | 5. Validacion LOCAL
                                              |    jwt.verify(token, secret)
                                              |    SIN llamar a Token Service
                                              v
                                        +-------------+
                                        |   Respuesta |
                                        +-------------+
```

### Principios Clave

1. **Login unico**: El REST service llama al Token service **una sola vez** durante el login
2. **Validacion local**: Los servicios (REST, WebSocket, GraphQL) validan JWT localmente usando el `JWT_SECRET` compartido
3. **Sin dependencia constante**: No se consulta al Auth Service en cada peticion
4. **Tokens rotativos**: Los refresh tokens se rotan en cada uso para mayor seguridad
5. **Tokens únicos garantizados**: Múltiples capas de validación previenen duplicación de tokens

---

## Garantía de Unicidad de Tokens

El servicio implementa **múltiples capas de seguridad** para garantizar que cada token generado sea único y nunca se reutilice:

### 🔐 Access Token (JWT)

**Formato del JTI:** `UUID-v4 + timestamp`
```typescript
// Ejemplo: 550e8400-e29b-41d4-a716-446655440000-1737331200000
const jti = `${uuidv4()}-${Date.now()}`;
```

**Protecciones:**
- Cada JWT tiene un `jti` (JWT ID) único
- Combinación de UUID v4 (aleatorio criptográfico) + timestamp en milisegundos
- Los tokens revocados se almacenan en tabla `revoked_tokens` con constraint UNIQUE
- Índice único en columna `jti` previene duplicados a nivel de BD

### 🔄 Refresh Token

**Formato:** `UUID.UUID.timestamp`
```typescript
// Ejemplo: 550e8400-e29b-41d4-a716-446655440000.7c9e6679-7425-40de-944b-e07fc1f90ae7.1737331200000
const refreshToken = `${uuidv4()}.${uuidv4()}.${Date.now()}`;
```

**Protecciones:**
1. **Nivel de Código:**
   ```typescript
   // Verificación pre-inserción
   const existing = await db.get('SELECT id FROM refresh_tokens WHERE token = ?', refreshToken);
   if (existing) {
     console.error('[CRITICAL] Token duplicado detectado!');
     return res.status(500).json({ message: 'Error generando token' });
   }
   ```

2. **Nivel de Base de Datos:**
   ```sql
   CREATE TABLE refresh_tokens (
     token TEXT NOT NULL UNIQUE,  -- Constraint de unicidad
     ...
   );
   CREATE UNIQUE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
   ```

### 🔁 Rotación de Tokens en /auth/refresh

Cuando un usuario renueva sus tokens:

1. ✅ Se valida el refresh token actual
2. 🚫 Se **revoca** el token antiguo (`revoked = 1`)
3. 🆕 Se genera un **nuevo refresh token único**
4. 🔍 Se verifica que no exista en la BD
5. 🆕 Se genera un **nuevo access token con nuevo jti**
6. 📤 Se retornan ambos tokens nuevos

**Esto previene:**
- ❌ Reutilización de tokens antiguos
- ❌ Ataques de replay
- ❌ Tokens obsoletos en circulación
- ❌ Sesiones duplicadas

### 📊 Probabilidad de Colisión

Con UUID v4 + timestamp:
- **UUID v4:** 2^122 combinaciones posibles (5.3 × 10^36)
- **Timestamp:** Resolución de 1ms (único en el tiempo)
- **Probabilidad de colisión:** Prácticamente 0% (menor que ganar la lotería 8 veces seguidas)

---

## Componentes Internos

### Estructura del Codigo

```
microservicios/Token/
├── index.js           # Servidor Express con todos los endpoints
├── package.json       # Dependencias del proyecto
├── Dockerfile         # Configuracion para contenedor Docker
├── smoke_test.js      # Pruebas basicas de funcionamiento
├── token.db           # Base de datos SQLite (generada automaticamente)
└── README.md          # Documentacion
```

### Dependencias Principales

| Paquete | Proposito |
|---------|-----------|
| express | Framework HTTP para endpoints REST |
| jsonwebtoken | Generacion y verificacion de JWT |
| bcrypt | Hash seguro de passwords |
| sqlite3 + sqlite | Base de datos embebida |
| uuid | Generacion de identificadores unicos |
| express-rate-limit | Proteccion contra ataques de fuerza bruta |
| dotenv | Carga de variables de entorno |

---

## Base de Datos

SQLite local con 3 tablas independientes:

### Tabla: `users`
Almacena credenciales de usuarios para el sistema de autenticacion.

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,           -- UUID del usuario
    email TEXT UNIQUE NOT NULL,    -- Email unico
    password_hash TEXT NOT NULL,   -- Password hasheado con bcrypt
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: `refresh_tokens`
Gestiona tokens de renovacion con estado de revocacion.

```sql
CREATE TABLE refresh_tokens (
    id TEXT PRIMARY KEY,           -- UUID del token
    user_id TEXT NOT NULL,         -- Referencia al usuario
    token TEXT NOT NULL,           -- Token de refresh (UUID.UUID)
    expires_at DATETIME NOT NULL,  -- Fecha de expiracion
    revoked INTEGER DEFAULT 0,     -- 0=activo, 1=revocado
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```

### Tabla: `revoked_tokens`
Blacklist de access tokens revocados usando su JTI (JWT ID).

```sql
CREATE TABLE revoked_tokens (
    id TEXT PRIMARY KEY,           -- UUID del registro
    jti TEXT NOT NULL,             -- JWT ID del token revocado
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Endpoints API

### POST /auth/register
Registra un nuevo usuario en el sistema de autenticacion.

**Request:**
```json
{
    "email": "usuario@ejemplo.com",
    "password": "password123"
}
```

**Response (201):**
```json
{
    "id": "uuid-del-usuario",
    "email": "usuario@ejemplo.com"
}
```

---

### POST /auth/login
Autentica un usuario y genera tokens de acceso.

**Request:**
```json
{
    "email": "usuario@ejemplo.com",
    "password": "password123"
}
```

**Response (200):**
```json
{
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "uuid.uuid",
    "expiresIn": "30m"
}
```

**Rate Limiting:** 10 intentos por minuto por IP.

---

### POST /auth/refresh
Renueva el access token usando un refresh token valido. El refresh token antiguo se revoca y se genera uno nuevo (rotacion).

**Request:**
```json
{
    "refreshToken": "uuid.uuid"
}
```

**Response (200):**
```json
{
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "nuevo-uuid.uuid",
    "expiresIn": "30m"
}
```

---

### POST /auth/logout
Revoca los tokens proporcionados para cerrar sesion de forma segura.

**Request:**
```json
{
    "refreshToken": "uuid.uuid",
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
    "success": true
}
```

---

### GET /auth/me
Obtiene informacion del usuario autenticado.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
    "id": "uuid-del-usuario",
    "email": "usuario@ejemplo.com"
}
```

---

### POST /auth/validate
Endpoint interno para validar un token (usado por otros servicios si es necesario).

**Request:**
```json
{
    "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
    "valid": true,
    "decoded": {
        "id": "uuid",
        "email": "usuario@ejemplo.com",
        "jti": "jwt-id",
        "iat": 1234567890,
        "exp": 1234569690
    }
}
```

---

## Seguridad

### Rate Limiting
- **Login**: Maximo 10 intentos por minuto por IP
- Respuesta 429 cuando se excede el limite

### Blacklist de Tokens
- Access tokens revocados se almacenan en `revoked_tokens` usando su JTI
- Refresh tokens revocados se marcan con `revoked = 1`

### Rotacion de Refresh Tokens
Al hacer refresh:
1. El refresh token antiguo se marca como revocado
2. Se genera un nuevo refresh token
3. Se retorna junto con el nuevo access token

### Limpieza Automatica
Job periodico que elimina:
- Refresh tokens expirados
- Refresh tokens revocados hace mas de 7 dias
- Registros de tokens revocados con mas de 30 dias

---

## Configuracion

### Variables de Entorno

| Variable | Descripcion | Default | Recomendado |
|----------|-------------|---------|-------------|
| `JWT_SECRET` | Secreto para firmar tokens JWT | 'default_secret' | Cadena aleatoria de 32+ caracteres |
| `PORT` | Puerto del servicio | 4000 | 4000 |
| `ACCESS_EXPIRES` | Duracion del access token | '30m' | '15m' a '30m' |
| `REFRESH_EXPIRES_DAYS` | Dias de validez del refresh token | 30 | 7 a 30 |
| `CLEANUP_INTERVAL_MS` | Intervalo de limpieza (ms) | 3600000 | 3600000 (1 hora) |
| `DB_PATH` | Ruta al archivo SQLite | './token.db' | '/app/data/token.db' en Docker |

### Ejemplo de .env

```env
JWT_SECRET=mi_clave_super_secreta_de_32_caracteres_minimo
PORT=4000
ACCESS_EXPIRES=30m
REFRESH_EXPIRES_DAYS=30
CLEANUP_INTERVAL_MS=3600000
DB_PATH=./token.db
```

---

## Docker

### Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app

# Crear directorio para persistencia de BD
RUN mkdir -p /app/data

COPY package.json ./
RUN npm install --production
COPY . .

# Variable de entorno para ubicacion de BD
ENV DB_PATH=/app/data/token.db

EXPOSE 4000
CMD ["npm","start"]
```

### Docker Compose

```yaml
token-service:
  build:
    context: ./microservicios/Token
    dockerfile: Dockerfile
  container_name: token-service
  restart: always
  ports:
    - "4000:4000"
  environment:
    - JWT_SECRET=clave_secreta_compartida
    - PORT=4000
    - ACCESS_EXPIRES=30m
    - REFRESH_EXPIRES_DAYS=30
    - CLEANUP_INTERVAL_MS=3600000
  volumes:
    - token-data:/app/data    # Persistencia de BD
  networks:
    - app-net
```

**Importante**: El volumen `token-data` persiste la base de datos SQLite entre reinicios del contenedor.

---

## Ejecucion

### Desarrollo Local

```powershell
cd microservicios/Token
npm install
npm start
```

Salida esperada:
```
Token service listening on port 4000
ACCESS_EXPIRES: 30m, REFRESH_EXPIRES_DAYS: 30
[Cleanup] Job iniciado, intervalo: 3600000ms
```

### Pruebas

```powershell
cd microservicios/Token
node smoke_test.js
```

El smoke test ejecuta:
1. Registro de usuario
2. Login
3. Obtener informacion con /auth/me
4. Refresh de tokens
5. Logout
6. Verificar que el token esta revocado

### Docker

```powershell
# Solo el servicio de token
docker-compose up token-service

# Todos los servicios
docker-compose up -d
```

---

## Integracion con Otros Servicios

### REST API (TypeScript)
El REST service se conecta via `TOKEN_SERVICE_URL`:

```typescript
// En AuthController.ts
const tokenServiceUrl = process.env.TOKEN_SERVICE_URL || 'http://token-service:4000';

// Login: llama al token service
const tokenResp = await axios.post(`${tokenServiceUrl}/auth/login`, { email, password });
```

### Validacion Local (Middleware)
Los servicios validan tokens localmente SIN llamar al Token service:

```typescript
// En Middleware.ts
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded;
```

### Frontend (Angular)
El frontend almacena tokens en localStorage y usa un interceptor HTTP:

```typescript
// Guardar tokens despues del login
localStorage.setItem('token', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);

// Interceptor renueva automaticamente cuando expira
```

---

## Diagrama de Secuencia - Login Completo

```
Usuario      Frontend       REST API       Token Service      SQLite
   |             |              |                |               |
   |--Login----->|              |                |               |
   |             |--POST /login->|               |               |
   |             |              |--POST /auth/login------------->|
   |             |              |                |--Verificar--->|
   |             |              |                |<--Usuario-----|
   |             |              |                |--Generar JWT--|
   |             |              |                |--Guardar RT-->|
   |             |              |<--tokens-------|               |
   |             |<--tokens-----|                |               |
   |             |--Guardar     |                |               |
   |             |  localStorage|                |               |
   |<--Redirect--|              |                |               |
   |             |              |                |               |
   |--Peticion-->|              |                |               |
   |             |--GET /api/x->|                |               |
   |             |              |--Validar LOCAL-|               |
   |             |              |  (jwt.verify)  |               |
   |             |              |--Procesar----->|               |
   |             |<--Respuesta--|                |               |
   |<--Datos-----|              |                |               |
```

---

## Troubleshooting

### Error: "Token expirado"
- El access token ha expirado (default 30m)
- Solucion: Usar el refresh token para obtener uno nuevo

### Error: "Refresh token invalido"
- El refresh token fue revocado o no existe
- Solucion: El usuario debe volver a hacer login

### Error: "Too many login attempts"
- Se excedio el rate limit (10 intentos/minuto)
- Solucion: Esperar 1 minuto antes de reintentar

### La BD no persiste en Docker
- Verificar que el volumen `token-data` este correctamente montado
- Verificar que `DB_PATH=/app/data/token.db`

---

## Cumplimiento del Pilar 1

| Requisito | Estado | Implementacion |
|-----------|--------|----------------|
| Auth Service independiente | OK | Microservicio Node.js dedicado |
| JWT con access y refresh tokens | OK | Access (30m) + Refresh (30d) |
| Validacion local | OK | Middleware usa jwt.verify() |
| Base de datos propia | OK | SQLite con 3 tablas |
| Rate limiting en login | OK | 10 intentos/minuto |
| Blacklist de tokens | OK | Tabla revoked_tokens |
| POST /auth/register | OK | Implementado |
| POST /auth/login | OK | Implementado con rate limit |
| POST /auth/logout | OK | Revoca access y refresh |
| POST /auth/refresh | OK | Rotacion de refresh tokens |
| GET /auth/me | OK | Retorna info del usuario |
| POST /auth/validate | OK | Endpoint interno |
