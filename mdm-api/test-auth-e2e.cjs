/**
 * mdm-api Auth E2E Integration Tests
 * Sprint 3 · TEST_REPORT_v4
 * 覆盖：T2/T3/T5/T6/T8 全部 endpoints
 *
 * 运行：node test-auth-e2e.cjs
 * 依赖：测试用户在 DB 中存在（changepwd@test.com / TestPass123!）
 */
const http = require('http');

const BASE = 'http://localhost:3000';
const ADMIN_KEY = 'mrdi-dev-admin-key-2026';
let passed = 0;
let failed = 0;
let results = [];

function pass(name) {
  passed++;
  results.push({ name, status: 'PASS' });
  console.log(`  ✅ ${name}`);
}

function fail(name, detail) {
  failed++;
  results.push({ name, status: 'FAIL', detail });
  console.log(`  ❌ ${name}: ${detail}`);
}

function httpGet(path, token) {
  return new Promise((resolve) => {
    const h = {};
    if (token) h['Authorization'] = `Bearer ${token}`;
    const req = http.request({ hostname: 'localhost', port: 3000, path, method: 'GET', headers: h }, (res) => {
      let s = '';
      res.on('data', c => s += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(s) }); }
        catch { resolve({ status: res.statusCode, body: s }); }
      });
    });
    req.end();
  });
}

function httpPost(path, body, token) {
  return new Promise((resolve) => {
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    const b = JSON.stringify(body);
    h['Content-Length'] = Buffer.byteLength(b);
    const req = http.request({ hostname: 'localhost', port: 3000, path, method: 'POST', headers: h }, (res) => {
      let s = '';
      res.on('data', c => s += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(s) }); }
        catch { resolve({ status: res.statusCode, body: s }); }
      });
    });
    req.write(b);
    req.end();
  });
}

async function suite(name, fn) {
  console.log(`\n[${name}]`);
  await fn();
}

