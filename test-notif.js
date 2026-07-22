const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient({datasources: {db: {url: 'postgresql://mrdi:mrdi_dev@mrdi-postgres:5432/mrdi?schema=mdm'}}});
p.notification.create({
  data: {
    recipient_email: 'jerry.sun@mrdi.org.hk',
    type: 'system_alert',
    title: 'Direct Prisma Test'
  }
}).then(r => {
  console.log('Created notification:', r.id);
  return p.$disconnect();
}).catch(e => {
  console.error('Error:', e.message);
  return p.$disconnect();
});
