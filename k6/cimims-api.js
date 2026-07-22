import http from 'k6/http';
import { check, group } from 'k6';

const BASE_URL = __ENV.CIMIMS_API_URL || 'http://localhost:3002';

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

function getToken(vu) {
  if (vuTokens[vu]) return vuTokens[vu];
  const url = BASE_URL + '/v1/auth/dev/login?email=k6-ims-' + vu + '@test.mrdi&role=duty&name=K6+IMS+' + vu + '&department=IT&dev_login=true';
  const res = http.get(url);
  check(res, { 'dev-login ok': (r) => r.status === 200 });
  const parsed = JSON.parse(res.body);
  if (parsed.token) vuTokens[vu] = parsed.token;
  return vuTokens[vu];
}

export default function () {
  const vu = String(__VU);
  const token = getToken(vu);
  if (!token) return;
  const hdrs = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };

  group('S1 - List Incidents', function () {
    const res = http.get(BASE_URL + '/v1/incidents?page=1&pageSize=20', { headers: hdrs });
    check(res, {
      'list 200': (r) => r.status === 200,
      'has data': (r) => Array.isArray(JSON.parse(r.body).data),
    });
  });

  group('S2 - Create Incident', function () {
    const payload = JSON.stringify({
      title: 'K6 Load Test ' + Date.now(),
      description: 'This is a load test incident created by k6. The description meets minimum length requirements.',
      type: 'system',
      urgency: 'P3',
      impactScope: 'user',
      attachmentIds: [],
    });
    const res = http.post(BASE_URL + '/v1/incidents', payload, { headers: hdrs });
    check(res, { 'create ok': (r) => r.status === 201 || r.status === 400 });
  });

  group('S3 - List Mine', function () {
    const res = http.get(BASE_URL + '/v1/incidents?view=mine&page=1&pageSize=10', { headers: hdrs });
    check(res, { 'list mine 200': (r) => r.status === 200 });
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
  out += '  k6 Load Test Results -- cimims-api\n';
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
