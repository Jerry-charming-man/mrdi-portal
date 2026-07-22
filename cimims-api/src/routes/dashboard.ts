/**
 * Dashboard routes
 * GET /v1/dashboard/me
 * GET /v1/dashboard/duty
 * GET /v1/dashboard/fab
 */
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import createHttpError from 'http-errors';

export const dashboardRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/me', { onRequest: async (req) => { app.auth(req); } }, async (req) => {
    const user = req.currentUser!;
    const [myReportedOpen, myReportedClosed, myAssignedOpen, slaBreach, slaWarn, recent] = await Promise.all([
      app.prisma.incident.count({
        where: { submitterEmail: user.email, status: { not: 'closed' } },
      }),
      app.prisma.incident.count({
        where: { submitterEmail: user.email, status: 'closed' },
      }),
      app.prisma.incident.count({
        where: {
          OR: [
            { dutyEngineerEmail: user.email },
            { assignedEngineerEmail: user.email },
          ],
          status: { not: 'closed' },
        },
      }),
      app.prisma.incident.count({
        where: {
          OR: [
            { dutyEngineerEmail: user.email },
            { assignedEngineerEmail: user.email },
          ],
          slaCloseBreached: true,
          status: { not: 'closed' },
        },
      }),
      app.prisma.incident.count({
        where: {
          OR: [
            { dutyEngineerEmail: user.email },
            { assignedEngineerEmail: user.email },
          ],
          slaWarnedAt: { not: null },
          status: { not: 'closed' },
        },
      }),
      app.prisma.incident.findMany({
        where: {
          OR: [
            { submitterEmail: user.email },
            { dutyEngineerEmail: user.email },
            { assignedEngineerEmail: user.email },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);
    return {
      my_reported: { total: myReportedOpen + myReportedClosed, open: myReportedOpen, closed: myReportedClosed },
      my_assigned: { total: myAssignedOpen, open: myAssignedOpen, sla_warning: slaWarn, sla_breached: slaBreach },
      recent,
      my_todos: myReportedOpen + myAssignedOpen,
    };
  });

  app.get('/duty', { onRequest: async (req) => { app.auth(req); } }, async (req) => {
    const user = req.currentUser!;
    if (!['duty', 'admin'].includes(user.role)) throw createHttpError.Forbidden('Duty+ only');
    const [pendingTakeover, processing, transferred, pendingConfirm] = await Promise.all([
      app.prisma.incident.groupBy({
        by: ['urgency'],
        where: { status: 'pending_takeover' },
        _count: { _all: true },
      }),
      app.prisma.incident.count({ where: { status: 'processing' } }),
      app.prisma.incident.count({ where: { status: 'transferred' } }),
      app.prisma.incident.count({ where: { status: 'pending_confirm' } }),
    ]);
    return {
      pending_takeover: {
        total: pendingTakeover.reduce((a, b) => a + b._count._all, 0),
        p1: pendingTakeover.find(g => g.urgency === 'P1')?._count._all ?? 0,
        p2: pendingTakeover.find(g => g.urgency === 'P2')?._count._all ?? 0,
        p3: pendingTakeover.find(g => g.urgency === 'P3')?._count._all ?? 0,
      },
      processing: { total: processing, sla_warning: 0, sla_breached: 0 },
      transferred: { total: transferred, sla_warning: 0, sla_breached: 0 },
      pending_confirm: { total: pendingConfirm, sla_warning: 0, sla_breached: 0 },
      type_distribution: [],
      recent_p1: await app.prisma.incident.findMany({
        where: { urgency: 'P1' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    };
  });

  app.get('/fab', { onRequest: async (req) => { app.auth(req); } }, async (req) => {
    const user = req.currentUser!;
    if (!['auditor', 'admin'].includes(user.role)) throw createHttpError.Forbidden('Auditor+ only');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
    const [newToday, closedToday, openTotal, newWeek, closedWeek, slaBreach, slaWarn] = await Promise.all([
      app.prisma.incident.count({ where: { createdAt: { gte: today } } }),
      app.prisma.incident.count({ where: { closedAt: { gte: today } } }),
      app.prisma.incident.count({ where: { status: { not: 'closed' } } }),
      app.prisma.incident.count({ where: { createdAt: { gte: weekAgo } } }),
      app.prisma.incident.count({ where: { closedAt: { gte: weekAgo } } }),
      app.prisma.incident.count({ where: { slaCloseBreached: true, status: { not: 'closed' } } }),
      app.prisma.incident.count({ where: { slaWarnedAt: { not: null }, status: { not: 'closed' } } }),
    ]);
    return {
      today: { new: newToday, closed: closedToday, open: openTotal },
      this_week: {
        new: newWeek,
        closed: closedWeek,
        resolution_rate: newWeek > 0 ? closedWeek / newWeek : 0,
      },
      sla_health: { warning: slaWarn, breached: slaBreach, response_p95_minutes: 0, close_p95_minutes: 0 },
      top_engineers: [],
      top_problem_systems: [],
    };
  });
};
