const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient({
    datasources: { db: { url: 'postgresql://mrdi:mrdi_dev@postgres:5432/mrdi?schema=mdm' } }
  });

  const passwordHash = await bcrypt.hash('TestPass123!', 12);
  const now = new Date().toISOString().replace('T', ' ').replace('Z', '+00');

  // Upsert test user using Prisma client upsert
  const result = await prisma.user.upsert({
    where: { email: 'changepwd@test.com' },
    update: {
      password_hash: passwordHash,
      failed_login_count: 0,
      locked_until: null,
      deleted_at: null,
    },
    create: {
      email: 'changepwd@test.com',
      name: 'Change Password Test',
      department: 'CIM',
      global_role: 'editor',
      password_hash: passwordHash,
      failed_login_count: 0,
      must_change_password: false,
    },
  });

  console.log('Test user upserted:', result.email);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
