import { createHmac } from 'k6/crypto';

export const options = { vus: 1, duration: '1s' };

export default function () {
  const hmac = createHmac('sha256', 'my-secret-key');
  hmac.update('hello world');
  const hex = hmac.digest('hex');
  console.log('hmac hex:', hex);
  // Expected: sha256 hmac of "hello world" with key "my-secret-key"
}
