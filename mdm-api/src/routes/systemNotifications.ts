/**
 * System Notifications — service-token 鉴权
 * 供 cimrms-api / cimims-api / cim-perm-api 等内部系统调用
 * POST /v1/notifications/send
 *
 * S3-1b: BullMQ async processing
 * - Enqueues a job immediately (fast response)
 * - Worker writes to DB in background
 * - Queue health exposed via /health endpoint
 */
import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getNotificationQueue } from '../plugins/bullmq.js';

// ── Request schema ─────────────────────────────────────────────────────────────

const SendNotificationSchema = z.object({
  // 收件人邮箱列表（必填）
  to_emails: z.array(z.string().email()).min(1),
  // 通知类型（对应 NotificationType enum）
  notification_type: z.string(),
  // 通知标题（必填）
  title: z.string().min(1).max(200),
  // 通知正文（可选）
  body: z.string().max(2000).optional(),
  // 跳转链接元数据（可选）
  metadata: z.record(z.unknown()).optional(),
});

// ── Route ─────────────────────────────────────────────────────────────────────

export const systemNotificationRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {

  // Service token 校验 middleware
  const requireServiceToken = async (req: { headers: Record<string, string | string[] | undefined> }) => {
    const token = req.headers['x-service-token'];
    if (!token || token !== app.env.SERVICE_TOKEN) {
      throw { statusCode: 403, message: 'Invalid service token' };
    }
  };

  // POST /v1/notifications/send — enqueue notification job
  app.post<{ Body: z.infer<typeof SendNotificationSchema> }>(
    '/send',
    { preHandler: requireServiceToken as Parameters<typeof app.post>[1]['preHandler'] },
    async (req, reply) => {
      const parsed = SendNotificationSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
      }
      const { to_emails, notification_type, title, body, metadata } = parsed.data;

      try {
        const queue = await getNotificationQueue();
        const job = await queue.add('batch-notify', {
          notifications: to_emails.map(email => ({
            recipientEmail: email,
            type: notification_type,
            title,
            body,
            metadata,
          })),
        }, {
          jobId: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        });

        app.log.info(`[notif/send] enqueued job ${job.id} — ${to_emails.length} recipients`);

        return reply.status(202).send({
          ok: true,
          count: to_emails.length,
          jobId: job.id,
        });
      } catch (err) {
        // Fallback: if queue is unavailable, write directly (degraded mode)
        app.log.warn(`[notif/send] queue unavailable, writing directly: ${(err as Error).message}`);
        const { NotificationService } = await import('../services/notificationService.js');
        const svc = new NotificationService(app.prisma);
        await svc.createMany(to_emails.map(email => ({
          recipientEmail: email,
          type: notification_type as import('@prisma/client').NotificationType,
          title,
          body,
          metadata,
        })));
        return reply.status(202).send({
          ok: true,
          count: to_emails.length,
          jobId: null,
          degraded: true,
        });
      }
    },
  );
};
