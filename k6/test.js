import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  duration: '5s',
};

export default function () {
  const res = http.get('http://localhost:3001/v1/auth/dev/login?email=test@test.com&role=editor');
  check(res, { 'ok': (r) => r.status === 200 });
}
