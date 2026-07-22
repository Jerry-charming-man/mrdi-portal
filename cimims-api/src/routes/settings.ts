/**
 * Settings routes
 * GET /v1/settings/sla-configs
 * GET /v1/settings/engineers
 * GET /v1/settings/duty-roster
 * GET /v1/settings/escalation-rules
 */
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import createHttpError from 'http-errors';

export const settingsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // SLA configs
  app.get('/sla-configs', { onRequest: async (req) => { app.auth(req); } }, async () => {
    const configs = await app.prisma.slaConfig.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { urgency: 'asc' }],
    });
    return { data: configs };
  });

  // Engineer members
  app.get<{ Querystring: { engineerType?: string } }>('/engineers', { onRequest: async (req) => { app.auth(req); } }, async (req) => {
    const where: { isActive: boolean; engineerType?: string } = { isActive: true };
    if (req.query.engineerType) where.engineerType = req.query.engineerType;
    const engineers = await app.prisma.engineerMember.findMany({ where, orderBy: { engineerType: 'asc' } });
    return { data: engineers };
  });

  // Duty roster
  app.get('/duty-roster', { onRequest: async (req) => { app.auth(req); } }, async () => {
    const rosters = await app.prisma.dutyRoster.findMany({
      where: { isActive: true },
      orderBy: [{ effectiveDate: 'desc' }, { shiftStart: 'asc' }],
    });
    return { data: rosters };
  });

  // Escalation rules
  app.get('/escalation-rules', { onRequest: async (req) => { app.auth(req); } }, async (req) => {
    const user = req.currentUser!;
    if (!['admin', 'auditor'].includes(user.role)) throw createHttpError.Forbidden('Admin/auditor only');
    const rules = await app.prisma.escalationRule.findMany({ where: { isActive: true }, orderBy: { priority: 'asc' } });
    return { data: rules };
  });
};
