import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.CIMPERM_API_URL || 'http://localhost:3003';

export const options = {
  vus: 1,
  duration: '5s',
};

export default function () {
  const vu = String(__VU);
  // Build URL step by step
  const base = BASE_URL;
  const path = '/perm-api/v1/requests';
  const qs = '?dev_login=true&dev_email=k6-perm-' + vu + '@test.mrdi';
  const fullUrl = base + path + qs;

  const res = http.get(fullUrl, {
    headers: { 'Content-Type': 'application/json' },
  });

  // Log first few iterations
  if (__ITER < 3) {
    console.log('VU=' + vu + ' ITER=' + __ITER + ' status=' + res.status + ' body=' + res.body.substr(0, 100));
  }

  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}

export function handleSummary(data) {
  const d = data.metrics;
  const fail = d.http_req_failed;
  const total = d.http_reqs ? d.http_reqs.values.count : 0;
  const failRate = fail && fail.values ? (fail.values.rate * 100).toFixed(2) : '0.00';
  return { stdout: 'Total=' + total + ' Failed%=' + failRate + '\n' };
}
