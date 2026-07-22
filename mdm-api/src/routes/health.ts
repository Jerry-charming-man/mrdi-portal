/**
 * Health check — 开放路由
 *
 * S3-1c: 队列健康状态
 */
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { isQueueHealthy, QUEUE_NAME } from '../plugins/bullmq.js';

export const healthRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/health', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            db: { type: 'string' },
            queue: { type: 'string' },
            uptime: { type: 'number' },
            version: { type: 'string' },
          },
        },
      },
    },
  }, async (_req, _reply) => {
    let dbStatus: 'up' | 'down' = 'up';
    try {
      await app.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'down';
    }

    // Queue is optional; just report its presence
    const queueHealthy = isQueueHealthy();
    const overall = dbStatus === 'up' ? 'ok' : 'degraded';

    return {
      status: overall,
      db: dbStatus,
      queue: queueHealthy ? 'up' : 'not_configured',
      queueName: queueHealthy ? QUEUE_NAME : null,
      uptime: process.uptime(),
      version: '1.0.0',
    };
  });
};
