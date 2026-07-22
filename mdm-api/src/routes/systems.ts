/**
 * System routes
 * GET  /v1/systems
 * POST /v1/systems  ★ 需要 admin
 */
import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { requireAdmin } from '@mrdi/shared/permission';

export const systemRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/', {
    onRequest: async (req) => { app.auth(req); },
  }, async () => {
    const systems = await app.prisma.registeredSystem.findMany({ orderBy: { created_at: 'asc' } });
    return { ok: true, data: systems };
  });

  app.post<{ Body: { system_id: string; name: string; api_base_url: string; description?: string } }>(
    '/',
    { onRequest: async (req) => { app.auth(req); } },
    async (req) => {
      requireAdmin(req.currentUser);
      const system = await app.prisma.registeredSystem.create({
        data: {
          system_id: req.body.system_id, name: req.body.name, api_base_url: req.body.api_base_url,
          description: req.body.description, allowed_roles: ['admin', 'editor', 'viewer'],
          created_by: req.currentUser!.email,
        },
      });
      await app.prisma.auditLog.create({
        data: {
          actor_email: req.currentUser!.email, actor_name: req.currentUser!.name,
          action: 'system.register', target_type: 'system', metadata: { system_id: req.body.system_id },
        },
      });
      return { ok: true, data: system };
    },
  );
};
