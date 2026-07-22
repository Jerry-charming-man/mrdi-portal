import http from 'k6/http';
import { check, group } from 'k6';

const BASE_URL = __ENV.CIMRMS_API_URL || 'http://localhost:3001';

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

let cachedToken = null;

function getToken() {
  if (cachedToken) return cachedToken;
  const payload = JSON.stringify({
    email: 'k6-user-' + __VU + '@test.mrdi',
    role: 'editor',
    name: 'K6 User ' + __VU,
    department: 'CIM',
  });
  const res = http.post(BASE_URL + '/v1/auth/dev/login', payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, { 'dev-login 200': (r) => r.status === 200 });
  cachedToken = JSON.parse(res.body).token;
  return cachedToken;
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + getToken(),
  };
}

export default function () {
  group('S1 - List Requests', function () {
    const res = http.get(BASE_URL + '/v1/requests?page=1&pageSize=20', {
      headers: authHeaders(),
    });
    check(res, {
      'list 200': (r) => r.status === 200,
      'has items': (r) => Array.isArray(JSON.parse(r.body).items),
    });
  });

  group('S2 - Create Request', function () {
    const payload = JSON.stringify({
      title: 'K6 Load Test ' + Date.now(),
      type: 'feature',
      urgency: 'P3',
      description: 'This is a load test request created by k6. The description meets minimum length requirements.',
      attachmentIds: [],
    });
    const res = http.post(BASE_URL + '/v1/requests', payload, {
      headers: authHeaders(),
    });
    check(res, {
      'create ok': (r) => r.status === 201 || r.status === 400,
    });
  });

  group('S3 - List Mine', function () {
    const res = http.get(BASE_URL + '/v1/requests?view=mine&page=1&pageSize=10', {
      headers: authHeaders(),
    });
    check(res, { 'list mine 200': (r) => r.status === 200 });
  });
}

export function handleSummary(data) {
  const d = data.metrics;
  const dur = d.http_req_duration;
  const fail = d.http_req_failed;
  const total = d.http_reqs ? d.http_reqs.values.count : 0;
  const failRate = fail && fail.values ? (fail.values.rate * 100).toFixed(2) : '0.00';

  let out = '\n';
  out += '============================================================\n';
  out += '  k6 Load Test Results -- cimrms-api\n';
  out += '============================================================\n\n';
  out += '  Total requests : ' + total + '\n';
  out += '  Failed rate    : ' + failRate + '%\n\n';
  out += '  Response Times (http_req_duration):\n';

  const dv = dur.values || {};
  out += '    avg : ' + (dv.avg ? dv.avg.toFixed(2) : '0.00') + ' ms\n';
  out += '    p50 : ' + (dv['p(50)'] ? dv['p(50)'].toFixed(2) : '0.00') + ' ms\n';
  out += '    p95 : ' + (dv['p(95)'] ? dv['p(95)'].toFixed(2) : '0.00') + ' ms\n';
  out += '    p99 : ' + (dv['p(99)'] ? dv['p(99)'].toFixed(2) : '0.00') + ' ms\n';
  out += '    max : ' + (dv.max ? dv.max.toFixed(2) : '0.00') + ' ms\n\n';
  out += '============================================================\n';
  return { stdout: out };
}
