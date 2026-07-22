/**
 * MDM API Load Test (S4-5)
 * 端点：http://localhost:3000
 * 场景：用户管理 + 角色 + 通知 + 审计的混合读写
 *
 * 执行：k6 run --out json=results/mdm-api.json load-tests/scenarios/mdm-api.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { getDevToken, defaultHeaders, randomEmail, randomStr } from '../lib/auth.js';

const BASE = 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '20s', target: 20 },  // ramp-up
    { duration: '60s', target: 50 },  // sustained
    { duration: '20s', target: 0 },   // ramp-down
  ],
  thresholds: {
    'http_req_duration{endpoint:users}':       ['p(95)<300', 'p(99)<500'],
    'http_req_duration{endpoint:roles}':       ['p(95)<200', 'p(99)<400'],
    'http_req_duration{endpoint:notifications}': ['p(95)<300', 'p(99)<500'],
    'http_req_duration{endpoint:audit}':       ['p(95)<500', 'p(99)<800'],
    'http_req_failed':                         ['rate<0.01'],
  },
};

export function setup() {
  return { token: getDevToken(BASE) };
}

export default function (data) {
  const headers = defaultHeaders(data.token);
  const params = { headers, tags: { endpoint: '' } };

  // 1. List users (read-heavy)
  params.tags.endpoint = 'users';
  let res = http.get(`${BASE}/v1/users?pageSize=20`, params);
  check(res, { 'list users 200': r => r.status === 200 });

  // 2. Get current user
  res = http.get(`${BASE}/v1/users/me`, params);
  check(res, { 'get me 200': r => r.status === 200 });

  sleep(0.5);

  // 3. List roles
  params.tags.endpoint = 'roles';
  res = http.get(`${BASE}/v1/roles`, params);
  check(res, { 'list roles 200': r => r.status === 200 });

  // 4. Get notifications
  params.tags.endpoint = 'notifications';
  res = http.get(`${BASE}/v1/notifications?pageSize=10`, params);
  check(res, { 'list notifications 200': r => r.status === 200 });

  // 5. Get unread count
  res = http.get(`${BASE}/v1/notifications/count`, params);
  check(res, { 'unread count 200': r => r.status === 200 });

  sleep(0.3);

  // 6. Audit query
  params.tags.endpoint = 'audit';
  res = http.get(`${BASE}/v1/audit?page=1&pageSize=20`, params);
  check(res, { 'audit 200': r => r.status === 200 });

  sleep(0.5);
}
