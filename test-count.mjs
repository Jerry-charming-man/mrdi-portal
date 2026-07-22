import {PrismaClient} from '@prisma/client';
const p = new PrismaClient({
  datasources: { db: { url: 'postgresql://mrdi:mrdi_dev@mrdi-postgres:5432/mrdi?schema=mdm' } }
});
try {
  const count = await p.notification.count();
  console.log('Notification count:', count);
  const r = await p.notification.create({
    data: {
      recipient_email: 'jerry.sun@mrdi.org.hk',
      type: 'system_alert',
      title: 'Test from mjs'
    }
  });
  console.log('Created:', r.id);
  const count2 = await p.notification.count();
  console.log('Count after:', count2);
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await p.$disconnect();
}
