import http from 'k6/http';
import { check, group } from 'k6';

const BASE_URL = __ENV.CIMPERM_API_URL || 'http://localhost:3003';

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

function devHeaders() {
  return { 'Content-Type': 'application/json' };
}

// Build URL: if path has existing query string, use &; else use ?
function devUrl(path) {
  const sep = path.includes('?') ? '&' : '?';
  return BASE_URL + path + sep + 'dev_login=true&dev_email=k6-perm-' + __VU + '@test.mrdi';
}

export default function () {
  // Note: pass BASE PATH only; devUrl appends the dev bypass query params
  group('S1 - List Permission Requests', function () {
    const res = http.get(devUrl('/perm-api/v1/requests?page=1&pageSize=20'), {
      headers: devHeaders(),
    });
    check(res, {
      'list 200': (r) => r.status === 200,
      'has data': (r) => {
        try { return Array.isArray(JSON.parse(r.body).data); }
        catch { return false; }
      },
    });
  });

  group('S2 - Create Permission Request', function () {
    const payload = JSON.stringify({
      target_system: 'MES',
      permission_type: 'functional',
      permission_level: 'read',
      resource_id: 'k6-resource-' + Date.now(),
      reason: 'K6 load test permission request. This is a comprehensive reason that meets minimum length requirements for validation.',
      requested_duration: 'P1D',
      urgency: 'normal',
      attachment_ids: [],
    });
    const res = http.post(devUrl('/perm-api/v1/requests'), payload, {
      headers: devHeaders(),
    });
    check(res, { 'create 201': (r) => r.status === 201 });
  });

  group('S3 - List Mine', function () {
    const res = http.get(devUrl('/perm-api/v1/requests?view=mine&page=1&pageSize=10'), {
      headers: devHeaders(),
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
  const dv = dur.values || {};

  let out = '\n';
  out += '============================================================\n';
  out += '  k6 Load Test Results -- cim-perm-api\n';
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
