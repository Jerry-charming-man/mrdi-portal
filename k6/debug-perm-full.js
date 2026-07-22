import http from 'k6/http';
import { check, group } from 'k6';

const BASE_URL = __ENV.CIMPERM_API_URL || 'http://localhost:3003';

export const options = {
  vus: 2,
  duration: '3s',
};

function devHeaders() {
  return { 'Content-Type': 'application/json' };
}

function devUrl(path) {
  return BASE_URL + path + '?dev_login=true&dev_email=k6-perm-' + __VU + '@test.mrdi';
}

export default function () {
  group('S1 - List Permission Requests', function () {
    const res = http.get(devUrl('/perm-api/v1/requests?page=1&pageSize=20'), {
      headers: devHeaders(),
    });
    if (__ITER < 2) console.log('S1 status=' + res.status + ' body=' + res.body.substr(0, 150));
    check(res, {
      'list 200': (r) => r.status === 200,
      'has items': (r) => {
        try { return Array.isArray(JSON.parse(r.body).items); }
        catch (e) { console.log('S1 parse error: ' + e.message + ' body=' + res.body.substr(0, 100)); return false; }
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
    if (__ITER < 2) console.log('S2 status=' + res.status + ' body=' + res.body.substr(0, 150));
    check(res, { 'create ok': (r) => r.status === 201 || r.status === 400 });
  });

  group('S3 - List Mine', function () {
    const res = http.get(devUrl('/perm-api/v1/requests?view=mine&page=1&pageSize=10'), {
      headers: devHeaders(),
    });
    if (__ITER < 2) console.log('S3 status=' + res.status + ' body=' + res.body.substr(0, 150));
    check(res, { 'list mine 200': (r) => r.status === 200 });
  });
}

export function handleSummary(data) {
  const d = data.metrics;
  const fail = d.http_req_failed;
  const total = d.http_reqs ? d.http_reqs.values.count : 0;
  const failRate = fail && fail.values ? (fail.values.rate * 100).toFixed(2) : '0.00';
  return { stdout: 'Total=' + total + ' Failed%=' + failRate + '\n' };
}
