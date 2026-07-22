/**
 * T7 Profile flow E2E test
 * Sprint 3 · T7c/T7d
 * Sprint 3 · T7c/T7d
 *
 * Flow: admin reset → login (must_change_password=true) → /profile → change-password → JWT
 */
const http = require('http');

const BASE = 'http://localhost:3000';
const ADMIN_KEY = 'mrdi-dev-admin-key-2026';
let passed = 0, failed = 0, results = [];

function pass(n) { passed++; results.push({ n, status: 'PASS' }); console.log(`  ✅ ${n}`); }
function fail(n, d) { failed++; results.push({ n, status: 'FAIL', detail: d }); console.log(`  ❌ ${n}: ${d}`); }

function get(path, token) {
  return new Promise(r => {
    const h = {};
    if (token) h['Authorization'] = `Bearer ${token}`;
    const req = http.request({ hostname: 'localhost', port: 3000, path, method: 'GET', headers: h }, res => {
      let s = ''; res.on('data', c => s += c); res.on('end', () => {
        try { r({ status: res.statusCode, body: JSON.parse(s) }); }
        catch { r({ status: res.statusCode, body: s }); }
      });
    }); req.end();
  });
}

function post(path, body, token) {
  return new Promise(r => {
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    const b = JSON.stringify(body);
    h['Content-Length'] = Buffer.byteLength(b);
    const req = http.request({ hostname: 'localhost', port: 3000, path, method: 'POST', headers: h }, res => {
      let s = ''; res.on('data', c => s += c); res.on('end', () => {
        try { r({ status: res.statusCode, body: JSON.parse(s) }); }
        catch { r({ status: res.statusCode, body: s }); }
      });
    }); req.write(b); req.end();
  });
}

async function run() {
  console.log('═'.repeat(60));
  console.log('  Profile Flow E2E — Sprint 3 T7c/T7d');
  console.log('═'.repeat(60));

  // Setup: admin resets password for changepwd@test.com
  const adminR = await get(`/auth/v1/dev/login?email=admin@t7.com&role=admin&admin_key=${ADMIN_KEY}`);
  const adminToken = adminR.body.token;
  if (!adminToken) { fail('Admin login', 'no token'); process.exit(1); }
  pass('Admin dev_login → token');

  const resetR = await post('/auth/v1/admin/reset-password', {
    targetEmail: 'changepwd@test.com', newPassword: 'TempPass999!!'
  }, adminToken);
  if (resetR.status !== 200) { fail('Admin reset-password', `got ${resetR.status}`); }
  else { pass('Admin reset-password → 200'); }
  await new Promise(r => setTimeout(r, 300));

  // T7c-A: login with admin-reset password → must_change_password=true + token=null
  const loginR = await post('/auth/v1/login', { email: 'changepwd@test.com', password: 'TempPass999!!' });
  if (loginR.status === 200 && loginR.body.requirePasswordChange === true && loginR.body.token === null) {
    pass('T7c-A: admin-reset login → 200 requirePasswordChange=true token=null');
  } else {
    fail('T7c-A', `got ${loginR.status} requirePasswordChange=${loginR.body.requirePasswordChange} token=${loginR.body.token}`);
  }

  // Get dev_login token to use for change-password call
  const devR = await get(`/auth/v1/dev/login?email=changepwd@test.com&role=editor&admin_key=${ADMIN_KEY}`);
  const devToken = devR.body.token;
  if (!devToken) { fail('Dev login for change-password', 'no token'); }
  else { pass('Dev_login bypass → token for change-password'); }

  // T7c-B: wrong old password → 401
  const r1 = await post('/auth/v1/change-password', {
    oldPassword: 'wrong', newPassword: 'NewPassw1!Aab'
  }, devToken);
  if (r1.status === 401) pass('T7c-B: wrong old password → 401');
  else fail('T7c-B: wrong old password', `got ${r1.status}`);

  // T7c-C: valid change-password → 200 + new token
  const r2 = await post('/auth/v1/change-password', {
    oldPassword: 'TempPass999!!', newPassword: 'NewPassw1!Aab'
  }, devToken);
  if (r2.status === 200 && r2.body.token) {
    pass('T7c-C: valid change-password → 200 + new JWT');
    // T7c-D: new JWT works for normal login
    await new Promise(r => setTimeout(r, 200));
    const loginAfter = await post('/auth/v1/login', { email: 'changepwd@test.com', password: 'NewPassw1!Aab' });
    if (loginAfter.status === 200 && loginAfter.body.token) {
      pass('T7c-D: new password login → 200 + JWT (must_change_password cleared)');
    } else {
      fail('T7c-D', `got ${loginAfter.status}`);
    }
  } else {
    fail('T7c-C: valid change-password', `got ${r2.status} token=${r2.body.token ? 'yes' : 'no'}`);
  }

  // T7d: portal /profile route accessible (fetch via Node.js http)
  await new Promise(r => {
    http.get('http://localhost:8089/profile', res => {
      if (res.statusCode === 200) pass('T7d: portal /profile → 200');
      else fail('T7d: portal /profile', `got ${res.statusCode}`);
      r();
    }).on('error', e => { fail('T7d: portal /profile', e.message); r(); });
  });

  console.log('\n' + '═'.repeat(60));
  console.log(`  RESULTS: ${passed} PASS / ${failed} FAIL`);
  console.log('═'.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
