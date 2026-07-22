import { PrismaClient } from '/app/node_modules/@prisma/client/index.js';
const prisma = new PrismaClient({ datasourceUrl: 'postgresql://mrdi:mrdi_dev@mrdi-postgres:5432/mrdi' });
await prisma.$executeRaw`ALTER TABLE "mdm"."Notification" DROP CONSTRAINT "Notification_recipient_email_fkey"`;
console.log('FK dropped OK');
await prisma.$disconnect();
