/**
 * Permission routes ★ 核心
 * POST /v1/permissions/check
 * POST /v1/permissions/grant         ★ 需要 admin
 * POST /v1/permissions/grant/:grantId/revoke  ★ 需要 admin
 */
import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { GlobalRole } from '@prisma/client';
import createHttpError from 'http-errors';
import { requireAdmin } from '@mrdi/shared/permission';
import { NotificationService } from '../services/notificationService.js';

const ROLE_PERMISSIONS: Record<GlobalRole, string[]> = {
  admin: ['*:read', '*:write', '*:admin', 'audit:read', 'user:read', 'user:write'],
  auditor: ['audit:read', '*:read'],
  editor: ['*:read', '*:write'],
  viewer: ['*:read'],
};

export const permissionRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const notifySvc = new NotificationService(app.prisma);

  // ★ 权限校验（开放，任何人都能查）
  app.post<{ Body: { user_email: string; resource_id: string; action: string } }>(
    '/check',
    async (req) => {
      const { user_email, resource_id, action } = req.body;

      const user = await app.prisma.user.findUnique({
        where: { email: user_email },
        include: {
          permission_grants: {
            where: {
              status: 'active',
              expires_at: { gte: new Date() },
            },
          },
        },
      });

      if (!user || user.deleted_at) {
        return { allowed: false, role: 'unknown', permissions: [], reason: `用户 ${user_email} 不存在` };
      }

      const base = ROLE_PERMISSIONS[user.global_role] ?? [];
      const grants = user.permission_grants
        .filter(g => g.resource_id === resource_id || g.resource_id === '*')
        .map(g => g.permission_id);

      const all = [...new Set([...base, ...grants])];
      // 严格匹配顺序：具体 > 资源级 > 动作级 > 全局通配
      const allowed =
        all.includes(`${resource_id}:${action}`) ||  // 1. 资源+动作精确匹配 (含 grant)
        all.includes(`${resource_id}:*`) ||          // 2. 该资源所有动作
        all.includes(`*:${action}`) ||               // 3. 该动作跨所有资源
        all.includes('*:*');                         // 4. 超级用户

      return { allowed, role: user.global_role, permissions: all, reason: allowed ? 'OK' : '无权限' };
    },
  );

  // 授予临时权限 ★ 需要 admin
  app.post<{ Body: { userEmail: string; resourceId: string; permissionId: string; expiresAt?: string; grantedByEmail: string } }>(
    '/grant',
    { onRequest: async (req) => { app.auth(req); } },
    async (req) => {
      requireAdmin(req.currentUser);
      const { userEmail, resourceId, permissionId, expiresAt, grantedByEmail } = req.body;

      const grant = await app.prisma.permissionGrant.create({
        data: {
          user_email: userEmail,
          resource_id: resourceId,
          permission_id: permissionId,
          expires_at: expiresAt ? new Date(expiresAt) : null,
          granted_by: grantedByEmail,
        },
      });

      await app.prisma.auditLog.create({
        data: {
          actor_email: grantedByEmail,
          actor_name: req.currentUser!.name,
          action: 'permission.grant',
          target_email: userEmail,
          target_type: 'grant',
          metadata: { resourceId, permissionId, expiresAt },
        },
      });

      await notifySvc.create({
        recipientEmail: userEmail,
        type: 'permission_granted',
        title: '您获得了新的资源权限',
        body: `管理员已授予您资源「${resourceId}」的「${permissionId}」权限${expiresAt ? `，有效期至 ${new Date(expiresAt).toLocaleDateString('zh-HK', { timeZone: 'Asia/Hong_Kong' })}` : '（永久）'}。`,
        metadata: { resourceId, permissionId, expiresAt },
      });

      return { grant_id: grant.id };
    },
  );

  // 撤销权限 ★ 需要 admin
  app.post<{ Params: { grantId: string } }>(
    '/grant/:grantId/revoke',
    { onRequest: async (req) => { app.auth(req); } },
    async (req) => {
      requireAdmin(req.currentUser);
      const grant = await app.prisma.permissionGrant.findUnique({ where: { id: req.params.grantId } });
      if (!grant) throw createHttpError.NotFound('授权记录不存在');

      await app.prisma.permissionGrant.update({
        where: { id: req.params.grantId },
        data: { status: 'revoked', revoked_at: new Date() },
      });

      await app.prisma.auditLog.create({
        data: {
          actor_email: req.currentUser!.email,
          actor_name: req.currentUser!.name,
          action: 'permission.revoke',
          target_email: grant.user_email,
          target_type: 'grant',
          metadata: { resourceId: grant.resource_id, permissionId: grant.permission_id },
        },
      });

      await notifySvc.create({
        recipientEmail: grant.user_email,
        type: 'permission_revoked',
        title: '您的资源权限已被撤销',
        body: `管理员已撤销您资源「${grant.resource_id}」的「${grant.permission_id}」权限。`,
        metadata: { resourceId: grant.resource_id, permissionId: grant.permission_id },
      });

      return { ok: true };
    },
  );
};
