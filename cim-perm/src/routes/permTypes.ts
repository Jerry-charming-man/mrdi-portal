/**
 * Perm Types routes
 * GET /perm-api/v1/perm-types (public)
 */
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getPermTypes } from '../services/configService.js';

export const permTypesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('onRequest', async (req) => app.auth(req));
  app.get('/perm-types', async (_req, reply) => {
    try {
      const rows = await getPermTypes();
      return reply.send(rows);
    } catch (e: unknown) {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: (e as Error).message } });
    }
  });
};
