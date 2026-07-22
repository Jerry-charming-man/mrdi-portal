/**
 * Request routes — 核心
 *
 * GET    /v1/requests              — list with view filter
 * POST   /v1/requests              — create
 * GET    /v1/requests/:id          — detail with availableActions
 * GET    /v1/requests/:id/events   — event timeline
 * POST   /v1/requests/:id/approve  — manager approve  ★ auditor+
 * POST   /v1/requests/:id/reject   — manager reject   ★ auditor+
 * POST   /v1/requests/:id/resubmit                   ★ submitter
 * POST   /v1/requests/:id/schedule                   ★ editor+
 * POST   /v1/requests/:id/dev-start                  ★ assignee/admin
 * POST   /v1/requests/:id/dev-complete                ★ assignee/admin
 * POST   /v1/requests/:id/uat-pass                   ★ submitter
 * POST   /v1/requests/:id/uat-fail                   ★ submitter
 * POST   /v1/requests/:id/deploy                     ★ assignee/admin
 * POST   /v1/requests/:id/accept                     ★ submitter
 * POST   /v1/requests/:id/reject-acceptance          ★ submitter
 * POST   /v1/requests/:id/comment                     ★ viewer+
 * POST   /v1/requests/:id/escalate                   ★ editor+
 */
import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Prisma } from '@prisma/client';
import createHttpError from 'http-errors';
import {
  requireAdmin,
  requireAuditor,
  requireEditor,
  checkResourcePermission,
} from '@mrdi/shared/permission';
import {
  nextRequestNo,
  computeSlaPercent,
  computeAvailableActions,
  getTransition,
  loadSlaConfigs,
} from '../services/requestService.js';
import { templates } from '../plugins/teamsNotify.js';

// ============================================================
// Schemas
// ============================================================
const CreateRequestSchema = z.object({
  title: z.string().min(2).max(200),
  type: z.enum(['feature', 'config', 'report', 'integration', 'other']),
  urgency: z.enum(['P1', 'P2', 'P3']),
  relatedSystem: z.string().max(50).optional(),
  description: z.string().min(10).max(5000),
  attachmentIds: z.array(z.string().uuid()).default([]),
  relatedIncidentId: z.string().max(32).optional(),
  expectedCompletion: z.string().optional(),
});

