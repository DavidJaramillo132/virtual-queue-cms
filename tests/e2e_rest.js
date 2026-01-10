const { spawn } = require('child_process');
const path = require('path');

async function delay(ms){ return new Promise(r => setTimeout(r, ms)); }

async function run(){
  const root = path.resolve(__dirname, '..');

  console.log('Starting token-service...');
  const tokenProc = spawn(process.execPath, [path.join(root, 'microservicios', 'Token', 'index.js')], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, JWT_SECRET: 'clave123' } });
  tokenProc.stdout.on('data', d => process.stdout.write('[token] ' + d.toString()));
  tokenProc.stderr.on('data', d => process.stderr.write('[token-err] ' + d.toString()));

  console.log('Starting rest-typescript (npm run dev)...');
  const restProc = spawn('npm', ['run', 'dev'], { cwd: path.join(root, 'backend', 'services', 'rest-typescript'), shell: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TOKEN_SERVICE_URL: 'http://localhost:4000', JWT_SECRET: 'clave123' } });
  restProc.stdout.on('data', d => process.stdout.write('[rest] ' + d.toString()));
  restProc.stderr.on('data', d => process.stderr.write('[rest-err] ' + d.toString()));

  // wait for both to start by listening to stdout messages
  console.log('Waiting for services to initialize...');
  await Promise.all([
    new Promise((resolve) => {
      tokenProc.stdout.on('data', d => {
        const s = d.toString();
        if (s.includes('Token service listening')) resolve(true);
      });
    }),
    new Promise((resolve) => {
      restProc.stdout.on('data', d => {
        const s = d.toString();
        if (s.includes('Servidor REST corriendo en puerto')) resolve(true);
      });
    })
  ]);

  try{
    const base = 'http://localhost:3000';
    const email = `e2e+${Date.now()}@example.test`;
    const password = 'Password123!';

    console.log('1) Register via REST');
    let res = await fetch(`${base}/api/usuarios`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ nombre_completo: 'E2E Test', email, password, rol: 'cliente', telefono: '123' }) });
    console.log('status', res.status);
    console.log(await res.json());

    console.log('2) Login via REST');
    res = await fetch(`${base}/api/usuarios/login`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
    console.log('status', res.status);
    const body = await res.json();
    console.log(body);
    const token = body.token;
    const refresh = body.refreshToken;

    console.log('3) Protected GET user by email');
    res = await fetch(`${base}/api/usuarios/${encodeURIComponent(email)}`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
    console.log('status', res.status);
    console.log(await res.json());

    console.log('4) Refresh via REST');
    res = await fetch(`${base}/api/usuarios/refresh`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ refreshToken: refresh }) });
    console.log('status', res.status);
    const refreshBody = await res.json();
    console.log(refreshBody);

    console.log('5) Logout via REST');
    res = await fetch(`${base}/api/usuarios/logout`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ refreshToken: refreshBody.refreshToken, accessToken: refreshBody.accessToken || token }) });
    console.log('status', res.status);
    console.log(await res.json());

    console.log('6) GET after logout (should be 401)');
    res = await fetch(`${base}/api/usuarios/${encodeURIComponent(email)}`, { method: 'GET', headers: { 'Authorization': `Bearer ${refreshBody.accessToken || token}` } });
    console.log('status', res.status);
    console.log(await res.json());

  } catch(err){
    console.error('E2E test error', err);
  } finally {
    console.log('Stopping services...');
    tokenProc.kill();
    restProc.kill();
  }
}

run();
