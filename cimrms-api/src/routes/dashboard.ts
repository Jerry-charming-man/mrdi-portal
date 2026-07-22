/**
 * Dashboard routes
 * GET /v1/dashboard/me  — personal KPIs
 * GET /v1/dashboard/team — team dashboard (auditor+)
 */
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Prisma } from '@prisma/client';
import createHttpError from 'http-errors';

export const dashboardRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/me', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req) => {
    const user = req.currentUser!;
    const [myOpenTodos, myPendingApprovals, myInProgress, mySubmitted] = await Promise.all([
      app.prisma.todoItem.count({ where: { ownerEmail: user.email, status: 'open' } }),
      user.role === 'auditor' || user.role === 'admin'
        ? app.prisma.request.count({ where: { status: 'pending_manager', deletedAt: null } })
        : 0,
      app.prisma.request.count({
        where: {
          assigneeEmail: user.email,
          status: { in: ['scheduled', 'in_development', 'pending_uat', 'pending_deploy', 'pending_acceptance'] },
          deletedAt: null,
        },
      }),
      app.prisma.request.count({ where: { submitterEmail: user.email, deletedAt: null } }),
    ]);

    const myTodos = await app.prisma.todoItem.findMany({
      where: { ownerEmail: user.email, status: 'open' },
      orderBy: [{ createdAt: 'desc' }],
      take: 5,
      include: { relatedRequest: { select: { requestNo: true } } },
    });

    // 30-day trend (submitted/closed per day)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSubmitted = await app.prisma.request.findMany({
      where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null },
      select: { createdAt: true, closedAt: true },
    });
    const trendMap = new Map<string, { date: string; submitted: number; closed: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      trendMap.set(key, { date: key, submitted: 0, closed: 0 });
    }
    for (const r of recentSubmitted) {
      const k = r.createdAt.toISOString().slice(0, 10);
      const entry = trendMap.get(k);
      if (entry) entry.submitted++;
      if (r.closedAt) {
        const ck = r.closedAt.toISOString().slice(0, 10);
        const ce = trendMap.get(ck);
        if (ce) ce.closed++;
      }
    }

    return {
      kpis: {
        myOpenTodos,
        myPendingApprovals,
        myInProgressRequests: myInProgress,
        mySubmittedRequests: mySubmitted,
      },
      myTodos: myTodos.map((t) => ({
        id: t.id,
        title: t.title,
        label: t.label,
        relatedRequestId: t.relatedRequestId,
        requestNo: t.relatedRequest?.requestNo ?? null,
        dueAt: t.dueAt,
      })),
      monthlyTrend: Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
    };
  });

  app.get('/team', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req) => {
    const user = req.currentUser!;
    if (!['auditor', 'admin'].includes(user.role)) {
      throw createHttpError.Forbidden('Auditor+ only');
    }
    const [totalActive, inProgress, pendingUat, pendingAcceptance, closed] = await Promise.all([
      app.prisma.request.count({ where: { deletedAt: null, status: { not: 'closed' } } }),
      app.prisma.request.count({ where: { deletedAt: null, status: { in: ['scheduled', 'in_development'] } } }),
      app.prisma.request.count({ where: { deletedAt: null, status: 'pending_uat' } }),
      app.prisma.request.count({ where: { deletedAt: null, status: 'pending_acceptance' } }),
      app.prisma.request.count({ where: { status: 'closed' } }),
    ]);

    // urgency distribution
    const urgencyGroups = await app.prisma.request.groupBy({
      by: ['urgency'],
      where: { deletedAt: null, status: { not: 'closed' } },
      _count: { _all: true },
    });
    const statusGroups = await app.prisma.request.groupBy({
      by: ['status'],
      where: { deletedAt: null, status: { not: 'closed' } },
      _count: { _all: true },
    });

    return {
      kpis: {
        totalRequests: totalActive,
        inProgress,
        pendingUat,
        pendingAcceptance,
        overdueCount: 0,  // TODO compute via SLA
        warningCount: 0,
      },
      teamMembers: [],
      urgencyDistribution: urgencyGroups.map((g) => ({ urgency: g.urgency, count: g._count._all })),
      statusDistribution: statusGroups.map((g) => ({ status: g.status, count: g._count._all })),
      recentRequests: [],
    };
  });
};
