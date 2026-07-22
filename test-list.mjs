import {PrismaClient} from '@prisma/client';
const p = new PrismaClient({
  datasources: { db: { url: 'postgresql://mrdi:mrdi_dev@mrdi-postgres:5432/mrdi?schema=mdm' } }
});
try {
  const items = await p.notification.findMany({
    where: { recipient_email: 'jerry.sun@mrdi.org.hk' },
    orderBy: { created_at: 'desc' },
    take: 5
  });
  console.log('Recent notifications:');
  for (const n of items) {
    console.log(`  ${n.id} | ${n.type} | ${n.title} | ${n.created_at}`);
  }
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await p.$disconnect();
}
