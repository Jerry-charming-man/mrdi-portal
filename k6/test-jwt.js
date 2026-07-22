import jwt from 'k6/jwt';

export const options = { vus: 1, duration: '1s' };

export default function () {
  const now = Math.floor(Date.now() / 1000);
  const token = jwt.sign(
    { email: 'test@test.com', name: 'Test', role: 'editor' },
    'dev-jwt-secret-change-in-production-mrdi-2026',
    { algorithm: 'HS256' }
  );
  console.log('token:', token.slice(0, 30));
}
