/**
 * Dashboard routes
 * GET /perm-api/v1/dashboard/me
 * GET /perm-api/v1/expiring-soon
 */
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { dashboardStats, listExpiringSoon } from '../services/requestService.js';

export const dashboardRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('onRequest', async (req) => app.auth(req));

  // GET /dashboard/me (viewer+) — 自己的统计数据
  app.get('/dashboard/me', async (req, reply) => {
    if (!['viewer', 'editor', 'auditor', 'admin'].includes(req.currentUser!.role)) {
      return reply.code(403).send({ error: { code: 'FORBIDDEN', message: '需要 viewer+ 角色，当前为 ' + req.currentUser!.role } });
    }
    try {
      const stats = await dashboardStats(req.currentUser!.email, req.currentUser!.role);
      return reply.send(stats);
    } catch (e: unknown) {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: (e as Error).message } });
    }
  });

  // GET /expiring-soon (auditor+) — 全域即将过期申请
  app.get('/expiring-soon', async (req, reply) => {
    if (!['auditor', 'admin'].includes(req.currentUser!.role)) {
      return reply.code(403).send({ error: { code: 'FORBIDDEN', message: '需要 auditor+ 角色，当前为 ' + req.currentUser!.role } });
    }
    try {
      const rows = await listExpiringSoon(req.currentUser!.email, req.currentUser!.role);
      return reply.send(rows);
    } catch (e: unknown) {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: (e as Error).message } });
    }
  });
};
