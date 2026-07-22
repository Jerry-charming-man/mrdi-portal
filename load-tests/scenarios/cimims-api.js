/**
 * CIM-IMS API Load Test (S4-5)
 * 端点：http://localhost:3002
 * 场景：事件管理（list + dashboard + 创建 + 状态变更）
 *
 * 执行：k6 run --out json=results/cimims-api.json load-tests/scenarios/cimims-api.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { getDevToken, defaultHeaders, randomStr } from '../lib/auth.js';

const BASE = 'http://localhost:3002';

export const options = {
  stages: [
    { duration: '20s', target: 15 },
    { duration: '60s', target: 30 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    'http_req_duration{endpoint:list}':     ['p(95)<400', 'p(99)<700'],
    'http_req_duration{endpoint:dashboard}': ['p(95)<500', 'p(99)<900'],
    'http_req_duration{endpoint:detail}':   ['p(95)<200', 'p(99)<400'],
    'http_req_duration{endpoint:create}':   ['p(95)<600', 'p(99)<1000'],
    'http_req_duration{endpoint:takeover}': ['p(95)<500', 'p(99)<900'],
    'http_req_failed':                      ['rate<0.02'],
  },
};

export function setup() {
  return { token: getDevToken(BASE) };
}

export default function (data) {
  const headers = defaultHeaders(data.token);
  const params = { headers, tags: { endpoint: '' } };

  // 1. List incidents
  params.tags.endpoint = 'list';
  let res = http.get(`${BASE}/v1/incidents?page=1&pageSize=20`, params);
  check(res, { 'list 200': r => r.status === 200 });

  // 2. Dashboard
  params.tags.endpoint = 'dashboard';
  res = http.get(`${BASE}/v1/dashboard/duty`, params);
  check(res, { 'duty dashboard 200': r => r.status === 200 });

  sleep(0.3);

  // 3. Create new incident (write)
  params.tags.endpoint = 'create';
  const newBody = JSON.stringify({
    title: `LoadTest Incident ${randomStr(8)}`,
    description: 'k6 load test incident - 至少10字符',
    type: 'other',
    urgency: 'P3',
    impactScope: 'user',
  });
  res = http.post(`${BASE}/v1/incidents`, newBody, params);
  const createOk = check(res, { 'create 201': r => r.status === 201 });
  if (createOk && res.json('id')) {
    const newId = res.json('id');
    sleep(0.3);
    // 4. Take over
    params.tags.endpoint = 'takeover';
    res = http.post(`${BASE}/v1/incidents/${newId}/take-over`,
      JSON.stringify({ handlerType: 'duty', comment: 'k6 test takeover' }), params);
    check(res, { 'takeover 200': r => r.status === 200 });
  }

  sleep(0.5);
}
