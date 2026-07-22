const { PrismaClient } = require('/app/node_modules/@prisma/client');
const prisma = new PrismaClient({ datasourceUrl: 'postgresql://mrdi:mrdi_dev@mrdi-postgres:5432/mrdi' });
prisma.$executeRaw`ALTER TABLE "mdm"."Notification" DROP CONSTRAINT "Notification_recipient_email_fkey"`
  .then(() => { console.log('FK dropped OK'); process.exit(0); })
  .catch(e => { console.error('Error:', e.message); process.exit(1); });
