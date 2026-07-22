/**
 * Concurrent create test
 */
import http from 'k6/http';
import { check } from 'k6';
import { getDevToken, defaultHeaders, randomStr } from '../lib/auth.js';

const BASE = 'http://localhost:3003';

export const options = {
  vus: 30,
  duration: '5s',
};

export function setup() {
  return { token: getDevToken(BASE) };
}

export default function (data) {
  const headers = defaultHeaders(data.token);
  const body = JSON.stringify({
    target_system: 'cimrms',
    permission_type: 'system_access',
    permission_level: 'read',
    resource_id: `loadtest-${randomStr(8)}`,
    reason: 'k6 concurrent test',
    requested_duration: '24h',
    urgency: 'normal',
  });

  const res = http.post(`${BASE}/perm-api/v1/requests`, body, { headers });
  check(res, {
    'create 200/201': r => r.status === 200 || r.status === 201,
  });
}
