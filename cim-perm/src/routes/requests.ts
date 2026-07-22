/**
 * Permission Request routes — migrated from Express
 * POST /perm-api/v1/requests
 * GET  /perm-api/v1/requests
 * GET  /perm-api/v1/requests/:id
 * GET  /perm-api/v1/requests/:id/audit
 * POST /perm-api/v1/requests/:id/it-review
 * POST /perm-api/v1/requests/:id/owner-review
 * POST /perm-api/v1/requests/:id/revoke
 * POST /perm-api/v1/requests/:id/withdraw
 * POST /perm-api/v1/requests/:id/extend
 * POST /perm-api/v1/requests/:id/comment
 */
import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import createHttpError from 'http-errors';
import {
  requireViewer,
  requireEditor,
  requireAuditor,
} from '@mrdi/shared/permission';
import {
  createRequest, listRequests, getRequest, getAuditLog,
  itReview, ownerReview, revokeRequest, withdrawRequest,
  extendRequest, addComment,
} from '../services/requestService.js';

// ============================================================
// Schemas (zod, used in handler-level safeParse)
// ============================================================
const CreateRequestSchema = z.object({
  target_system: z.string().min(1).max(50),
  permission_type: z.enum(['system_access', 'functional', 'data_export', 'temporary', 'batch']),
  permission_level: z.enum(['read', 'write', 'admin']),
  resource_id: z.string().min(1).max(255),
  reason: z.string().min(1).max(5000),
  requested_duration: z.string().min(1).max(20),
  urgency: z.enum(['normal', 'urgent', 'critical']).default('normal'),
  related_incident_id: z.string().max(50).optional(),
  related_request_id: z.string().max(50).optional(),
  attachment_ids: z.array(z.string()).default([]),
});

const ListRequestsQuerySchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  system: z.string().optional(),
  applicant: z.string().optional(),
  search: z.string().optional(),
  view: z.enum(['all', 'mine', 'it_review', 'owner_review', 'expiring']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

const ReviewBodySchema = z.object({
  action: z.enum(['approve', 'reject']),
  comment: z.string().max(2000).optional(),
});

const RevokeBodySchema = z.object({
  reason: z.string().min(1).max(2000),
});

const ExtendBodySchema = z.object({
  new_duration: z.string().min(1).max(20),
});

const CommentBodySchema = z.object({
  comment: z.string().min(1).max(2000),
});

export const requestRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // ============= CREATE (viewer+) =============
  app.post('/requests', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req, reply) => {
    requireViewer(req.currentUser);
    const parsed = CreateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.flatten() } });
    }
    try {
      const row = await createRequest(parsed.data, req.currentUser!);
      // ── 跨系统审计（S4-3）────────────────────────────────
      app.mdm.auditEvent({
        action: 'perm.create',
        actorEmail: req.currentUser!.email,
        actorName: req.currentUser!.name,
        targetEmail: req.currentUser!.email,
        targetType: 'permission',
        targetId: row.request_no,
        metadata: { requestId: row.id, permissionType: row.permission_type, system: row.target_system },
      });
      return reply.code(201).send(row);
    } catch (e: unknown) {
      const err = e as { status?: number; message: string };
      return reply.code(err.status ?? 500).send({ error: { code: 'INTERNAL_ERROR', message: err.message } });
    }
  });

  // ============= LIST (viewer+) =============
  app.get('/requests', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req, reply) => {
    requireViewer(req.currentUser);
    const parsed = ListRequestsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } });
    }
    try {
      const result = await listRequests({
        ...parsed.data,
        userEmail: req.currentUser!.email,
        userRole: req.currentUser!.role,
      });
      return reply.send(result);
    } catch (e: unknown) {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: (e as Error).message } });
    }
  });

  // ============= DETAIL =============
  app.get<{ Params: { id: string } }>('/requests/:id', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req, reply) => {
    try {
      const row = await getRequest(req.params.id);
      if (!row) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: '申请不存在' } });
      return reply.send(row);
    } catch (e: unknown) {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: (e as Error).message } });
    }
  });

  // ============= AUDIT =============
  app.get<{ Params: { id: string } }>('/requests/:id/audit', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req, reply) => {
    requireAuditor(req.currentUser);
    try {
      const rows = await getAuditLog(req.params.id);
      return reply.send(rows);
    } catch (e: unknown) {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: (e as Error).message } });
    }
  });

  // ============= IT REVIEW (editor+) =============
  app.post<{ Params: { id: string } }>('/requests/:id/it-review', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req, reply) => {
    requireEditor(req.currentUser);
    const parsed = ReviewBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } });
    }
    try {
      const row = await itReview(req.params.id, parsed.data, req.currentUser!);
      // ── 跨系统审计（S4-3）────────────────────────────────
      app.mdm.auditEvent({
        action: 'perm.it_review',
        actorEmail: req.currentUser!.email,
        actorName: req.currentUser!.name,
        targetEmail: row.applicant_email,
        targetType: 'permission',
        targetId: row.request_no,
        metadata: { requestId: row.id, action: parsed.data.action },
      });
      return reply.send(row);
    } catch (e: unknown) {
      const err = e as { status?: number; message: string };
      return reply.code(err.status ?? 500).send({ error: { code: 'INTERNAL_ERROR', message: err.message } });
    }
  });

  // ============= OWNER REVIEW (auditor+) =============
  app.post<{ Params: { id: string } }>('/requests/:id/owner-review', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req, reply) => {
    requireAuditor(req.currentUser);
    const parsed = ReviewBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } });
    }
    try {
      const row = await ownerReview(req.params.id, parsed.data, req.currentUser!);
      // ── 跨系统审计（S4-3）────────────────────────────────
      app.mdm.auditEvent({
        action: 'perm.owner_review',
        actorEmail: req.currentUser!.email,
        actorName: req.currentUser!.name,
        targetEmail: row.applicant_email,
        targetType: 'permission',
        targetId: row.request_no,
        metadata: { requestId: row.id, action: parsed.data.action },
      });
      return reply.send(row);
    } catch (e: unknown) {
      const err = e as { status?: number; message: string };
      return reply.code(err.status ?? 500).send({ error: { code: 'INTERNAL_ERROR', message: err.message } });
    }
  });

  // ============= REVOKE =============
  app.post<{ Params: { id: string } }>('/requests/:id/revoke', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req, reply) => {
    requireAuditor(req.currentUser);
    const parsed = RevokeBodySchema.safeParse(req.body);
    if (!parsed.success || !parsed.data.reason?.trim()) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: '必须填写撤销原因' } });
    }
    try {
      const row = await revokeRequest(req.params.id, parsed.data, req.currentUser!);
      // ── 跨系统审计（S4-3）────────────────────────────────
      app.mdm.auditEvent({
        action: 'perm.revoke',
        actorEmail: req.currentUser!.email,
        actorName: req.currentUser!.name,
        targetEmail: row.applicant_email,
        targetType: 'permission',
        targetId: row.request_no,
        metadata: { requestId: row.id, reason: parsed.data.reason },
      });
      return reply.send(row);
    } catch (e: unknown) {
      const err = e as { status?: number; message: string };
      return reply.code(err.status ?? 500).send({ error: { code: 'INTERNAL_ERROR', message: err.message } });
    }
  });

  // ============= WITHDRAW (viewer+ + 申请人身份) =============
  app.post<{ Params: { id: string } }>('/requests/:id/withdraw', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req, reply) => {
    requireViewer(req.currentUser);
    // 申请人身份校验（防止代撤）
    const existing = await getRequest(req.params.id);
    if (!existing) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: '申请不存在' } });
    }
    const reqData = existing as { applicant_email?: string; id?: string };
    if (reqData.applicant_email !== req.currentUser!.email && req.currentUser!.role !== 'admin') {
      return reply.code(403).send({ error: { code: 'FORBIDDEN', message: '只有申请人可撤回此申请' } });
    }
    try {
      const row = await withdrawRequest(req.params.id, req.currentUser!);
      return reply.send(row);
    } catch (e: unknown) {
      const err = e as { status?: number; message: string };
      return reply.code(err.status ?? 500).send({ error: { code: 'INTERNAL_ERROR', message: err.message } });
    }
  });

  // ============= EXTEND =============
  app.post<{ Params: { id: string } }>('/requests/:id/extend', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req, reply) => {
    requireAuditor(req.currentUser);
    const parsed = ExtendBodySchema.safeParse(req.body);
    if (!parsed.success || !parsed.data.new_duration) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Missing new_duration' } });
    }
    try {
      const row = await extendRequest(req.params.id, parsed.data, req.currentUser!);
      // ── 跨系统审计（S4-3）────────────────────────────────
      app.mdm.auditEvent({
        action: 'perm.extend',
        actorEmail: req.currentUser!.email,
        actorName: req.currentUser!.name,
        targetEmail: row.applicant_email,
        targetType: 'permission',
        targetId: row.request_no,
        metadata: { requestId: row.id, newDuration: parsed.data.new_duration },
      });
      return reply.send(row);
    } catch (e: unknown) {
      const err = e as { status?: number; message: string };
      return reply.code(err.status ?? 500).send({ error: { code: 'INTERNAL_ERROR', message: err.message } });
    }
  });

  // ============= COMMENT (viewer+) =============
  app.post<{ Params: { id: string } }>('/requests/:id/comment', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req, reply) => {
    requireViewer(req.currentUser);
    const parsed = CommentBodySchema.safeParse(req.body);
    if (!parsed.success || !parsed.data.comment?.trim()) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Missing comment' } });
    }
    try {
      await addComment(req.params.id, parsed.data, req.currentUser!);
      return reply.send({ ok: true });
    } catch (e: unknown) {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: (e as Error).message } });
    }
  });
};
