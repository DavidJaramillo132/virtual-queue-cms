
Token microservicio (Auth)

Endpoints principales:
- POST /auth/register { email, password } -> { id, email }
- POST /auth/login { email, password } -> { accessToken, refreshToken, expiresIn }
- POST /auth/refresh { refreshToken } -> { accessToken, refreshToken, expiresIn }
- POST /auth/logout { refreshToken?, accessToken? } -> { success }
- GET /auth/me (Authorization: Bearer <accessToken>) -> { id, email }
- POST /auth/validate { token } -> { valid: true, decoded }

Notas:
- Usa SQLite local (archivo token.db) para: users, refresh_tokens, revoked_tokens.
- Access tokens incluyen un `jti` y duran por defecto 15 minutos. Refresh tokens son rotados y almacenados en DB (por defecto 30 días).
- Rate limiting aplicado en /auth/login (10 intentos por minuto).
- Configurar en .env: JWT_SECRET, ACCESS_EXPIRES (ej. '24h'), REFRESH_EXPIRES_DAYS (ej. '30').

Ejecutar:
- Prueba: microservicios\Token\ node smoke_test.js.
- Token: microservicios\Token\ node index.js o npm start.
