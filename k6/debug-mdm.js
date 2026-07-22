import http from 'k6/http';
import { check } from 'k6';

export const options = { vus: 5, duration: '3s' };

export default function () {
  const vu = String(__VU);
  const email = 'k6-mdm-' + vu + '@test.mrdi';
  const dlUrl = 'http://localhost:3000/auth/v1/dev/login?email=' + encodeURIComponent(email) + '&role=editor&name=K6+MDM&department=CIM&admin_key=mrdi-dev-admin-key-2026';

  const r0 = http.get(dlUrl);
  check(r0, {
    'dlg ok': (r) => r.status === 200,
    'has token': (r) => { const p = JSON.parse(r.body); return !!p.token; }
  });

  const parsed = JSON.parse(r0.body);
  if (!parsed.token) return;
  const hdrs = { 'Authorization': 'Bearer ' + parsed.token };

  const r1 = http.get('http://localhost:3000/v1/users?page=1&pageSize=5', { headers: hdrs });
  check(r1, { 'list ok': (r) => r.status === 200 });
}
