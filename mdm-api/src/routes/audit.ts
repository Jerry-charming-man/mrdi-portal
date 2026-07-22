/**
 * Unified Audit routes (S4-3)
 *
 * GET  /v1/audit         — 查询审计日志（admin+，JWT auth）
 *                          支持按 system/action/actor/date 过滤
 * POST /v1/audit/events  — 接收其他服务写入的 audit events（service token auth）
 *
 * 设计：
 *   - 各业务系统（cimrms/cimims/cim-perm）通过 POST /events 将关键操作写入 MDM AuditLog
 *   - POST 用 SERVICE_TOKEN 做 service-to-service 鉴权
 *   - GET 用 JWT Bearer 做 admin 鉴权
 */
import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import createHttpError from 'http-errors';
import { requireAdmin } from '@mrdi/shared/permission';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const AuditQuerySchema = z.object({
  system:   z.string().optional().describe('来源系统: mdm / cimrms / cimims / cim-perm'),
  action:   z.string().optional().describe('操作类型，如 request.approve'),
  actor:    z.string().optional().describe('操作人 email'),
  target:   z.string().optional().describe('目标 email 或 ID'),
  dateFrom: z.string().optional().describe('起始日期 YYYY-MM-DD'),
  dateTo:   z.string().optional().describe('结束日期 YYYY-MM-DD'),
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const AuditEventSchema = z.object({
  sourceSystem: z.string().describe('来源系统: mdm | cimrms | cimims | cim-perm'),
  action:      z.string().describe('操作类型，如 request.approve, incident.takeover'),
  actorEmail:   z.string().email(),
  actorName:    z.string(),
  targetEmail:  z.string().optional(),
  targetType:   z.string().optional().describe('目标类型: user | request | incident | permission'),
  targetId:     z.string().optional(),
  metadata:      z.record(z.unknown()).optional(),
  ipAddress:    z.string().optional(),
  timestamp:    z.string().datetime().optional().describe('ISO 8601，若不填则用服务器时间'),
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildWhere(q: z.infer<typeof AuditQuerySchema>): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  if (q.system) {
    // 系统名存在 metadata.sourceSystem
    where.metadata = { path: ['sourceSystem'], equals: q.system };
  }
  if (q.action) {
    where.action = { contains: q.action, mode: 'insensitive' };
  }
  if (q.actor) {
    where.actor_email = { contains: q.actor, mode: 'insensitive' };
  }
  if (q.target) {
    where.target_email = { contains: q.target, mode: 'insensitive' };
  }
  if (q.dateFrom || q.dateTo) {
    where.created_at = {};
    if (q.dateFrom) (where.created_at as Record<string, unknown>).gte = new Date(q.dateFrom + 'T00:00:00Z');
    if (q.dateTo)   (where.created_at as Record<string, unknown>).lte = new Date(q.dateTo   + 'T23:59:59Z');
  }
  return where;
}

// ─── Route ──────────────────────────────────────────────────────────────────

export const auditRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const env = app.env;

  // ── POST /audit/events — service token 鉴权，写入 audit log ──────────
  app.post('/events', async (req: FastifyRequest) => {
    // Service token 鉴权（service-to-service）
    const auth = req.headers['x-service-token'];
    if (!auth || auth !== env.SERVICE_TOKEN) {
      throw createHttpError.Unauthorized('Invalid service token');
    }

    const parsed = AuditEventSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createHttpError.BadRequest(JSON.stringify(parsed.error.flatten()));
    }
    const e = parsed.data;

    const record = await app.prisma.auditLog.create({
      data: {
        actor_email: e.actorEmail,
        actor_name:  e.actorName,
        action:      e.sourceSystem + '.' + e.action,
        target_email: e.targetEmail ?? null,
        target_type:  e.targetType  ?? null,
        metadata: {
          sourceSystem: e.sourceSystem,
          targetId:    e.targetId,
          ...(e.metadata ?? {}),
        },
        ip_address: e.ipAddress ?? null,
        created_at: e.timestamp ? new Date(e.timestamp) : undefined,
      },
    });

    return { id: record.id, ok: true };
  });

  // ── GET /audit — admin JWT 鉴权，查询 audit log ──────────────────────
  app.get('/', async (req: FastifyRequest) => {
    const user = app.auth(req);
    requireAdmin(user);

    const parsed = AuditQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw createHttpError.BadRequest(JSON.stringify(parsed.error.flatten()));
    }
    const q = parsed.data;

    const where = buildWhere(q);

    const [total, items] = await Promise.all([
      app.prisma.auditLog.count({ where }),
      app.prisma.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);

    return {
      items: items.map(r => ({
        id:          r.id,
        action:      r.action,
        actorEmail:  r.actor_email,
        actorName:   r.actor_name,
        targetEmail: r.target_email,
        targetType:  r.target_type,
        metadata:     r.metadata,
        ipAddress:   r.ip_address,
        createdAt:   r.created_at.toISOString(),
      })),
      pagination: {
        page:       q.page,
        pageSize:   q.pageSize,
        total,
        totalPages: Math.ceil(total / q.pageSize),
      },
    };
  });
};
