import http from 'k6/http';
import { check, group } from 'k6';

const BASE_URL = __ENV.MDM_API_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '20s', target: 20 },
    { duration: '10s', target: 20 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.05'],
  },
};

// Per-VU token cache — avoids re-logging in every iteration
const vuTokens = {};

function getToken(vu, email) {
  if (vuTokens[vu]) return vuTokens[vu];
  const dlUrl = BASE_URL + '/auth/v1/dev/login?email=' + encodeURIComponent(email)
    + '&role=editor&name=' + encodeURIComponent('K6 MDM ' + vu)
    + '&department=' + encodeURIComponent('CIM')
    + '&admin_key=mrdi-dev-admin-key-2026';
  const r = http.get(dlUrl);
  check(r, { 'dev-login ok': (r) => r.status === 200 });
  const parsed = JSON.parse(r.body);
  if (parsed.token) vuTokens[vu] = parsed.token;
  return vuTokens[vu];
}

export default function () {
  const vu = String(__VU);
  const email = 'k6-mdm-' + vu + '@test.mrdi';
  const token = getToken(vu, email);
  if (!token) return;
  const hdrs = { 'Authorization': 'Bearer ' + token };

  group('S1 - List Users', function () {
    const res = http.get(BASE_URL + '/v1/users?page=1&pageSize=20', { headers: hdrs });
    check(res, { 'list 200': (r) => r.status === 200 });
  });

  group('S2 - Get User Profile', function () {
    const res = http.get(BASE_URL + '/v1/users/' + encodeURIComponent(email), { headers: hdrs });
    check(res, { 'get 200or404': (r) => r.status === 200 || r.status === 404 });
  });

  group('S3 - List Registered Systems', function () {
    const res = http.get(BASE_URL + '/v1/systems?page=1&pageSize=20', { headers: hdrs });
    check(res, { 'systems 200': (r) => r.status === 200 });
  });
}

export function handleSummary(data) {
  const d = data.metrics;
  const dur = d.http_req_duration;
  const fail = d.http_req_failed;
  const total = d.http_reqs ? d.http_reqs.values.count : 0;
  const failRate = fail && fail.values ? (fail.values.rate * 100).toFixed(2) : '0.00';
  const dv = dur.values || {};

  let out = '\n';
  out += '============================================================\n';
  out += '  k6 Load Test Results -- mdm-api\n';
  out += '============================================================\n\n';
  out += '  Total requests : ' + total + '\n';
  out += '  Failed rate    : ' + failRate + '%\n\n';
  out += '  Response Times (http_req_duration):\n';
  out += '    avg : ' + (dv.avg ? dv.avg.toFixed(2) : '0.00') + ' ms\n';
  out += '    p50 : ' + (dv['p(50)'] ? dv['p(50)'].toFixed(2) : '0.00') + ' ms\n';
  out += '    p95 : ' + (dv['p(95)'] ? dv['p(95)'].toFixed(2) : '0.00') + ' ms\n';
  out += '    p99 : ' + (dv['p(99)'] ? dv['p(99)'].toFixed(2) : '0.00') + ' ms\n';
  out += '    max : ' + (dv.max ? dv.max.toFixed(2) : '0.00') + ' ms\n\n';
  out += '============================================================\n';
  return { stdout: out };
}
