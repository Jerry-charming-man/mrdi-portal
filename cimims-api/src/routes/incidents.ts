/**
 * Incident routes
 *
 * GET    /v1/incidents
 * POST   /v1/incidents
 * GET    /v1/incidents/:id
 * GET    /v1/incidents/:id/timeline
 * POST   /v1/incidents/:id/take-over
 * POST   /v1/incidents/:id/transfer
 * POST   /v1/incidents/:id/timeline
 * POST   /v1/incidents/:id/mark-resolved
 * POST   /v1/incidents/:id/confirm
 * POST   /v1/incidents/:id/reject
 * POST   /v1/incidents/:id/force-close
 * GET    /v1/incidents/:id/audit
 */
import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Prisma } from '@prisma/client';
import createHttpError from 'http-errors';
import { requireAdmin, requireAuditor, checkResourcePermission } from '@mrdi/shared/permission';
import { nextIncidentNo, computeSla, getTransition } from '../services/incidentService.js';

// ─── IMS-specific guard: duty role maps to editor+ ─────────────────────────────
function requireDutyOrAbove(user: NonNullable<import('@mrdi/shared/permission').AuthUser>): void {
  if (!['duty', 'admin', 'editor'].includes(user.role)) {
    throw createHttpError.Forbidden(`需要 duty/editor/admin 角色，当前为 ${user.role}`);
  }
}

// ============================================================
// Schemas
// ============================================================
const CreateIncidentSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  type: z.enum(['system', 'network', 'account', 'equipment', 'other']),
  urgency: z.enum(['P1', 'P2', 'P3']),
  impactScope: z.enum(['user', 'team', 'dept', 'fab']),
  relatedSystem: z.string().max(100).optional(),
  attachmentIds: z.array(z.string().uuid()).max(10).default([]),
  relatedRequestId: z.string().regex(/^NC-\d{4}-\d{4}$/).optional(),
});

const ListIncidentsQuerySchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  urgency: z.enum(['P1', 'P2', 'P3']).optional(),
  impactScope: z.string().optional(),
  submitter: z.string().optional(),
  search: z.string().optional(),
  view: z.enum(['all', 'mine', 'pending_takeover', 'processing', 'transferred_to_me', 'reported_by_me']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const TakeOverSchema = z.object({
  handlerType: z.enum(['duty', 'engineer']).default('duty'),
  engineerType: z.enum(['network', 'dba', 'system', 'security']).optional(),
  engineerEmail: z.string().email().optional(),
  comment: z.string().max(1000).optional(),
});

const TransferSchema = z.object({
  toEngineerType: z.enum(['network', 'dba', 'system', 'security']),
  toEngineerEmail: z.string().email(),
  reason: z.string().min(5).max(1000),
});

const AddTimelineSchema = z.object({
  content: z.string().min(1).max(2000),
  isInternal: z.boolean().default(false),
  attachmentIds: z.array(z.string().uuid()).max(5).default([]),
});

const MarkResolvedSchema = z.object({
  resolution: z.string().min(5).max(2000),
  requireUserConfirm: z.boolean().default(true),
  comment: z.string().max(1000).optional(),
});

const RejectSchema = z.object({
  reason: z.string().min(5).max(2000),
});

const ForceCloseSchema = z.object({
  reason: z.string().min(10).max(2000),
});

// ============================================================
// Plugin
// ============================================================
export const incidentRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {

  // ============= LIST =============
  app.get('/', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req) => {
    const parsed = ListIncidentsQuerySchema.safeParse(req.query);
    if (!parsed.success) throw createHttpError.BadRequest(JSON.stringify(parsed.error.flatten()));
    const q = parsed.data;
    const user = req.currentUser!;
    const where: Prisma.IncidentWhereInput = {};

    if (q.view === 'mine') {
      where.OR = [
        { submitterEmail: user.email },
        { dutyEngineerEmail: user.email },
        { assignedEngineerEmail: user.email },
      ];
    } else if (q.view === 'pending_takeover') {
      where.status = 'pending_takeover';
    } else if (q.view === 'processing') {
      where.status = 'processing';
      where.dutyEngineerEmail = user.email;
    } else if (q.view === 'transferred_to_me') {
      where.status = 'transferred';
      where.assignedEngineerEmail = user.email;
    } else if (q.view === 'reported_by_me') {
      where.submitterEmail = user.email;
    }

    // role-based: viewer can only see own
    if (user.role === 'viewer' && !where.OR && !where.submitterEmail) {
      where.submitterEmail = user.email;
    }

    if (q.status && q.status !== 'all') where.status = q.status as Prisma.IncidentWhereInput['status'];
    if (q.type) where.type = q.type as Prisma.IncidentWhereInput['type'];
    if (q.urgency) where.urgency = q.urgency;
    if (q.impactScope) where.impactScope = q.impactScope as Prisma.IncidentWhereInput['impactScope'];
    if (q.submitter) where.submitterEmail = q.submitter;
    if (q.search) {
      where.OR = [
        { title: { contains: q.search, mode: 'insensitive' } },
        { description: { contains: q.search, mode: 'insensitive' } },
        { incidentNo: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      app.prisma.incident.findMany({
        where,
        orderBy: [{ urgency: 'asc' }, { createdAt: 'desc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      app.prisma.incident.count({ where }),
    ]);

    // Annotate minutes_remaining
    const annotated = items.map((i) => ({
      ...i,
      minutesRemaining: Math.round((i.slaCloseAt.getTime() - Date.now()) / 60000),
    }));

    return {
      data: annotated,
      pagination: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: Math.ceil(total / q.pageSize),
      },
    };
  });

  // ============= CREATE =============
  app.post('/', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req, reply) => {
    const parsed = CreateIncidentSchema.safeParse(req.body);
    if (!parsed.success) throw createHttpError.BadRequest(JSON.stringify(parsed.error.flatten()));
    const data = parsed.data;
    const user = req.currentUser!;

    // business rule: impact_scope = fab → urgency = P1
    const finalUrgency = data.impactScope === 'fab' ? 'P1' : data.urgency;

    const sla = await computeSla(app.prisma, data.type, finalUrgency);
    if (!sla) throw createHttpError.InternalServerError(`SLA config missing for ${data.type}/${finalUrgency}`);

    const now = new Date();
    const slaCloseAt = new Date(now.getTime() + sla.closeMinutes * 60000);
    const slaResponseAt = sla.responseMinutes ? new Date(now.getTime() + sla.responseMinutes * 60000) : null;
    const incidentNo = await nextIncidentNo(app.prisma);

    const result = await app.prisma.$transaction(async (tx) => {
      const incident = await tx.incident.create({
        data: {
          incidentNo,
          title: data.title,
          description: data.description,
          type: data.type,
          urgency: finalUrgency,
          impactScope: data.impactScope,
          relatedSystem: data.relatedSystem ?? null,
          attachmentIds: data.attachmentIds,
          relatedRequestId: data.relatedRequestId ?? null,
          submitterEmail: user.email,
          submitterDept: user.department,
          submitterName: user.name,
          slaCloseAt,
          slaResponseAt,
        },
      });
      await tx.incidentTimeline.create({
        data: {
          incidentId: incident.id,
          entryType: 'action',
          action: 'create',
          actorEmail: user.email,
          actorName: user.name,
          actorRole: user.role,
          fromStatus: null,
          toStatus: 'pending_takeover',
          metadata: { incidentNo } as Prisma.InputJsonValue,
        },
      });
      return incident;
    });

    // ── 通知提交人（fire-and-forget）───────────────────────────
    app.mdm.sendNotification({
      toEmails: [user.email],
      notificationType: 'incident_created',
      title: `事件 ${result.incidentNo} 已提交，正在等待处理`,
      body: `您的事件"${data.title}"（${result.incidentNo}）已成功提交，处理人将尽快接单。SLA响应时间：${sla!.responseMinutes ?? 'N/A'}分钟。`,
      metadata: { incidentNo: result.incidentNo, action: 'incident_created', status: 'pending_takeover' },
    }).catch((err: unknown) => {
      app.log.error({ err, incidentNo: result.incidentNo }, 'Failed to send incident_created notification');
    });

    // ── WS 广播：新事件通知所有在线用户 ────────────────────────
    app.ws.broadcast('incident:created', {
      incidentNo: result.incidentNo,
      id: result.id,
      title: data.title,
      urgency: result.urgency,
      status: result.status,
      submitterEmail: user.email,
    });

    // ── 跨系统审计（S4-3）────────────────────────────────
    app.mdm.auditEvent({
      action: 'incident.create',
      actorEmail: user.email,
      actorName: user.name,
      targetEmail: user.email,
      targetType: 'incident',
      targetId: result.incidentNo,
      metadata: { incidentId: result.id, urgency: result.urgency, status: 'pending_takeover' },
    });

    return reply.code(201).send({
      id: result.id,
      incidentNo: result.incidentNo,
      status: result.status,
      slaResponseAt: result.slaResponseAt,
      slaCloseAt: result.slaCloseAt,
      createdAt: result.createdAt,
    });
  });

  // ============= DETAIL =============
  app.get<{ Params: { id: string } }>('/:id', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req) => {
    const inc = await app.prisma.incident.findUnique({
      where: { id: req.params.id },
    });
    if (!inc) throw createHttpError.NotFound('Incident not found');
    const user = req.currentUser!;
    if (!canView(user, inc)) throw createHttpError.Forbidden('No access to this incident');

    const [timelineCount, escalationCount] = await Promise.all([
      app.prisma.incidentTimeline.count({ where: { incidentId: inc.id } }),
      app.prisma.incidentEscalation.count({ where: { incidentId: inc.id } }),
    ]);
    return {
      ...inc,
      minutesRemaining: Math.round((inc.slaCloseAt.getTime() - Date.now()) / 60000),
      timelineCount,
      escalationCount,
    };
  });

  // ============= TIMELINE =============
  app.get<{ Params: { id: string }; Querystring: { page?: number; pageSize?: number; includeInternal?: string } }>('/:id/timeline', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req) => {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 50)));
    const user = req.currentUser!;
    const where: Prisma.IncidentTimelineWhereInput = { incidentId: req.params.id };
    if (user.role === 'viewer' && req.query.includeInternal !== 'true') {
      where.isInternal = false;
    }
    const [items, total] = await Promise.all([
      app.prisma.incidentTimeline.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      app.prisma.incidentTimeline.count({ where }),
    ]);
    return {
      data: items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  });

  // ============= TAKE OVER =============
  app.post<{ Params: { id: string } }>('/:id/take-over', { onRequest: async (req) => { app.auth(req); } },
    async (req) => {
      const parsed = TakeOverSchema.safeParse(req.body);
      if (!parsed.success) throw createHttpError.BadRequest(JSON.stringify(parsed.error.flatten()));
      const user = req.currentUser!;
      requireDutyOrAbove(user);

      // Atomic: only take over if status=pending_takeover
      const updateData: Prisma.IncidentUpdateInput = {
        dutyEngineerEmail: user.email,
        dutyEngineerName: user.name,
      };
      if (parsed.data.handlerType === 'engineer' && parsed.data.engineerType && parsed.data.engineerEmail) {
        const eng = await app.prisma.engineerMember.findUnique({ where: { engineerEmail: parsed.data.engineerEmail } });
        if (!eng) throw createHttpError.NotFound('Engineer not found');
        if (eng.engineerType !== parsed.data.engineerType) throw createHttpError.BadRequest('engineer_type mismatch');
        if (!eng.isActive || !eng.isAvailable) throw createHttpError.Conflict('Engineer not available');
        updateData.assignedEngineerEmail = eng.engineerEmail;
        updateData.assignedEngineerName = eng.engineerName;
        updateData.assignedEngineerType = eng.engineerType as 'network' | 'dba' | 'system' | 'security';
        updateData.status = 'transferred';
        await app.prisma.engineerMember.update({
          where: { engineerEmail: eng.engineerEmail },
          data: { currentLoad: { increment: 1 } },
        });
      } else {
        updateData.status = 'processing';
      }

      const updated = await app.prisma.$transaction(async (tx) => {
        const inc = await tx.incident.updateMany({
          where: { id: req.params.id, status: 'pending_takeover' },
          data: updateData,
        });
        if (inc.count === 0) throw createHttpError.Conflict('Already taken over');
        const full = await tx.incident.findUniqueOrThrow({ where: { id: req.params.id } });
        await tx.incidentTimeline.create({
          data: {
            incidentId: full.id,
            entryType: 'action',
            action: 'take_over',
            actorEmail: user.email,
            actorName: user.name,
            actorRole: user.role,
            fromStatus: 'pending_takeover',
            toStatus: full.status,
            content: parsed.data.comment,
            transferToType: parsed.data.engineerType ?? null,
            transferToEmail: parsed.data.engineerEmail ?? null,
          },
        });
        return full;
      });

      // ── 通知提交人：已有人接单（fire-and-forget）────────────────
      app.mdm.sendNotification({
        toEmails: [updated.submitterEmail],
        notificationType: 'system_alert',
        title: `事件 ${updated.incidentNo} 已有人接单`,
        body: `事件"${updated.title}"（${updated.incidentNo}）已由 ${updated.dutyEngineerName ?? updated.dutyEngineerEmail} 接单处理，请耐心等待。`,
        metadata: { incidentNo: updated.incidentNo, action: 'take_over', dutyEngineerEmail: updated.dutyEngineerEmail },
      }).catch((err: unknown) => {
        app.log.error({ err, incidentNo: updated.incidentNo }, 'Failed to send take-over notification');
      });

      // ── WS 广播：事件已接单 ────────────────────────────────
      app.ws.broadcast('incident:updated', {
        incidentNo: updated.incidentNo,
        id: updated.id,
        status: updated.status,
        action: 'take_over',
        actorEmail: user.email,
      });

      // ── 跨系统审计（S4-3）────────────────────────────────
      app.mdm.auditEvent({
        action: 'incident.take_over',
        actorEmail: user.email,
        actorName: user.name,
        targetEmail: updated.submitterEmail,
        targetType: 'incident',
        targetId: updated.incidentNo,
        metadata: { incidentId: updated.id, fromStatus: 'pending_takeover', toStatus: updated.status },
      });

      return {
        id: updated.id,
        status: updated.status,
        assignedEngineerEmail: updated.assignedEngineerEmail,
        assignedEngineerType: updated.assignedEngineerType,
        dutyEngineerEmail: updated.dutyEngineerEmail,
      };
    });

  // ============= TRANSFER =============
  app.post<{ Params: { id: string } }>('/:id/transfer', { onRequest: async (req) => { app.auth(req); } },
    async (req) => {
      const parsed = TransferSchema.safeParse(req.body);
      if (!parsed.success) throw createHttpError.BadRequest(JSON.stringify(parsed.error.flatten()));
      const user = req.currentUser!;
      requireDutyOrAbove(user);
      const inc = await app.prisma.incident.findUnique({ where: { id: req.params.id } });
      if (!inc) throw createHttpError.NotFound('Incident not found');
      if (inc.status !== 'processing' && inc.status !== 'transferred') {
        throw createHttpError.Conflict('Invalid status for transfer');
      }
      if (user.email === parsed.data.toEngineerEmail) {
        throw createHttpError.BadRequest('Cannot transfer to yourself');
      }
      const eng = await app.prisma.engineerMember.findUnique({ where: { engineerEmail: parsed.data.toEngineerEmail } });
      if (!eng || eng.engineerType !== parsed.data.toEngineerType || !eng.isActive || !eng.isAvailable) {
        throw createHttpError.Conflict('Target engineer not available');
      }

      const oldAssignee = inc.assignedEngineerEmail;
      const updated = await app.prisma.$transaction(async (tx) => {
        const u = await tx.incident.update({
          where: { id: inc.id },
          data: {
            status: 'transferred',
            assignedEngineerEmail: eng.engineerEmail,
            assignedEngineerName: eng.engineerName,
            assignedEngineerType: eng.engineerType as 'network' | 'dba' | 'system' | 'security',
          },
        });
        await tx.incidentTimeline.create({
          data: {
            incidentId: u.id,
            entryType: 'action',
            action: 'transfer',
            actorEmail: user.email,
            actorName: user.name,
            actorRole: user.role,
            fromStatus: inc.status,
            toStatus: 'transferred',
            content: parsed.data.reason,
            transferToType: eng.engineerType,
            transferToEmail: eng.engineerEmail,
            transferToName: eng.engineerName,
          },
        });
        // Update engineer loads
        if (oldAssignee) {
          await tx.engineerMember.updateMany({
            where: { engineerEmail: oldAssignee },
            data: { currentLoad: { decrement: 1 } },
          }).catch(() => null);
        }
        await tx.engineerMember.update({
          where: { engineerEmail: eng.engineerEmail },
          data: { currentLoad: { increment: 1 } },
        });
        return u;
      });

      // ── 通知被转派的工程师 ───────────────────────────────────
      app.mdm.sendNotification({
        toEmails: [eng.engineerEmail],
        notificationType: 'system_alert',
        title: `事件 ${updated.incidentNo} 已转派给您`,
        body: `事件"${updated.title}"（${updated.incidentNo}）已被 ${user.email} 转派给您处理。原因：${parsed.data.reason}`,
        metadata: { incidentNo: updated.incidentNo, action: 'transfer', newEngineerEmail: eng.engineerEmail },
      }).catch((err: unknown) => {
        app.log.error({ err, incidentNo: updated.incidentNo }, 'Failed to send transfer notification');
      });

      // ── WS 广播：事件已转派 ────────────────────────────────
      app.ws.broadcast('incident:updated', {
        incidentNo: updated.incidentNo,
        id: updated.id,
        status: updated.status,
        action: 'transfer',
        actorEmail: user.email,
      });

      return {
        id: updated.id,
        status: updated.status,
        assignedEngineerEmail: updated.assignedEngineerEmail,
        assignedEngineerType: updated.assignedEngineerType,
      };
    });

  // ============= ADD TIMELINE (note/comment/process) =============
  app.post<{ Params: { id: string } }>('/:id/timeline', { onRequest: async (req) => { app.auth(req); } },
    async (req, reply) => {
      const parsed = AddTimelineSchema.safeParse(req.body);
      if (!parsed.success) throw createHttpError.BadRequest(JSON.stringify(parsed.error.flatten()));
      const user = req.currentUser!;
      const inc = await app.prisma.incident.findUnique({ where: { id: req.params.id } });
      if (!inc) throw createHttpError.NotFound('Incident not found');
      if (user.email !== inc.dutyEngineerEmail && user.email !== inc.assignedEngineerEmail && !['admin', 'auditor'].includes(user.role)) {
        throw createHttpError.Forbidden('Only current handler can add timeline');
      }
      const entry = await app.prisma.incidentTimeline.create({
        data: {
          incidentId: inc.id,
          entryType: 'note',
          action: parsed.data.isInternal ? 'comment' : 'process',
          actorEmail: user.email,
          actorName: user.name,
          actorRole: user.role,
          content: parsed.data.content,
          isInternal: parsed.data.isInternal,
          attachmentIds: parsed.data.attachmentIds,
        },
      });
      return reply.code(201).send(entry);
    });

  // ============= MARK RESOLVED =============
  app.post<{ Params: { id: string } }>('/:id/mark-resolved', { onRequest: async (req) => { app.auth(req); } },
    async (req) => {
      const parsed = MarkResolvedSchema.safeParse(req.body);
      if (!parsed.success) throw createHttpError.BadRequest(JSON.stringify(parsed.error.flatten()));
      const user = req.currentUser!;
      const inc = await app.prisma.incident.findUnique({ where: { id: req.params.id } });
      if (!inc) throw createHttpError.NotFound('Incident not found');
      if (inc.status !== 'processing' && inc.status !== 'transferred') {
        throw createHttpError.Conflict('Invalid status for mark-resolved');
      }
      const isHandler = user.email === inc.dutyEngineerEmail || user.email === inc.assignedEngineerEmail;
      if (!isHandler) requireAdmin(user); // non-handler must be admin to override
      const requireConfirm = parsed.data.requireUserConfirm;
      const targetStatus = requireConfirm ? 'pending_confirm' : 'closed';
      const isClosing = targetStatus === 'closed';
      const now = new Date();

      const updated = await app.prisma.$transaction(async (tx) => {
        const u = await tx.incident.update({
          where: { id: inc.id },
          data: {
            status: targetStatus,
            resolution: parsed.data.resolution,
            closedAt: isClosing ? now : null,
            closedByEmail: isClosing ? user.email : null,
            ...(isClosing ? { closeReason: null } : {}),
          },
        });
        await tx.incidentTimeline.create({
          data: {
            incidentId: u.id,
            entryType: 'action',
            action: isClosing ? 'close' : 'mark_resolved',
            actorEmail: user.email,
            actorName: user.name,
            actorRole: user.role,
            content: parsed.data.resolution,
            fromStatus: inc.status,
            toStatus: targetStatus,
            metadata: { requireUserConfirm: requireConfirm } as Prisma.InputJsonValue,
          },
        });
        // Cleanup engineer load if closing
        if (isClosing && u.assignedEngineerEmail) {
          await tx.engineerMember.updateMany({
            where: { engineerEmail: u.assignedEngineerEmail },
            data: { currentLoad: { decrement: 1 } },
          }).catch(() => null);
        }
        return u;
      });

      // ── 通知提交人：处理结果 ─────────────────────────────────
      if (requireConfirm) {
        app.mdm.sendNotification({
          toEmails: [inc.submitterEmail],
          notificationType: 'system_alert',
          title: `事件 ${inc.incidentNo} 已修复，请确认`,
          body: `事件"${inc.title}"（${inc.incidentNo}）已被标记为已修复：${parsed.data.resolution}。请确认问题是否已解决。`,
          metadata: { incidentNo: inc.incidentNo, action: 'mark_resolved', resolution: parsed.data.resolution },
        }).catch((err: unknown) => {
          app.log.error({ err, incidentNo: inc.incidentNo }, 'Failed to send mark-resolved notification');
        });

        // ── WS 广播：事件已修复待确认 ──────────────────────
        app.ws.broadcast('incident:updated', {
          incidentNo: inc.incidentNo,
          id: updated.id,
          status: updated.status,
          action: 'mark_resolved',
          actorEmail: user.email,
        });
      }

      // ── 跨系统审计（S4-3）────────────────────────────────
      app.mdm.auditEvent({
        action: 'incident.mark_resolved',
        actorEmail: user.email,
        actorName: user.name,
        targetEmail: updated.submitterEmail,
        targetType: 'incident',
        targetId: updated.incidentNo,
        metadata: { incidentId: updated.id, fromStatus: inc.status, toStatus: updated.status, resolution: parsed.data.resolution },
      });

      return {
        id: updated.id,
        status: updated.status,
        resolution: updated.resolution,
        closedAt: updated.closedAt,
      };
    });

  // ============= USER CONFIRM =============
  app.post<{ Params: { id: string } }>('/:id/confirm', { onRequest: async (req) => { app.auth(req); } },
    async (req) => {
      const user = req.currentUser!;
      const inc = await app.prisma.incident.findUnique({ where: { id: req.params.id } });
      if (!inc) throw createHttpError.NotFound('Incident not found');
      if (inc.status !== 'pending_confirm') throw createHttpError.Conflict('Invalid status for confirm');
      if (inc.submitterEmail !== user.email) throw createHttpError.Forbidden('Only submitter can confirm');
      const now = new Date();
      const updated = await app.prisma.$transaction(async (tx) => {
        const u = await tx.incident.update({
          where: { id: inc.id },
          data: {
            status: 'closed',
            closedAt: now,
            closedByEmail: user.email,
          },
        });
        await tx.incidentTimeline.create({
          data: {
            incidentId: u.id,
            entryType: 'action',
            action: 'user_confirm',
            actorEmail: user.email,
            actorName: user.name,
            actorRole: user.role,
            fromStatus: 'pending_confirm',
            toStatus: 'closed',
          },
        });
        if (u.assignedEngineerEmail) {
          await tx.engineerMember.updateMany({
            where: { engineerEmail: u.assignedEngineerEmail },
            data: { currentLoad: { decrement: 1 } },
          }).catch(() => null);
        }
        return u;
      });

      // ── 通知工程师：用户已确认关闭 ────────────────────────────
      if (updated.assignedEngineerEmail) {
        app.mdm.sendNotification({
          toEmails: [updated.assignedEngineerEmail],
          notificationType: 'system_alert',
          title: `事件 ${inc.incidentNo} 用户已确认关闭`,
          body: `事件"${inc.title}"（${inc.incidentNo}）已由提交人 ${user.email} 确认关闭，总处理时长：${Math.round((now.getTime() - inc.createdAt.getTime()) / 60000)} 分钟。`,
          metadata: { incidentNo: inc.incidentNo, action: 'user_confirm', closedBy: user.email },
        }).catch((err: unknown) => {
          app.log.error({ err, incidentNo: inc.incidentNo }, 'Failed to send user_confirm notification');
        });

        // ── WS 广播：事件已确认关闭 ────────────────────────
        app.ws.broadcast('incident:updated', {
          incidentNo: inc.incidentNo,
          id: updated.id,
          status: updated.status,
          action: 'user_confirm',
          actorEmail: user.email,
        });
      }

      // ── 跨系统审计（S4-3）────────────────────────────────
      app.mdm.auditEvent({
        action: 'incident.confirm',
        actorEmail: user.email,
        actorName: user.name,
        targetEmail: updated.assignedEngineerEmail ?? undefined,
        targetType: 'incident',
        targetId: updated.incidentNo,
        metadata: { incidentId: updated.id, fromStatus: 'pending_confirm', toStatus: 'closed' },
      });

      return {
        id: updated.id,
        status: updated.status,
        closedAt: updated.closedAt,
        totalDurationMinutes: Math.round((now.getTime() - inc.createdAt.getTime()) / 60000),
      };
    });
  // ============= USER REJECT =============
  app.post<{ Params: { id: string } }>('/:id/reject', { onRequest: async (req) => { app.auth(req); } },
    async (req) => {
      const parsed = RejectSchema.safeParse(req.body);
      if (!parsed.success) throw createHttpError.BadRequest(JSON.stringify(parsed.error.flatten()));
      const user = req.currentUser!;
      const inc = await app.prisma.incident.findUnique({ where: { id: req.params.id } });
      if (!inc) throw createHttpError.NotFound('Incident not found');
      if (inc.status !== 'pending_confirm') throw createHttpError.Conflict('Invalid status for reject');
      if (inc.submitterEmail !== user.email) throw createHttpError.Forbidden('Only submitter can reject');
      const targetStatus = inc.assignedEngineerEmail ? 'transferred' : 'processing';
      const newRejectCount = (inc.rejectCount ?? 0) + 1;
      const updated = await app.prisma.$transaction(async (tx) => {
        const u = await tx.incident.update({
          where: { id: inc.id },
          data: {
            status: targetStatus,
            rejectCount: newRejectCount,
            closedAt: null,
            closedByEmail: null,
            closeReason: null,
          },
        });
        await tx.incidentTimeline.create({
          data: {
            incidentId: u.id,
            entryType: 'action',
            action: 'user_reject',
            actorEmail: user.email,
            actorName: user.name,
            actorRole: user.role,
            content: parsed.data.reason,
            fromStatus: 'pending_confirm',
            toStatus: targetStatus,
            metadata: { rejectCount: newRejectCount } as Prisma.InputJsonValue,
          },
        });
        return u;
      });

      // ── 通知工程师：用户拒绝解决方案 ─────────────────────────
      if (updated.assignedEngineerEmail) {
        app.mdm.sendNotification({
          toEmails: [updated.assignedEngineerEmail],
          notificationType: 'system_alert',
          title: `事件 ${inc.incidentNo} 解决方案被拒绝`,
          body: `事件"${inc.title}"（${inc.incidentNo}）的解决方案被 ${user.email} 拒绝。原因：${parsed.data.reason}。请重新处理。`,
          metadata: { incidentNo: inc.incidentNo, action: 'user_reject', rejectBy: user.email },
        }).catch((err: unknown) => {
          app.log.error({ err, incidentNo: inc.incidentNo }, 'Failed to send user_reject notification');
        });

        // ── WS 广播：解决方案被拒绝 ────────────────────────
        app.ws.broadcast('incident:updated', {
          incidentNo: inc.incidentNo,
          id: updated.id,
          status: updated.status,
          action: 'user_reject',
          actorEmail: user.email,
        });
      }

      // ── 跨系统审计（S4-3）────────────────────────────────
      app.mdm.auditEvent({
        action: 'incident.reject',
        actorEmail: user.email,
        actorName: user.name,
        targetEmail: updated.assignedEngineerEmail ?? undefined,
        targetType: 'incident',
        targetId: updated.incidentNo,
        metadata: { incidentId: updated.id, fromStatus: 'pending_confirm', toStatus: targetStatus, rejectCount: newRejectCount },
      });

      return { id: updated.id, status: updated.status, rejectCount: updated.rejectCount };
    });

  // ============= FORCE CLOSE =============
  app.post<{ Params: { id: string } }>('/:id/force-close', { onRequest: async (req) => { app.auth(req); } },
    async (req) => {
      const parsed = ForceCloseSchema.safeParse(req.body);
      if (!parsed.success) throw createHttpError.BadRequest(JSON.stringify(parsed.error.flatten()));
      const user = req.currentUser!;
      // auditor+ OR cimims:incident:admin grant
      try {
        requireAuditor(user);
      } catch {
        const grants = await checkResourcePermission(
          app.mdm, user, 'cimims', 'incident', 'admin', req.params.id,
          (msg: string, meta?: Record<string, unknown>) => req.log.info(meta ?? {}, msg),
        );
        if (grants.length === 0) throw createHttpError.Forbidden('需要 auditor+ 角色或 cimims:incident:admin 资源级权限');
      }
      const inc = await app.prisma.incident.findUnique({ where: { id: req.params.id } });
      if (!inc) throw createHttpError.NotFound('Incident not found');
      if (inc.status !== 'pending_confirm') throw createHttpError.Conflict('Invalid status for force-close');
      const now = new Date();
      const updated = await app.prisma.$transaction(async (tx) => {
        const u = await tx.incident.update({
          where: { id: inc.id },
          data: {
            status: 'closed',
            closedAt: now,
            closedByEmail: user.email,
            closeReason: parsed.data.reason,
          },
        });
        await tx.incidentTimeline.create({
          data: {
            incidentId: u.id,
            entryType: 'action',
            action: 'force_close',
            actorEmail: user.email,
            actorName: user.name,
            actorRole: user.role,
            content: parsed.data.reason,
            fromStatus: 'pending_confirm',
            toStatus: 'closed',
            metadata: { force: true } as Prisma.InputJsonValue,
          },
        });
        await tx.auditLog.create({
          data: {
            incidentId: u.id,
            eventType: 'force_close',
            actorEmail: user.email,
            actorName: user.name,
            actorRole: user.role,
            afterSnapshot: { status: 'closed', closeReason: parsed.data.reason } as Prisma.InputJsonValue,
          },
        });
        if (u.assignedEngineerEmail) {
          await tx.engineerMember.updateMany({
            where: { engineerEmail: u.assignedEngineerEmail },
            data: { currentLoad: { decrement: 1 } },
          }).catch(() => null);
        }
        return u;
      });
      // ── 跨系统审计（S4-3）────────────────────────────────
      app.mdm.auditEvent({
        action: 'incident.force_close',
        actorEmail: user.email,
        actorName: user.name,
        targetEmail: updated.assignedEngineerEmail ?? undefined,
        targetType: 'incident',
        targetId: updated.incidentNo,
        metadata: { incidentId: updated.id, fromStatus: 'pending_confirm', toStatus: 'closed', reason: parsed.data.reason },
      });

      return {
        id: updated.id,
        status: updated.status,
        closedAt: updated.closedAt,
        closedByEmail: updated.closedByEmail,
        closeReason: updated.closeReason,
      };
    });

  // ============= AUDIT LOG =============
  app.get<{ Params: { id: string } }>('/:id/audit', { onRequest: async (req) => { app.auth(req); } },
    async (req) => {
      const user = req.currentUser!;
      // auditor+ OR cimims:incident:audit grant
      try {
        requireAuditor(user);
      } catch {
        const grants = await checkResourcePermission(
          app.mdm, user, 'cimims', 'incident', 'audit', req.params.id,
          (msg: string, meta?: Record<string, unknown>) => req.log.info(meta ?? {}, msg),
        );
        if (grants.length === 0) throw createHttpError.Forbidden('需要 auditor+ 角色或 cimims:incident:audit 资源级权限');
      }
      const items = await app.prisma.auditLog.findMany({
        where: { incidentId: req.params.id },
        orderBy: { createdAt: 'desc' },
      });
      return { data: items };
    });
};

// ============================================================
// Helpers
// ============================================================
function canView(
  user: { email: string; role: string },
  inc: { submitterEmail: string; dutyEngineerEmail: string | null; assignedEngineerEmail: string | null },
): boolean {
  if (['admin', 'auditor', 'duty'].includes(user.role)) return true;
  if (user.email === inc.submitterEmail) return true;
  if (user.email === inc.dutyEngineerEmail) return true;
  if (user.email === inc.assignedEngineerEmail) return true;
  return false;
}
