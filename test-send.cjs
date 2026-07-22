const http = require('http');

const body = JSON.stringify({
  to_emails: ['jerry.sun@mrdi.org.hk'],
  notification_type: 'system_alert',
  title: 'Direct HTTP test',
  body: 'Testing via node http module'
});

const options = {
  hostname: 'mdm-api',
  port: 3000,
  path: '/v1/notifications/send',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Service-Token': 'mrdi-dev-service-token-2024',
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
  });
});

req.on('error', e => console.error('Error:', e));
req.write(body);
req.end();
