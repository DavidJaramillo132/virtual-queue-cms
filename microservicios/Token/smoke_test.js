const { spawn } = require('child_process');
const path = require('path');

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const base = 'http://localhost:4000';
  const email = `test+${Date.now()}@example.local`;
  const password = 'Password123!';

  console.log('Starting token server as child process...');
  const server = spawn(process.execPath, [path.join(__dirname, 'index.js')], { stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', d => process.stdout.write(d.toString()));
  server.stderr.on('data', d => process.stderr.write(d.toString()));

  // esperar a que el servidor se inicialice
  await delay(2000);

  try {
    console.log('1) Registering', email);
    let res = await fetch(base + '/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    console.log('register status', res.status);
    console.log(await res.json());

    console.log('\n2) Login');
    res = await fetch(base + '/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    console.log('login status', res.status);
    const loginBody = await res.json();
    console.log(loginBody);
    const access = loginBody.accessToken;
    const refresh = loginBody.refreshToken;

    console.log('\n3) Me (with access token)');
    res = await fetch(base + '/auth/me', { method: 'GET', headers: { 'Authorization': `Bearer ${access}` } });
    console.log('me status', res.status);
    console.log(await res.json());

    console.log('\n4) Refresh');
    res = await fetch(base + '/auth/refresh', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh })
    });
    console.log('refresh status', res.status);
    const refreshBody = await res.json();
    console.log(refreshBody);

    console.log('\n5) Logout (revoke new refresh & access)');
    res = await fetch(base + '/auth/logout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshBody.refreshToken, accessToken: refreshBody.accessToken || access })
    });
    console.log('logout status', res.status);
    console.log(await res.json());

    console.log('\n6) Me after logout (should be invalid)');
    res = await fetch(base + '/auth/me', { method: 'GET', headers: { 'Authorization': `Bearer ${refreshBody.accessToken || access}` } });
    console.log('me post-logout status', res.status);
    console.log(await res.json());

  } catch (err) {
    console.error('error in smoke test', err);
  } finally {
    console.log('Stopping child server...');
    server.kill();
  }
})();