async function run() {
  console.log('═'.repeat(60));
  console.log('  mdm-api Auth E2E — Sprint 3 · TEST_REPORT_v4');
  console.log('═'.repeat(60));

  // ── T2: ADMIN_KEY Middleware ───────────────────────────────────────────
  await suite('T2 — ADMIN_KEY Middleware', async () => {
    // dev_login without admin_key → 403
    const r1 = await httpGet('/auth/v1/dev/login?email=test@t2.com&role=admin');
    if (r1.status === 403 && (r1.body.message === 'EMERGENCY_ACCESS_DISABLED' || r1.body.error?.message === 'EMERGENCY_ACCESS_DISABLED')) {
      pass('dev_login without admin_key → 403');
    } else {
      fail('dev_login without admin_key → 403', `got ${r1.status} ${JSON.stringify(r1.body)}`);
    }

    // dev_login with wrong admin_key → 403
    const r2 = await httpGet('/auth/v1/dev/login?email=test@t2.com&role=admin&admin_key=wrong');
    if (r2.status === 403) {
      pass('dev_login with wrong admin_key → 403');
    } else {
      fail('dev_login with wrong admin_key → 403', `got ${r2.status}`);
    }

    // dev_login with correct admin_key → 200
    const r3 = await httpGet(`/auth/v1/dev/login?email=test@t2.com&role=admin&admin_key=${ADMIN_KEY}`);
    if (r3.status === 200 && r3.body.token) {
      pass('dev_login with correct admin_key → 200 + JWT');
    } else {
      fail('dev_login with correct admin_key → 200', `got ${r3.status}`);
    }
  });

  // ── T3: M365 OAuth Mock ───────────────────────────────────────────────
  await suite('T3 — M365 OAuth Mock', async () => {
    // mock-users list
    const r1 = await httpGet('/auth/v1/m365/mock-users');
    if (r1.status === 200 && Array.isArray(r1.body.users) && r1.body.users.length === 3) {
      pass('GET /m365/mock-users → 3 users');
    } else {
      fail('GET /m365/mock-users', `got ${r1.status}`);
    }

    // authorize (default → admin)
    const r2 = await httpGet('/auth/v1/m365/authorize');
    if (r2.status === 200 && r2.body.code) {
      pass('authorize generates code');
    } else {
      fail('authorize generates code', `got ${r2.status}`);
    }

    // callback with valid code
    const r3 = await httpGet('/auth/v1/m365/authorize');
    const callbackR = await httpPost('/auth/v1/m365/callback', { code: r3.body.code });
    if (callbackR.status === 200 && callbackR.body.token && callbackR.body.user) {
      pass('callback with valid code → JWT');
    } else {
      fail('callback with valid code → JWT', `got ${callbackR.status}`);
    }

    // callback with invalid code
    const r5 = await httpPost('/auth/v1/m365/callback', { code: 'invalid-code' });
    if (r5.status === 400) {
      pass('callback with invalid code → 400');
    } else {
      fail('callback with invalid code → 400', `got ${r5.status}`);
    }

    // M365_MOCK_ENABLED = false (if env set) → 404
    // Skipped: depends on env configuration
  });

  // ── T5: Password Login + LoginAudit ───────────────────────────────────
  await suite('T5 — Password Login + LoginAudit', async () => {
    // Setup: Get admin token + use dev_login (bypasses must_change_password) to set known password
    // dev_login does NOT update password_hash, so we first set password via admin reset,
    // then use dev_login token to change-password (which clears must_change_password=false)
    const adminR = await httpGet(`/auth/v1/dev/login?email=admin@t5.com&role=admin&admin_key=${ADMIN_KEY}`);
    const adminToken = adminR.body.token;

    // admin reset → sets password + must_change_password=true
    // This gives us a known password we can use with dev_login token for change-password
    await httpPost('/auth/v1/admin/reset-password', {
      targetEmail: 'changepwd@test.com', newPassword: 'T5ResetPass99!'
    }, adminToken);
    await new Promise(r => setTimeout(r, 200));

    // dev_login gives a token (bypasses must_change_password check)
    // Use it to call change-password: old=admin-reset-pw, new=known-pw
    // This clears must_change_password=false AND sets password to known value
    const devLoginR = await httpGet(`/auth/v1/dev/login?email=changepwd@test.com&role=editor&admin_key=${ADMIN_KEY}`);
    if (devLoginR.body.token) {
      await httpPost('/auth/v1/change-password',
        { oldPassword: 'T5ResetPass99!', newPassword: 'T5KnownPass99!' },
        devLoginR.body.token
      );
      await new Promise(r => setTimeout(r, 200));
    }

    // T5-A: Wrong password → 401
    const r1 = await httpPost('/auth/v1/login', { email: 'changepwd@test.com', password: 'wrong' });
    if (r1.status === 401) {
      pass('T5-A: wrong password → 401 AUTH_FAILED');
    } else {
      fail('T5-A: wrong password → 401', `got ${r1.status}`);
    }

    // T5-B: After admin reset → must_change_password=true → 200 + requirePasswordChange=true + token=null
    await httpPost('/auth/v1/admin/reset-password', {
      targetEmail: 'changepwd@test.com', newPassword: 'T5AfterReset99!'
    }, adminToken);
    await new Promise(r => setTimeout(r, 200));
    const r3 = await httpPost('/auth/v1/login', { email: 'changepwd@test.com', password: 'T5AfterReset99!' });
    if (r3.status === 200 && r3.body.requirePasswordChange === true && r3.body.token === null) {
      pass('T5-B: after admin reset → requirePasswordChange=true + token=null');
    } else {
      fail('T5-B: must_change_password check', `got ${r3.status} requirePasswordChange=${r3.body.requirePasswordChange}`);
    }

    // T5-C: Correct password (normal login) → 200 + JWT
    // First clear must_change_password via dev_login token + change-password
    const devR2 = await httpGet(`/auth/v1/dev/login?email=changepwd@test.com&role=editor&admin_key=${ADMIN_KEY}`);
    if (devR2.body.token) {
      // old = admin-reset password, new = normal login password
      await httpPost('/auth/v1/change-password',
        { oldPassword: 'T5AfterReset99!', newPassword: 'T5KnownPass99!' },
        devR2.body.token
      );
      await new Promise(r => setTimeout(r, 200));
    }
    const r2 = await httpPost('/auth/v1/login', { email: 'changepwd@test.com', password: 'T5KnownPass99!' });
    if (r2.status === 200 && r2.body.token) {
      pass('T5-C: correct password → 200 + JWT');
    } else {
      fail('T5-C: correct password → 200', `got ${r2.status} requirePasswordChange=${r2.body.requirePasswordChange}`);
    }

    // T5-D: User not found → 401 (no user enumeration leak)
    const r4 = await httpPost('/auth/v1/login', { email: 'nobody@test.com', password: 'any' });
    if (r4.status === 401) {
      pass('T5-D: nonexistent user → 401 (no enumeration leak)');
    } else {
      fail('T5-D: nonexistent user → 401', `got ${r4.status}`);
    }
  });

  // ── T6: Change Password ────────────────────────────────────────────────
  await suite('T6 — Change Password', async () => {
    const adminR2 = await httpGet(`/auth/v1/dev/login?email=admin@t6.com&role=admin&admin_key=${ADMIN_KEY}`);
    const adminToken = adminR2.body.token;
    if (!adminToken) { fail('T6: get admin token', 'no token'); return; }

    // admin reset → sets password + must_change_password=true
    // Use dev_login token (bypasses must_change_password) for change-password calls
    await httpPost('/auth/v1/admin/reset-password', {
      targetEmail: 'changepwd@test.com', newPassword: 'T6CurrentPass99!'
    }, adminToken);
    await new Promise(r => setTimeout(r, 200));

    const devR = await httpGet(`/auth/v1/dev/login?email=changepwd@test.com&role=editor&admin_key=${ADMIN_KEY}`);
    const token = devR.body.token;
    if (!token) { fail('T6: get token via dev_login', 'no token'); return; }

    // T6-A: Wrong old password → 401
    const r1 = await httpPost('/auth/v1/change-password', { oldPassword: 'wrong', newPassword: 'NewPw456!1@ab' }, token);
    if (r1.status === 401) pass('T6-A: wrong old password → 401');
    else fail('T6-A: wrong old password → 401', `got ${r1.status}`);

    // T6-B: New password same as old → 400
    const r2 = await httpPost('/auth/v1/change-password', { oldPassword: 'T6CurrentPass99!', newPassword: 'T6CurrentPass99!' }, token);
    if (r2.status === 400 && r2.body.error?.code === 'BAD_REQUEST') pass('T6-B: same as old password → 400');
    else fail('T6-B: same as old password → 400', `got ${r2.status}`);

    // T6-C: Password too short → 400
    const r3 = await httpPost('/auth/v1/change-password', { oldPassword: 'T6CurrentPass99!', newPassword: 'Short1!' }, token);
    if (r3.status === 400 && r3.body.error?.message?.includes('12')) pass('T6-C: too short → 400');
    else fail('T6-C: too short → 400', `got ${r3.status} ${JSON.stringify(r3.body)}`);

    // T6-D: No uppercase → 400
    const r4 = await httpPost('/auth/v1/change-password', { oldPassword: 'T6CurrentPass99!', newPassword: 'newpass123!1a' }, token);
    if (r4.status === 400 && r4.body.error?.message?.includes('大写')) pass('T6-D: no uppercase → 400');
    else fail('T6-D: no uppercase → 400', `got ${r4.status}`);

    // T6-E: No special char → 400
    const r5 = await httpPost('/auth/v1/change-password', { oldPassword: 'T6CurrentPass99!', newPassword: 'NewPass123Aa' }, token);
    if (r5.status === 400 && r5.body.error?.message?.includes('特殊')) pass('T6-E: no special char → 400');
    else fail('T6-E: no special char → 400', `got ${r5.status}`);

    // T6-F: Valid change → 200
    const r6 = await httpPost('/auth/v1/change-password', { oldPassword: 'T6CurrentPass99!', newPassword: 'FinalPass999!@' }, token);
    if (r6.status === 200) pass('T6-F: valid change-password → 200');
    else fail('T6-F: valid change-password → 200', `got ${r6.status}`);
  });

  // ── T8: Admin Unlock + Reset ──────────────────────────────────────────
  await suite('T8 — Admin Unlock + Reset', async () => {
    // Get admin token
    const adminR = await httpGet(`/auth/v1/dev/login?email=admin@t8.com&role=admin&admin_key=${ADMIN_KEY}`);
    const adminToken = adminR.body.token;
    if (!adminR.body.token) { fail('get admin token', 'no token'); return; }

    // Unlock as non-admin → 403
    const edR = await httpGet(`/auth/v1/dev/login?email=editor@t8.com&role=editor&admin_key=${ADMIN_KEY}`);
    const edToken = edR.body.token;
    const r1 = await httpPost('/auth/v1/unlock/changepwd@test.com', {}, edToken);
    if (r1.status === 403) pass('unlock as non-admin → 403');
    else fail('unlock as non-admin → 403', `got ${r1.status}`);

    // Unlock nonexistent user → 404
    const r2 = await httpPost('/auth/v1/unlock/nobody@test.com', {}, adminToken);
    if (r2.status === 404) pass('unlock nonexistent user → 404');
    else fail('unlock nonexistent user → 404', `got ${r2.status}`);

    // Unlock non-locked user → 400
    const r3 = await httpPost('/auth/v1/unlock/changepwd@test.com', {}, adminToken);
    if (r3.status === 400) pass('unlock non-locked user → 400');
    else fail('unlock non-locked user → 400', `got ${r3.status}`);

    // Admin reset password → 200 + must_change_password=true
    const r4 = await httpPost('/auth/v1/admin/reset-password', {
      targetEmail: 'changepwd@test.com',
      newPassword: 'ResetPass999!@'
    }, adminToken);
    if (r4.status === 200) pass('admin reset-password → 200');
    else fail('admin reset-password → 200', `got ${r4.status} ${JSON.stringify(r4.body)}`);

    // Admin reset self → 400
    const r5 = await httpPost('/auth/v1/admin/reset-password', {
      targetEmail: 'admin@t8.com',
      newPassword: 'ResetPass999!@'
    }, adminToken);
    if (r5.status === 400) pass('admin reset self → 400 (protected)');
    else fail('admin reset self → 400', `got ${r5.status}`);
  });

  // ── Summary ──────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log(`  RESULTS: ${passed} PASS / ${failed} FAIL`);
  console.log('═'.repeat(60));

  if (failed === 0) {
    console.log('  🎉 All tests passed!');
  } else {
    console.log(`  ⚠️  ${failed} test(s) failed`);
  }

  // Save JSON report
  const report = { timestamp: new Date().toISOString(), passed, failed, results };
  require('fs').writeFileSync(
    require('path').join(__dirname, 'test-auth-report.json'),
    JSON.stringify(report, null, 2)
  );
  console.log(`\n  Report saved: test-auth-report.json`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
