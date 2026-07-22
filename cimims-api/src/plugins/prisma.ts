/**
 * Prisma Client 单例 — imports from local generated client to avoid cross-service collision
 */
import fp from 'fastify-plugin';
import { PrismaClient } from '../../node_modules/.prisma/cimims-client/index.js';

export const prismaPlugin = fp(async (app, { DATABASE_URL }: { DATABASE_URL: string }) => {
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
    log: app.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

  await prisma.$connect();
  app.log.info('[prisma] connected');

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
    app.log.info('[prisma] disconnected');
  });

  app.decorate('prisma', prisma);
});
