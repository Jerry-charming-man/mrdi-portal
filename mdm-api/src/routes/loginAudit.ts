/**
 * Login Audit routes (S3-10)
 *
 * GET /v1/login-audit              — 分页列表（admin+）
 * GET /v1/login-audit/failed-logins — 今日失败登录（admin+）
 * GET /v1/login-audit/summary        — 摘要统计（admin+）
 */
import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import createHttpError from 'http-errors';
import { requireAdmin } from '@mrdi/shared/permission';

const ListQuerySchema = z.object({
  action: z.string().optional(),
  email: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const loginAuditRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // All routes require admin
  app.addHook('onRequest', async (req) => {
    app.auth(req);
    requireAdmin(req.currentUser);
  });

  // GET /v1/login-audit — 分页审计日志
  app.get('/', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req) => {
    const parsed = ListQuerySchema.safeParse(req.query);
    if (!parsed.success) throw createHttpError.BadRequest(JSON.stringify(parsed.error.flatten()));
    const q = parsed.data;

    const where: Record<string, unknown> = {};
    if (q.action) {
      where.action = { contains: q.action, mode: 'insensitive' };
    }
    if (q.email) {
      where.actor_email = { contains: q.email, mode: 'insensitive' };
    }
    if (q.dateFrom || q.dateTo) {
      where.created_at = {};
      if (q.dateFrom) (where.created_at as Record<string, unknown>).gte = new Date(q.dateFrom);
      if (q.dateTo) (where.created_at as Record<string, unknown>).lte = new Date(q.dateTo + 'T23:59:59Z');
    }

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
        id: r.id,
        action: r.action,
        actorEmail: r.actor_email,
        actorName: r.actor_name,
        targetType: r.target_type,
        metadata: r.metadata,
        createdAt: r.created_at,
      })),
      pagination: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: Math.ceil(total / q.pageSize),
      },
    };
  });

  // GET /v1/login-audit/failed-logins — 今日失败登录（最近 7 天）
  app.get('/failed-logins', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const items = await app.prisma.auditLog.findMany({
      where: {
        action: { in: ['auth.login.fail', 'auth.login.locked', 'auth.login.lock'] },
        created_at: { gte: sevenDaysAgo },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    // 按 email 聚合
    const byEmail: Record<string, { count: number; lastAt: Date; lastReason: string | null }> = {};
    for (const r of items) {
      const key = r.actor_email;
      if (!byEmail[key]) {
        byEmail[key] = { count: 0, lastAt: r.created_at, lastReason: null };
      }
      byEmail[key].count++;
      byEmail[key].lastAt = r.created_at;
      const meta = r.metadata as Record<string, unknown> | null;
      byEmail[key].lastReason = meta?.reason as string | null ?? null;
    }

    return {
      period: '最近7天',
      totalFailed: items.length,
      byEmail: Object.entries(byEmail)
        .map(([email, data]) => ({ email, ...data }))
        .sort((a, b) => b.count - a.count),
    };
  });

  // GET /v1/login-audit/summary — 今日摘要
  app.get('/summary', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todaySuccess, todayFail, todayLocked, totalUsers] = await Promise.all([
      app.prisma.auditLog.count({
        where: { action: 'auth.login.success', created_at: { gte: today } },
      }),
      app.prisma.auditLog.count({
        where: { action: 'auth.login.fail', created_at: { gte: today } },
      }),
      app.prisma.auditLog.count({
        where: { action: { in: ['auth.login.lock', 'auth.login.locked'] }, created_at: { gte: today } },
      }),
      app.prisma.user.count({ where: { deleted_at: null } }),
    ]);

    return {
      date: today.toISOString().split('T')[0],
      successLogins: todaySuccess,
      failedLogins: todayFail,
      lockedAccounts: todayLocked,
      totalActiveUsers: totalUsers,
    };
  });
};
