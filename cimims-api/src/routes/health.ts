/**
 * Health check
 */
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/health', async () => {
    let dbStatus: 'up' | 'down' = 'up';
    try {
      await app.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'down';
    }
    return {
      status: dbStatus === 'up' ? 'ok' : 'degraded',
      db: dbStatus,
      uptime: process.uptime(),
      version: '1.0.0',
      service: 'cimims-api',
    };
  });
};
