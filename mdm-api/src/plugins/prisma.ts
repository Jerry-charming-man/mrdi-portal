/**
 * Prisma Client 单例 — Fastify plugin
 */
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

export const prismaPlugin = fp(async (app, { DATABASE_URL }: { DATABASE_URL: string }) => {
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
    log: app.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

  await prisma.$connect();
  app.log.info('[prisma] connected');

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
    app.log.info('[prisma] disconnected');
  });

  app.decorate('prisma', prisma);
}, { name: 'prisma' });
