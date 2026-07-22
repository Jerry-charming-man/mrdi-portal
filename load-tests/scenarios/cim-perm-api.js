/**
 * CIM-PERM API Load Test (S4-5)
 * 端点：http://localhost:3003
 * 场景：权限申请管理（list + dashboard + 创建 + 审核）
 *
 * 执行：k6 run --out json=results/cim-perm-api.json load-tests/scenarios/cim-perm-api.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { getDevToken, defaultHeaders, randomStr } from '../lib/auth.js';

const BASE = 'http://localhost:3003';

export const options = {
  stages: [
    { duration: '20s', target: 15 },
    { duration: '60s', target: 30 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    'http_req_duration{endpoint:list}':      ['p(95)<400', 'p(99)<700'],
    'http_req_duration{endpoint:dashboard}': ['p(95)<500', 'p(99)<900'],
    'http_req_duration{endpoint:create}':    ['p(95)<600', 'p(99)<1000'],
    'http_req_duration{endpoint:review}':    ['p(95)<500', 'p(99)<900'],
    'http_req_failed':                       ['rate<0.02'],
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
  let res = http.get(`${BASE}/perm-api/v1/requests?page=1&pageSize=20`, params);
  check(res, { 'list 200': r => r.status === 200 });

  // 2. Dashboard
  params.tags.endpoint = 'dashboard';
  res = http.get(`${BASE}/perm-api/v1/dashboard/me`, params);
  check(res, { 'dashboard 200': r => r.status === 200 });

  sleep(0.3);

  // 3. List perm types
  res = http.get(`${BASE}/perm-api/v1/perm-types`, params);
  check(res, { 'perm-types 200': r => r.status === 200 });

  sleep(0.5);

  // 4. Create new request
  params.tags.endpoint = 'create';
  const newBody = JSON.stringify({
    target_system: 'cimrms',
    permission_type: 'system_access',
    permission_level: 'read',
    resource_id: `loadtest-${randomStr(6)}`,
    reason: 'k6 load test',
    requested_duration: '24h',
    urgency: 'normal',
  });
  res = http.post(`${BASE}/perm-api/v1/requests`, newBody, params);
  const createOk = check(res, { 'create 200 or 201': r => r.status === 200 || r.status === 201 });
  if (createOk && res.json('id')) {
    const newId = res.json('id');
    sleep(0.3);
    // 5. IT review
    params.tags.endpoint = 'review';
    res = http.post(`${BASE}/perm-api/v1/requests/${newId}/it-review`,
      JSON.stringify({ action: 'approve', comment: 'k6 load test approval' }), params);
    check(res, { 'it-review 200': r => r.status === 200 });
  }

  sleep(0.5);
}
