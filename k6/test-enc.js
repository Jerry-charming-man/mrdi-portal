import encoding from 'k6/encoding';

export const options = { vus: 1, duration: '1s' };

export default function () {
  const encoded = encoding.b64encode('hello world', 'raw');
  console.log('encoded:', encoded);
}