const ListRequestsQuerySchema = z.object({
  status: z.string().optional(),
  urgency: z.enum(['P1', 'P2', 'P3']).optional(),
  type: z.enum(['feature', 'config', 'report', 'integration', 'other']).optional(),
  submitter: z.string().optional(),
  assignee: z.string().optional(),
  team: z.string().optional(),
  search: z.string().optional(),
  view: z.enum(['all', 'mine', 'pending_approval', 'pending_action', 'submitted_by_me']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const TransitionBodySchema = z.object({
  comment: z.string().max(2000).optional(),
});

const ScheduleBodySchema = z.object({
  team: z.string().min(1).max(50),
  estimatedDeployAt: z.string().min(1),
  assigneeEmail: z.string().email(),
  comment: z.string().max(2000).optional(),
});

const CommentBodySchema = z.object({
  comment: z.string().min(1).max(2000),
  attachmentIds: z.array(z.string().uuid()).default([]),
});

const EscalateBodySchema = z.object({
  reason: z.string().min(1).max(1000),
  escalateToEmail: z.string().email(),
});

// ============================================================
// Plugin
// ============================================================
export const requestRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {

  // ============================================================
  // LIST
  // ============================================================
  app.get('/', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req) => {
    const parsed = ListRequestsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw createHttpError.BadRequest(JSON.stringify(parsed.error.flatten()));
    }
    const q = parsed.data;
    const user = req.currentUser!;
    const where: Prisma.RequestWhereInput = { deletedAt: null };

    // view filter
    if (q.view === 'mine' || q.view === 'submitted_by_me') {
      where.submitterEmail = user.email;
    } else if (q.view === 'pending_approval') {
      where.status = 'pending_manager';
    } else if (q.view === 'pending_action') {
      where.OR = [
        { assigneeEmail: user.email },
        { submitterEmail: user.email },
      ];
    }

    // role-based: viewer can only see own
    if (user.role === 'viewer' && !where.submitterEmail) {
      where.submitterEmail = user.email;
    }

    if (q.status) where.status = q.status as Prisma.RequestWhereInput['status'];
    if (q.urgency) where.urgency = q.urgency;
    if (q.type) where.type = q.type;
    if (q.submitter) where.submitterEmail = q.submitter;
    if (q.assignee) where.assigneeEmail = q.assignee;
    if (q.team) where.team = q.team;
    if (q.search) {
      where.OR = [
        { title: { contains: q.search, mode: 'insensitive' } },
        { requestNo: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    const [items, total, slaMap] = await Promise.all([
      app.prisma.request.findMany({
        where,
        orderBy: [{ urgency: 'asc' }, { createdAt: 'desc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      app.prisma.request.count({ where }),
      loadSlaConfigs(app.prisma),
    ]);

    // Add computed slaPercent (no N+1 — all configs pre-loaded)
    const itemsWithSla = await Promise.all(items.map(async (r) => ({
      ...r,
      slaPercent: await computeSlaPercent(app.prisma, r.status, r.statusEnteredAt, r.urgency, slaMap),
    })));

    return {
      items: itemsWithSla,
      pagination: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: Math.ceil(total / q.pageSize),
      },
    };
  });

  // ============================================================
  // CREATE
  // ============================================================
  app.post('/', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req, reply) => {
    const parsed = CreateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createHttpError.BadRequest(JSON.stringify(parsed.error.flatten()));
    }
    const data = parsed.data;
    const user = req.currentUser!;

    const requestNo = await nextRequestNo(app.prisma);

    const result = await app.prisma.$transaction(async (tx) => {
      const request = await tx.request.create({
        data: {
          requestNo,
          title: data.title,
          type: data.type,
          urgency: data.urgency,
          relatedSystem: data.relatedSystem ?? null,
          description: data.description,
          attachmentIds: data.attachmentIds,
          relatedIncidentId: data.relatedIncidentId ?? null,
          expectedCompletion: data.expectedCompletion ? new Date(data.expectedCompletion) : null,
          status: 'pending_manager',
          submitterEmail: user.email,
          submitterDept: user.department,
        },
      });
      await tx.requestEvent.create({
        data: {
          requestId: request.id,
          eventType: 'state_change',
          fromStatus: 'submitted',
          toStatus: 'pending_manager',
          actorEmail: user.email,
          actorRole: user.role as 'viewer' | 'editor' | 'auditor' | 'admin' | 'system',
        },
      });
      await tx.auditLog.create({
        data: {
          actorEmail: user.email,
          actorRole: user.role as 'viewer' | 'editor' | 'auditor' | 'admin' | 'system',
          action: 'request.create',
          resourceType: 'request',
          resourceId: request.id,
          requestId: request.id,
          payload: data as unknown as Prisma.InputJsonValue,
        },
      });
      return request;
    });

    // ── 通知提交人 ──────────────────────────────────────────────────
    app.mdm.sendNotification({
      toEmails: [user.email],
      notificationType: 'system_alert',
      title: `需求 ${result.requestNo} 已提交，等待经理审批`,
      body: `您的需求"${data.title}"已成功提交，编号 ${result.requestNo}，当前状态：待经理审批。`,
      metadata: { requestNo: result.requestNo, action: 'request_submitted', status: 'pending_manager' },
    }).catch((err: unknown) => {
      app.log.error({ err, requestNo: result.requestNo }, 'Failed to send request_submitted notification');
    });

    // ── WS 广播：新需求通知所有在线用户 ─────────────────────────────
    app.ws.broadcast('request:created', {
      requestNo: result.requestNo,
      id: result.id,
      title: data.title,
      urgency: data.urgency,
      status: result.status,
      submitterEmail: user.email,
    });

    // ── Teams Notify：发审批卡片给配置的 approver ─────────────────────
    const approverEmails = (app.teamsNotifyApproverEmails ?? []).filter(e => e !== user.email);
    if (approverEmails.length > 0) {
      const approveCallbackUrl = `${app.teamsNotifyCallbackBase}/v1/requests/${result.id}/approve`;
      const rejectCallbackUrl = `${app.teamsNotifyCallbackBase}/v1/requests/${result.id}/reject`;
      const card = templates.approvalCard({
        requestNo: result.requestNo,
        title: data.title,
        urgency: data.urgency,
        type: data.type,
        submitterEmail: user.email,
        submitterName: user.name,
        description: data.description,
        currentStatus: 'pending_manager',
        callbackUrl: approveCallbackUrl,
        eventId: `cimrms-${result.id}-approval`,
        priority: data.urgency === 'P1' ? 'high' : 'normal',
      });
      // Fix card: reject button uses same card but different action
      if (card.actions) {
        (card.actions as Record<string, unknown>[]).find(a => (a as { title?: string }).title === '❌ 驳回')!['data'] = {
          ...((card.actions as Record<string, unknown>[]).find(a => (a as { title?: string }).title === '❌ 驳回')!['data'] as Record<string, unknown>),
          callback: { method: 'POST', url: rejectCallbackUrl },
          eventId: `cimrms-${result.id}-reject`,
        };
      }

      void app.teamsNotify.send({
        eventId: `cimrms-${result.id}-new-request`,
        recipients: { users: approverEmails },
        card,
        options: { priority: data.urgency === 'P1' ? 'high' : 'normal', fallbackEmail: true },
      }).catch((err: unknown) => {
        app.log.error({ err, requestNo: result.requestNo }, 'Failed to send Teams approval card');
      });
    }

    return reply.code(201).send({
      id: result.id,
      requestNo: result.requestNo,
      status: result.status,
      submitterEmail: result.submitterEmail,
      createdAt: result.createdAt,
    });
  });

  // ============================================================
  // DETAIL
  // ============================================================
  app.get<{ Params: { id: string } }>('/:id', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req) => {
    const r = await app.prisma.request.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!r) throw createHttpError.NotFound('Request not found');
    const user = req.currentUser!;
    const [slaMap, slaConfig] = await Promise.all([
      loadSlaConfigs(app.prisma),
      app.prisma.slaConfig.findUnique({ where: { urgency: r.urgency } }),
    ]);
    const slaPercent = await computeSlaPercent(app.prisma, r.status, r.statusEnteredAt, r.urgency, slaMap);
    return {
      ...r,
      slaPercent,
      isOverdue: slaPercent > 100,
      currentSlaConfig: slaConfig,
      availableActions: computeAvailableActions(r.status, user, {
        submitterEmail: r.submitterEmail,
        assigneeEmail: r.assigneeEmail,
      }),
    };
  });

  // ============================================================
  // EVENTS
  // ============================================================
  app.get<{ Params: { id: string }; Querystring: { page?: number; pageSize?: number } }>('/:id/events', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req) => {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 50)));
    const [items, total] = await Promise.all([
      app.prisma.requestEvent.findMany({
        where: { requestId: req.params.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      app.prisma.requestEvent.count({ where: { requestId: req.params.id } }),
    ]);
    return {
      items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  });

  // ============================================================
  // State transitions
  // ============================================================
  async function performTransition(
    req: import('fastify').FastifyRequest<{ Params: { id: string } }>,
    action: string,
    extraData: Record<string, unknown> = {},
    bodySchema: z.ZodTypeAny = TransitionBodySchema,
  ) {
    const user = req.currentUser!;

    // Fetch request first (need requestNo for resource-level permission checks)
    const request = await app.prisma.request.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!request) throw createHttpError.NotFound('Request not found');

    // ─── RBAC guards (enforced on all transitions) ─────────────────────────────
    // approve / reject → auditor+ OR cimrms:request:approve grant
    if (action === 'approve' || action === 'reject') {
      try {
        requireAuditor(req.currentUser);
      } catch {
        // Not auditor+, check resource-level grant for this specific request
        const grants = await checkResourcePermission(
          app.mdm, user, 'cimrms', 'request', 'approve', request.requestNo,
          (msg: string, meta?: Record<string, unknown>) => app.log.info(meta ?? {}, msg),
        );
        if (grants.length === 0) throw createHttpError.Forbidden('需要 auditor+ 角色或 cimrms:request:approve 资源级权限');
      }
    }
    // schedule / escalate → editor+ OR cimrms:request:schedule grant
    if (action === 'schedule' || action === 'escalate') {
      try {
        requireEditor(req.currentUser);
      } catch {
        const grants = await checkResourcePermission(
          app.mdm, user, 'cimrms', 'request', 'schedule', request.requestNo,
          (msg: string, meta?: Record<string, unknown>) => app.log.info(meta ?? {}, msg),
        );
        if (grants.length === 0) throw createHttpError.Forbidden('需要 editor+ 角色或 cimrms:request:schedule 资源级权限');
      }
    }

    const parsed = bodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      throw createHttpError.BadRequest(JSON.stringify(parsed.error.flatten()));
    }
    const body = parsed.data as { comment?: string };

    // ─── Submitter / Assignee guards ──────────────────────────────────────────
    const isSubmitter = user.email === request.submitterEmail;
    const isAssignee  = request.assigneeEmail === user.email || user.role === 'admin';
    const submitterOnly = ['uat_pass', 'uat_fail', 'accept', 'reject_acceptance', 'resubmit'];
    if (submitterOnly.includes(action) && !isSubmitter) {
      throw createHttpError.Forbidden(`仅提交人可以执行 ${action}`);
    }
    const assigneeOnly = ['dev_start', 'dev_complete', 'deploy'];
    if (assigneeOnly.includes(action) && !isAssignee) {
      throw createHttpError.Forbidden(`仅处理人或管理员可以执行 ${action}`);
    }

    const transition = getTransition(action);
    if (!transition) throw createHttpError.BadRequest(`Unknown action: ${action}`);

    if (transition.requireComment && !body.comment?.trim()) {
      throw createHttpError.BadRequest('comment required');
    }

    // Status check
    if (action !== 'resubmit' && request.status !== expectedFromStatus(action)) {
      throw createHttpError.Conflict(`Cannot ${action} from status ${request.status}`);
    }

    const result = await app.prisma.$transaction(async (tx) => {
      const updateData: Prisma.RequestUpdateInput = {
        status: transition.to,
        statusEnteredAt: new Date(),
        ...(action === 'schedule' ? {
          team: (extraData.team as string) ?? null,
          estimatedDeployAt: extraData.estimatedDeployAt ? new Date(extraData.estimatedDeployAt as string) : null,
          assigneeEmail: (extraData.assigneeEmail as string) ?? null,
        } : {}),
      };
      if (transition.to === 'closed') {
        updateData.closedAt = new Date();
      }
      const updated = await tx.request.update({
        where: { id: request.id },
        data: updateData,
      });
      await tx.requestEvent.create({
        data: {
          requestId: request.id,
          eventType: transition.eventType,
          fromStatus: request.status,
          toStatus: transition.to,
          actorEmail: user.email,
          actorRole: user.role as 'viewer' | 'editor' | 'auditor' | 'admin' | 'system',
          comment: body.comment ?? null,
          metadata: extraData as Prisma.InputJsonValue,
        },
      });
      // Auto: deploy → pending_acceptance
      if (action === 'deploy') {
        await tx.request.update({
          where: { id: request.id },
          data: { status: 'pending_acceptance', statusEnteredAt: new Date() },
        });
        await tx.requestEvent.create({
          data: {
            requestId: request.id,
            eventType: 'state_change',
            fromStatus: 'deployed',
            toStatus: 'pending_acceptance',
            actorEmail: 'system',
            actorRole: 'system',
            comment: '自动通知用户验收',
            metadata: { autoTrigger: true },
          },
        });
      }
      return updated;
    });

    // ── 跨系统审计（MDM AuditLog — S4-3）───────────────────────────────
    app.mdm.auditEvent({
      action: `request.${action}`,
      actorEmail: user.email,
      actorName: user.name,
      targetEmail: request.submitterEmail,
      targetType: 'request',
      targetId: result.requestNo,
      metadata: { requestId: result.id, fromStatus: request.status, toStatus: transition.to },
    });

    // ── 发送通知（fire-and-forget）────────────────────────────────────
    const actionLabels: Record<string, string> = {
      approve: '已通过',
      reject: '未通过',
      resubmit: '已重新提交',
      schedule: '已排期',
      uat_pass: 'UAT已通过',
      uat_fail: 'UAT未通过',
      deploy: '已部署，等待验收',
      accept: '已完成验收，需求关闭',
      reject_acceptance: '验收被拒绝',
    };
    const label = actionLabels[action] ?? action;

    // 通知提交人（所有操作）
    const submitterNotif = app.mdm.sendNotification({
      toEmails: [request.submitterEmail],
      notificationType: 'system_alert',
      title: `需求 ${result.requestNo} 状态更新：${label}`,
      body: action === 'reject' || action === 'uat_fail' || action === 'reject_acceptance'
        ? `需求 "${request.title}" 状态已更新为"${label}"。${body.comment ? `原因：${body.comment}` : ''}`
        : action === 'schedule'
        ? `需求 "${request.title}" 已安排处理，预计部署时间：${extraData.estimatedDeployAt as string ?? '待定'}，处理人：${extraData.assigneeEmail as string}`
        : action === 'accept'
        ? `需求 "${request.title}" 已完成验收并关闭，感谢您的提交！`
        : `需求 "${request.title}" 状态已更新为"${label}"，编号 ${result.requestNo}。`,
      metadata: { requestNo: result.requestNo, action, fromStatus: request.status, toStatus: transition.to },
    }).catch((err: unknown) => {
      app.log.error({ err, requestNo: result.requestNo, action }, 'Failed to notify submitter');
    });

    // 通知处理人（schedule / uat_fail）
    let assigneeNotif: Promise<unknown> = Promise.resolve();
    if (action === 'schedule' && extraData.assigneeEmail) {
      assigneeNotif = app.mdm.sendNotification({
        toEmails: [extraData.assigneeEmail as string],
        notificationType: 'system_alert',
        title: `新任务分配：需求 ${result.requestNo}`,
        body: `您被分配处理需求"${request.title}"（${result.requestNo}），预计部署时间：${extraData.estimatedDeployAt as string ?? '待定'}。请及时处理。`,
        metadata: { requestNo: result.requestNo, action: 'assigned', assigneeEmail: extraData.assigneeEmail },
      }).catch((err: unknown) => {
        app.log.error({ err, requestNo: result.requestNo }, 'Failed to notify assignee on schedule');
      });
    }
    if (action === 'uat_fail' && request.assigneeEmail) {
      assigneeNotif = app.mdm.sendNotification({
        toEmails: [request.assigneeEmail],
        notificationType: 'system_alert',
        title: `需求 ${result.requestNo} UAT未通过`,
        body: `需求"${request.title}"（${result.requestNo}）UAT测试未通过。原因：${body.comment ?? '未填写原因'}。请修复后重新提交。`,
        metadata: { requestNo: result.requestNo, action: 'uat_fail', assigneeEmail: request.assigneeEmail },
      }).catch((err: unknown) => {
        app.log.error({ err, requestNo: result.requestNo }, 'Failed to notify assignee on uat_fail');
      });
    }

    void Promise.all([submitterNotif, assigneeNotif]);

    // ── WS 广播：需求状态变更通知所有在线用户 ─────────────────────
    app.ws.broadcast('request:updated', {
      requestNo: result.requestNo,
      id: result.id,
      status: result.status,
      action,
      actorEmail: user.email,
      title: request.title,
    });

    // ── Teams Notify ─────────────────────────────────────────────────────────
    const callbackBase = app.teamsNotifyCallbackBase;

    // Helper: FYI status update card
    const sendStatusUpdate = (toEmail: string, eventId: string, fromStatus: string, toStatus: string, actorEmail: string, comment?: string) => {
      return app.teamsNotify.send({
        eventId,
        recipients: { users: [toEmail] },
        card: templates.statusUpdateCard({
          requestNo: result.requestNo,
          title: request.title,
          fromStatus,
          toStatus,
          updatedByEmail: actorEmail,
          comment,
          eventId,
        }),
        options: { priority: 'normal', fallbackEmail: false },
      }).catch((err: unknown) => {
        app.log.error({ err, requestNo: result.requestNo, action }, 'TeamsNotify status update failed');
      });
    };

    switch (action) {
      case 'approve':
      case 'reject':
      case 'resubmit': {
        // FYI to submitter
        void sendStatusUpdate(
          request.submitterEmail,
          `cimrms-${request.id}-${action}`,
          request.status,
          transition.to,
          user.email,
          body.comment,
        );
        break;
      }

      case 'schedule': {
        // FYI to submitter
        void sendStatusUpdate(
          request.submitterEmail,
          `cimrms-${request.id}-schedule`,
          request.status,
          transition.to,
          user.email,
        );
        // Task card to assignee
        if (extraData.assigneeEmail) {
          const assigneeEmail = extraData.assigneeEmail as string;
          void app.teamsNotify.send({
            eventId: `cimrms-${request.id}-assigned`,
            recipients: { users: [assigneeEmail] },
            card: templates.scheduleCard({
              requestNo: result.requestNo,
              title: request.title,
              urgency: request.urgency as 'P1' | 'P2' | 'P3',
              assigneeEmail,
              team: extraData.team as string,
              estimatedDeployAt: extraData.estimatedDeployAt as string,
              scheduledByEmail: user.email,
              eventId: `cimrms-${request.id}-assigned`,
            }),
            options: { priority: 'normal', fallbackEmail: true },
          }).catch((err: unknown) => {
            app.log.error({ err, requestNo: result.requestNo }, 'TeamsNotify schedule card failed');
          });
        }
        break;
      }

      case 'uat_fail': {
        // Task card to assignee with requireInput
        if (request.assigneeEmail) {
          const acceptCallbackUrl = `${callbackBase}/v1/requests/${request.id}/accept`;
          const rejectCallbackUrl = `${callbackBase}/v1/requests/${request.id}/reject-acceptance`;
          const card = templates.uatResultCard({
            requestNo: result.requestNo,
            title: request.title,
            result: 'fail',
            failReason: body.comment,
            submittedByEmail: user.email,
            submittedByName: user.name,
            callbackUrl: acceptCallbackUrl,
            eventId: `cimrms-${request.id}-uat-result`,
          });
          void app.teamsNotify.send({
            eventId: `cimrms-${request.id}-uat-fail`,
            recipients: { users: [request.assigneeEmail] },
            card,
            options: { priority: 'high', fallbackEmail: true },
          }).catch((err: unknown) => {
            app.log.error({ err, requestNo: result.requestNo }, 'TeamsNotify uat_fail card failed');
          });
        }
        break;
      }

      case 'deploy': {
        // Deploy-ready card to submitter with accept/reject buttons
        const acceptCallbackUrl = `${callbackBase}/v1/requests/${request.id}/accept`;
        const rejectCallbackUrl = `${callbackBase}/v1/requests/${request.id}/reject-acceptance`;
        void app.teamsNotify.send({
          eventId: `cimrms-${request.id}-deploy-ready`,
          recipients: { users: [request.submitterEmail] },
          card: templates.deployReadyCard({
            requestNo: result.requestNo,
            title: request.title,
            deployAt: new Date().toISOString(),
            deployedByEmail: user.email,
            deployedByName: user.name,
            callbackUrl: acceptCallbackUrl,
            eventId: `cimrms-${request.id}-deploy-ready`,
          }),
          options: { priority: 'high', fallbackEmail: true },
        }).catch((err: unknown) => {
          app.log.error({ err, requestNo: result.requestNo }, 'TeamsNotify deploy card failed');
        });
        break;
      }

      case 'accept':
      case 'reject_acceptance': {
        // FYI to assignee
        if (request.assigneeEmail) {
          void sendStatusUpdate(
            request.assigneeEmail,
            `cimrms-${request.id}-${action}`,
            request.status,
            transition.to,
            user.email,
            body.comment,
          );
        }
        break;
      }

      // dev_start, dev_complete, uat_pass: no Teams card needed (internal team updates)
      default:
        break;
    }

    return {
      id: result.id,
      requestNo: result.requestNo,
      status: action === 'deploy' ? 'pending_acceptance' : result.status,
      updatedAt: result.updatedAt,
    };
  }

  // 13 transition routes
  app.post<{ Params: { id: string } }>('/:id/approve', { onRequest: async (req) => { app.auth(req); } },
    (req) => performTransition(req, 'approve'));
  app.post<{ Params: { id: string } }>('/:id/reject', { onRequest: async (req) => { app.auth(req); } },
    (req) => performTransition(req, 'reject'));
  app.post<{ Params: { id: string } }>('/:id/resubmit', { onRequest: async (req) => { app.auth(req); } },
    (req) => performTransition(req, 'resubmit'));
  app.post<{ Params: { id: string } }>('/:id/schedule', { onRequest: async (req) => { app.auth(req); } },
    (req) => performTransition(req, 'schedule', undefined, ScheduleBodySchema));
  app.post<{ Params: { id: string } }>('/:id/dev-start', { onRequest: async (req) => { app.auth(req); } },
    (req) => performTransition(req, 'dev_start'));
  app.post<{ Params: { id: string } }>('/:id/dev-complete', { onRequest: async (req) => { app.auth(req); } },
    (req) => performTransition(req, 'dev_complete'));
  app.post<{ Params: { id: string } }>('/:id/uat-pass', { onRequest: async (req) => { app.auth(req); } },
    (req) => performTransition(req, 'uat_pass'));
  app.post<{ Params: { id: string } }>('/:id/uat-fail', { onRequest: async (req) => { app.auth(req); } },
    (req) => performTransition(req, 'uat_fail'));
  app.post<{ Params: { id: string } }>('/:id/deploy', { onRequest: async (req) => { app.auth(req); } },
    (req) => performTransition(req, 'deploy'));
  app.post<{ Params: { id: string } }>('/:id/accept', { onRequest: async (req) => { app.auth(req); } },
    (req) => performTransition(req, 'accept'));
  app.post<{ Params: { id: string } }>('/:id/reject-acceptance', { onRequest: async (req) => { app.auth(req); } },
    (req) => performTransition(req, 'reject_acceptance'));

  // ============================================================
  // COMMENT (no status change) — viewer+ can comment
  // ============================================================
  app.post<{ Params: { id: string } }>('/:id/comment', { onRequest: async (req) => { app.auth(req); } },
    async (req) => {
      const user = req.currentUser!;
      // viewer+ enforced — auth already checked; no additional role needed
      const parsed = CommentBodySchema.safeParse(req.body);
      if (!parsed.success) {
        throw createHttpError.BadRequest(JSON.stringify(parsed.error.flatten()));
      }
      const request = await app.prisma.request.findFirst({
        where: { id: req.params.id, deletedAt: null },
      });
      if (!request) throw createHttpError.NotFound('Request not found');
      const event = await app.prisma.requestEvent.create({
        data: {
          requestId: request.id,
          eventType: 'comment',
          actorEmail: user.email,
          actorRole: user.role as 'viewer' | 'editor' | 'auditor' | 'admin' | 'system',
          comment: parsed.data.comment,
          metadata: { attachmentIds: parsed.data.attachmentIds } as Prisma.InputJsonValue,
        },
      });
      return { id: event.id, ok: true };
    });

  // ============================================================
  // ESCALATE
  // ============================================================
  app.post<{ Params: { id: string } }>('/:id/escalate', { onRequest: async (req) => { app.auth(req); } },
    async (req) => {
      const parsed = EscalateBodySchema.safeParse(req.body);
      if (!parsed.success) {
        throw createHttpError.BadRequest(JSON.stringify(parsed.error.flatten()));
      }
      const user = req.currentUser!;
      const request = await app.prisma.request.findFirst({
        where: { id: req.params.id, deletedAt: null },
      });
      if (!request) throw createHttpError.NotFound('Request not found');
      if (request.status === 'closed') {
        throw createHttpError.Conflict('Closed request cannot be escalated');
      }

      const result = await app.prisma.$transaction(async (tx) => {
        const esc = await tx.requestEscalation.create({
          data: {
            requestId: request.id,
            fromStatus: request.status,
            reason: 'manual',
            escalatedToEmail: parsed.data.escalateToEmail,
            originalAssigneeEmail: request.assigneeEmail,
          },
        });
        await tx.requestEvent.create({
          data: {
            requestId: request.id,
            eventType: 'escalation',
            fromStatus: request.status,
            toStatus: request.status,
            actorEmail: user.email,
            actorRole: user.role as 'viewer' | 'editor' | 'auditor' | 'admin' | 'system',
            comment: parsed.data.reason,
            metadata: { escalateToEmail: parsed.data.escalateToEmail } as Prisma.InputJsonValue,
          },
        });
        return esc;
      });

      // ── Teams Notify：通知被升级的管理者 ───────────────────────────────
      const callbackBase = app.teamsNotifyCallbackBase;
      void app.teamsNotify.send({
        eventId: `cimrms-${request.id}-escalate-${Date.now()}`,
        recipients: { users: [parsed.data.escalateToEmail] },
        card: templates.statusUpdateCard({
          requestNo: request.requestNo,
          title: request.title,
          fromStatus: request.status,
          toStatus: request.status,
          updatedByEmail: user.email,
          comment: `升级原因：${parsed.data.reason}`,
          eventId: `cimrms-${request.id}-escalate`,
        }),
        options: { priority: 'high', fallbackEmail: true },
      }).catch((err: unknown) => {
        app.log.error({ err, requestNo: request.requestNo }, 'TeamsNotify escalate failed');
      });

      return { id: result.id, ok: true };
    });
};

// ============================================================
// Helper: expected from-status per action
// ============================================================
function expectedFromStatus(action: string): string {
  switch (action) {
    case 'approve':           return 'pending_manager';
    case 'reject':            return 'pending_manager';
    case 'resubmit':          return 'manager_rejected';
    case 'schedule':          return 'pool';
    case 'dev_start':         return 'scheduled';
    case 'dev_complete':      return 'in_development';
    case 'uat_pass':          return 'pending_uat';
    case 'uat_fail':          return 'pending_uat';
    case 'deploy':            return 'pending_deploy';
    case 'accept':            return 'pending_acceptance';
    case 'reject_acceptance': return 'pending_acceptance';
    default:                  return '';
  }
}
