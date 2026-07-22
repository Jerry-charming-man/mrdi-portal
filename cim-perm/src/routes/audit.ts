/**
 * Audit routes
 * GET /perm-api/v1/audit (auditor+)
 */
import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { AuditService } from '../services/auditService.js';

const AuditQuerySchema = z.object({
  eventType: z.string().optional(),
  actor: z.string().optional(),
  request_id: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const auditRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('onRequest', async (req) => app.auth(req));

  // GET /audit (auditor+)
  app.get('/audit', async (req, reply) => {
    if (!['admin', 'auditor'].includes(req.currentUser!.role)) {
      return reply.code(403).send({ error: { code: 'FORBIDDEN', message: '需要 auditor+ 角色，当前为 ' + req.currentUser!.role } });
    }
    const parsed = AuditQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } });
    }
    try {
      const auditService = new AuditService();
      const result = await auditService.list({
        eventType: parsed.data.eventType as 'all' | undefined,
        actorEmail: parsed.data.actor,
        requestId: parsed.data.request_id,
        from: parsed.data.from,
        to: parsed.data.to,
        page: parsed.data.page,
        pageSize: parsed.data.pageSize,
      });
      return reply.send(result);
    } catch (e: unknown) {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: (e as Error).message } });
    }
  });
};
