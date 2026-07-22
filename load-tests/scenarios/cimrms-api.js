/**
 * CIM-RMS API Load Test (S4-5)
 * 端点：http://localhost:3001
 * 场景：RMS 需求管理（list + detail + 创建 + 状态变更）
 *
 * 执行：k6 run --out json=results/cimrms-api.json load-tests/scenarios/cimrms-api.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { getDevToken, defaultHeaders, randomStr } from '../lib/auth.js';

const BASE = 'http://localhost:3001';

export const options = {
  stages: [
    { duration: '20s', target: 15 },
    { duration: '60s', target: 30 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    'http_req_duration{endpoint:list}':    ['p(95)<400', 'p(99)<700'],
    'http_req_duration{endpoint:detail}':  ['p(95)<200', 'p(99)<400'],
    'http_req_duration{endpoint:create}':  ['p(95)<600', 'p(99)<1000'],
    'http_req_duration{endpoint:transition}': ['p(95)<500', 'p(99)<900'],
    'http_req_failed':                      ['rate<0.02'],
  },
};

export function setup() {
  return { token: getDevToken(BASE) };
}

export default function (data) {
  const headers = defaultHeaders(data.token);
  const params = { headers, tags: { endpoint: '' } };

  // 1. List requests
  params.tags.endpoint = 'list';
  let res = http.get(`${BASE}/v1/requests?page=1&pageSize=20`, params);
  check(res, { 'list 200': r => r.status === 200 });

  // 2. Dashboard
  res = http.get(`${BASE}/v1/dashboard/me`, params);
  check(res, { 'dashboard 200': r => r.status === 200 });

  sleep(0.3);

  // 3. Get detail of first request (if exists)
  const listBody = res.json();
  const firstId = listBody?.items?.[0]?.id;
  if (firstId) {
    params.tags.endpoint = 'detail';
    res = http.get(`${BASE}/v1/requests/${firstId}`, params);
    check(res, { 'detail 200': r => r.status === 200 });
  }

  sleep(0.5);

  // 4. Create new request (write)
  params.tags.endpoint = 'create';
  const newBody = JSON.stringify({
    title: `LoadTest ${randomStr(6)}`,
    description: 'k6 load test request — 至少10字符',
    type: 'other',
    urgency: 'P3',
  });
  res = http.post(`${BASE}/v1/requests`, newBody, params);
  const createOk = check(res, { 'create 201': r => r.status === 201 });
  if (createOk && res.json('id')) {
    const newId = res.json('id');
    sleep(0.3);
    // 5. Approve the request (transition)
    params.tags.endpoint = 'transition';
    res = http.post(`${BASE}/v1/requests/${newId}/approve`,
      JSON.stringify({ comment: 'k6 load test approval' }), params);
    check(res, { 'approve 200': r => r.status === 200 });
  }

  sleep(0.5);
}
