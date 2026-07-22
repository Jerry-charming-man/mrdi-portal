const http = require('http');
const payload = JSON.stringify({
  to_emails: ['jerry.sun@mrdi.org.hk'],
  notification_type: 'incident_created',
  title: 'Direct API Test incident_created',
  body: 'Testing direct call from cimims-api container',
  metadata: { incidentNo: 'INC-2026-0003', action: 'incident_created' }
});
const req = http.request({
  hostname: 'mdm-api',
  port: 3000,
  path: '/v1/notifications/send',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'X-Service-Token': 'mrdi-dev-service-token-2024'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
  });
});
req.write(payload);
req.end();
