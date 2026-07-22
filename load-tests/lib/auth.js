/**
 * k6 shared utilities
 *
 * 用途：4 个 API 压测通用
 *  - getDevToken(baseUrl) — 通过 dev login 拿 JWT
 *  - randomEmail() / randomStr() — 测试数据生成
 *  - defaultHeaders(token) — 通用 headers
 */
import http from 'k6/http';
import { fail } from 'k6';

const ADMIN_EMAIL = 'jerry.sun@mrdi.org.hk';
const ADMIN_ROLE  = 'admin';
const ADMIN_KEY   = 'mrdi-dev-admin-key-2026';
const MDM_API     = 'http://localhost:3000';

/**
 * Get a dev JWT.
 * Strategy: all 4 APIs share JWT_SECRET, so we login via mdm-api (which has dev login enabled)
 * and use the token for any of the 4 APIs.
 */
export function getDevToken(_unusedBaseUrl) {
  const res = http.get(`${MDM_API}/auth/v1/dev/login?email=${encodeURIComponent(ADMIN_EMAIL)}&role=${ADMIN_ROLE}&admin_key=${ADMIN_KEY}`, {
    tags: { name: 'dev_login' },
  });
  if (res.status !== 200) {
    fail(`Dev login failed at ${MDM_API}: ${res.status} ${res.body}`);
  }
  const body = res.json();
  if (!body.token) {
    fail(`No token in dev login response: ${JSON.stringify(body)}`);
  }
  return body.token;
}

export function defaultHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export function randomStr(len = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function randomEmail() {
  return `loadtest_${randomStr(6)}@mrdi.org.hk`;
}
