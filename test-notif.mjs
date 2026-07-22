import {PrismaClient} from '@prisma/client';
const p = new PrismaClient({datasources: {db: {url: 'postgresql://mrdi:mrdi_dev@mrdi-postgres:5432/mrdi?schema=mdm'}}});
try {
  const r = await p.notification.create({
    data: {
      recipient_email: 'jerry.sun@mrdi.org.hk',
      type: 'system_alert',
      title: 'Direct Prisma Test'
    }
  });
  console.log('Created notification:', r.id);
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await p.$disconnect();
}
