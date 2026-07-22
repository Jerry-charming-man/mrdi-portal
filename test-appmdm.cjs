const http = require('http');
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImplcnJ5LlN1bkBtcmRpLm9yZy5oayIsIm5hbWUiOiJEZXYgVXNlciIsInJvbGUiOiJkdXR5IiwiZGVwYXJ0bWVudCI6IklUIiwiaWF0IjoxNzg0MjUyNjc4LCJleHAiOjE3ODQyODE0Nzh9.2IDRPIoVEyxbmbWpWJ91_xJaFqkrV-OoOisvyOGCXKU';
// Test calling the health route to see if mdm exists
const req = http.request({ hostname: 'cimims-api', port: 3002, path: '/v1/health', method: 'GET', headers: { 'Authorization': 'Bearer ' + token } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('HEALTH:', data));
});
req.end();
