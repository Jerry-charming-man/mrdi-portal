import { md5 } from 'k6/crypto';

export const options = { vus: 1, duration: '1s' };

export default function () {
  const result = md5('hello');
  console.log('md5 result:', result, typeof result);
}
