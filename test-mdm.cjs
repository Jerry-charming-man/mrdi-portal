const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.notification.findMany({ take: 1, orderBy: { created_at: 'desc' } })
  .then(r => { console.log(JSON.stringify(r, null, 2)); process.exit(0); })
  .catch(e => { console.error('ERROR:', e.message); process.exit(1); });
