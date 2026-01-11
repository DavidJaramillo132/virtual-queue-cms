const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
// Por seguridad, usar tiempos cortos para access tokens (15-30 minutos recomendado)
const ACCESS_EXPIRES = process.env.ACCESS_EXPIRES || '30m';
const REFRESH_EXPIRES_DAYS = parseInt(process.env.REFRESH_EXPIRES_DAYS || '30', 10);
// Intervalo de limpieza de tokens expirados (por defecto cada hora)
const CLEANUP_INTERVAL_MS = parseInt(process.env.CLEANUP_INTERVAL_MS || '3600000', 10);

let db;

// Usar carpeta data para persistir en Docker, o directorio actual en desarrollo
const DB_PATH = process.env.DB_PATH || './token.db';

async function initDb() {
  db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      revoked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS revoked_tokens (
      id TEXT PRIMARY KEY,
      jti TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function generateAccessToken(payload) {
  // incluir jti para un posible seguimiento de revocación
  const jti = uuidv4();
  const token = jwt.sign({ ...payload, jti }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
  return { token, jti };
}

function generateRefreshToken() {
  return uuidv4() + '.' + uuidv4();
}

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10,
  message: { message: 'Too many login attempts, please try again later' }
});

// Helper: get user
async function getUserByEmail(email) {
  return db.get('SELECT * FROM users WHERE email = ?', email);
}

async function getUserById(id) {
  return db.get('SELECT * FROM users WHERE id = ?', id);
}

// Limpieza periodica de tokens expirados
async function cleanupExpiredTokens() {
  try {
    const now = new Date().toISOString();
    
    // Eliminar refresh tokens expirados o revocados hace mas de 7 dias
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const deletedRefresh = await db.run(
      'DELETE FROM refresh_tokens WHERE expires_at < ? OR (revoked = 1 AND created_at < ?)',
      now, sevenDaysAgo
    );
    
    // Eliminar registros de tokens revocados con mas de 30 dias (ya no son validos de todos modos)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const deletedRevoked = await db.run(
      'DELETE FROM revoked_tokens WHERE created_at < ?',
      thirtyDaysAgo
    );
    
    console.log(`[Cleanup] Eliminados: ${deletedRefresh.changes || 0} refresh tokens, ${deletedRevoked.changes || 0} revoked tokens`);
  } catch (err) {
    console.error('[Cleanup] Error limpiando tokens expirados:', err);
  }
}

// Iniciar job de limpieza periodica
function startCleanupJob() {
  console.log(`[Cleanup] Job iniciado, intervalo: ${CLEANUP_INTERVAL_MS}ms`);
  // Ejecutar limpieza inicial despues de 1 minuto
  setTimeout(() => {
    cleanupExpiredTokens();
    // Luego ejecutar periodicamente
    setInterval(cleanupExpiredTokens, CLEANUP_INTERVAL_MS);
  }, 60000);
}

// Endpoints

app.post('/auth/register', async (req, res) => {
  try {
    // Acepta ID opcional para sincronizar con la BD principal
    const { email, password, id: externalId } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email y password requeridos' });
    const existing = await getUserByEmail(email);
    if (existing) return res.status(409).json({ message: 'Usuario ya existe' });

    const hash = await bcrypt.hash(password, 10);
    // Usar el ID externo si se proporciona, sino generar uno nuevo
    const id = externalId || uuidv4();
    await db.run('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)', id, email, hash);
    return res.status(201).json({ id, email });
  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ message: 'error servidor' });
  }
});

app.post('/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email y password requeridos' });
    const user = await getUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

    const { token: accessToken, jti } = generateAccessToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const rtId = uuidv4();
    await db.run('INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)', rtId, user.id, refreshToken, expiresAt);

    return res.json({ accessToken, refreshToken, expiresIn: ACCESS_EXPIRES });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ message: 'error servidor' });
  }
});

app.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'refreshToken requerido' });
    const row = await db.get('SELECT * FROM refresh_tokens WHERE token = ? AND revoked = 0', refreshToken);
    if (!row) return res.status(401).json({ message: 'Refresh token inválido' });
    if (new Date(row.expires_at) < new Date()) return res.status(401).json({ message: 'Refresh token expirado' });

    const user = await getUserById(row.user_id);
    if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });

    // Rotar token de actualización: revocar el antiguo y crear uno nuevo
    await db.run('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?', row.id);
    const newRefresh = generateRefreshToken();
    const newId = uuidv4();
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await db.run('INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)', newId, user.id, newRefresh, expiresAt);

    const { token: accessToken } = generateAccessToken({ id: user.id, email: user.email });
    return res.json({ accessToken, refreshToken: newRefresh, expiresIn: ACCESS_EXPIRES });
  } catch (err) {
    console.error('refresh error', err);
    return res.status(500).json({ message: 'error servidor' });
  }
});

app.post('/auth/logout', async (req, res) => {
  try {
    const { refreshToken, accessToken } = req.body;
    if (refreshToken) {
      await db.run('UPDATE refresh_tokens SET revoked = 1 WHERE token = ?', refreshToken);
    }
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, JWT_SECRET);
        const jti = decoded.jti;
        if (jti) await db.run('INSERT INTO revoked_tokens (id, jti) VALUES (?, ?)', uuidv4(), jti);
      } catch (e) { /* ignore invalid access token */ }
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('logout error', err);
    return res.status(500).json({ message: 'error servidor' });
  }
});

app.get('/auth/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: 'sin token' });
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const jti = decoded.jti;
    // check revoked access tokens
    const revoked = await db.get('SELECT * FROM revoked_tokens WHERE jti = ?', jti);
    if (revoked) return res.status(401).json({ message: 'token revocado' });
    const user = await getUserById(decoded.id);
    if (!user) return res.status(404).json({ message: 'usuario no encontrado' });
    return res.json({ id: user.id, email: user.email });
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: 'token expirado' });
    return res.status(401).json({ message: 'token inválido' });
  }
});

// Internal validate endpoint: verifica la firma y comprueba la lista de revocación del token de acceso
app.post('/auth/validate', async (req, res) => {
  try {
    const token = req.body.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(400).json({ message: 'token requerido' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const jti = decoded.jti;
    const revoked = await db.get('SELECT * FROM revoked_tokens WHERE jti = ?', jti);
    if (revoked) return res.status(401).json({ message: 'token revocado' });
    return res.json({ valid: true, decoded });
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: 'token expirado' });
    return res.status(401).json({ message: 'token inválido' });
  }
});

app.get('/', (req, res) => res.json({ service: 'token-service' }));

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Token service listening on port ${PORT}`);
    console.log(`ACCESS_EXPIRES: ${ACCESS_EXPIRES}, REFRESH_EXPIRES_DAYS: ${REFRESH_EXPIRES_DAYS}`);
    // Iniciar job de limpieza de tokens expirados
    startCleanupJob();
  });
}).catch(err => {
  console.error('Failed to initialize DB', err);
  process.exit(1);
});
