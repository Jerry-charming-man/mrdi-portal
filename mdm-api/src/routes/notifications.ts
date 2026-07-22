/**
 * Notification routes
 * GET  /v1/notifications         ← 列表（当前用户）
 * GET  /v1/notifications/count  ← 未读数
 * PATCH /v1/notifications/:id/read   ← 标记已读
 * PATCH /v1/notifications/read-all  ← 全部标已读
 * DELETE /v1/notifications/:id       ← 删除
 */
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { NotificationService } from '../services/notificationService.js';

export const notificationRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const svc = new NotificationService(app.prisma);

  const auth = (async (req: Parameters<typeof app.auth>[0]) => {
    app.auth(req);
  }) as Parameters<typeof app.get>[1]['onRequest'];

  // GET /v1/notifications — paginated list for current user
  app.get('/', { onRequest: auth }, async (req) => {
    const url = new URL(req.url, 'http://localhost');
    const unreadOnly = url.searchParams.get('unread') === 'true';
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '20', 10)));

    const email = (req.user as { email: string }).email;
    return svc.list({ recipientEmail: email, unreadOnly, page, pageSize });
  });

  // GET /v1/notifications/count — unread count
  app.get('/count', { onRequest: auth }, async (req) => {
    const email = (req.user as { email: string }).email;
    const { unreadCount } = await svc.list({ recipientEmail: email, unreadOnly: false, pageSize: 1 });
    return { unreadCount };
  });

  // PATCH /v1/notifications/:id/read — mark single as read
  app.patch<{ Params: { id: string } }>(
    '/:id/read',
    { onRequest: auth },
    async (req, reply) => {
      const email = (req.user as { email: string }).email;
      const ok = await svc.markRead(req.params.id, email);
      if (!ok) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: '通知不存在或已读' } });
      }
      return { ok: true };
    },
  );

  // PATCH /v1/notifications/read-all — mark all as read
  app.patch('/read-all', { onRequest: auth }, async (req) => {
    const email = (req.user as { email: string }).email;
    const count = await svc.markAllRead(email);
    return { ok: true, count };
  });

  // DELETE /v1/notifications/:id — delete
  app.delete<{ Params: { id: string } }>(
    '/:id',
    { onRequest: auth },
    async (req, reply) => {
      const email = (req.user as { email: string }).email;
      const ok = await svc.delete(req.params.id, email);
      if (!ok) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: '通知不存在' } });
      }
      return { ok: true };
    },
  );
};
