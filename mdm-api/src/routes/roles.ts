/**
 * Role routes
 * GET  /v1/roles              → 列出所有角色定义
 * POST /v1/roles              → 创建角色（admin only）
 * POST /v1/roles/assign       → 分配角色给用户（admin only）
 */
import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync, RouteShorthandOptions } from 'fastify';
import type { GlobalRole } from '@prisma/client';
import createHttpError from 'http-errors';
import { NotificationService } from '../services/notificationService.js';

// ─── 角色定义（前端展示用）──────────────────────────────────────────────────

const ROLE_DEFINITIONS: Record<
  GlobalRole,
  { name: string; description: string; permissions: string[] }
> = {
  admin: {
    name: '管理员',
    description: '完整访问权限，包含系统配置和用户管理',
    permissions: ['*:read', '*:write', '*:admin', 'audit:read', 'user:read', 'user:write'],
  },
  auditor: {
    name: '审计员',
    description: '只读权限，可查看所有审计日志',
    permissions: ['audit:read', '*:read'],
  },
  editor: {
    name: '编辑者',
    description: '读写权限，可管理资源但无系统配置权限',
    permissions: ['*:read', '*:write'],
  },
  viewer: {
    name: '查看者',
    description: '只读权限，可浏览所有内容',
    permissions: ['*:read'],
  },
};

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const AssignRoleSchema = z.object({
  user_id: z.string().uuid({ message: 'user_id 必须是 UUID' }),
  global_role: z.enum(['admin', 'auditor', 'editor', 'viewer']),
  granted_by: z.string().email(),
  note: z.string().optional(),
});

// ─── Plugin ─────────────────────────────────────────────────────────────────

export const roleRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // 与 userRoutes 完全一致的类型 cast
  const auth: RouteShorthandOptions['onRequest'] = async (req, reply) => {
    app.auth(req as Parameters<typeof app.auth>[0]);
  };
  const notifySvc = new NotificationService(app.prisma);

  const ROLE_NAMES: Record<string, string> = { admin: '管理员', auditor: '审计员', editor: '编辑者', viewer: '查看者' };

  // GET /v1/roles — 列出所有角色定义 + 各角色用户数
  app.get('/', { onRequest: auth }, async (req) => {
    const roleCount = await app.prisma.userRoleAssignment.groupBy({
      by: ['global_role'],
      _count: { _all: true },
    });
    const countMap = Object.fromEntries(
      roleCount.map((r) => [r.global_role, r._count._all]),
    );

    const roles = (Object.entries(ROLE_DEFINITIONS) as [GlobalRole, typeof ROLE_DEFINITIONS[GlobalRole]][]).map(
      ([code, def]) => ({
        code,
        name: def.name,
        description: def.description,
        user_count: countMap[code] ?? 0,
        permissions: def.permissions,
      }),
    );

    return { ok: true, data: roles };
  });

  // POST /v1/roles — 创建角色（保留，与前端 mapper 对齐；实际用 GlobalRole enum）
  app.post<{ Body: { code: GlobalRole; name: string; description: string; permissions: string[] } }>(
    '/',
    { onRequest: auth },
    async (req) => {
      if (req.currentUser!.role !== 'admin') {
        throw createHttpError.Forbidden('仅管理员可创建角色');
      }
      const { code, name, description, permissions } = req.body;

      if (!ROLE_DEFINITIONS[code]) {
        throw createHttpError.BadRequest(`未知角色 code: ${code}`);
      }

      // 审计日志
      await app.prisma.auditLog.create({
        data: {
          actor_email: req.currentUser!.email,
          actor_name: req.currentUser!.name,
          action: 'role.create',
          target_email: req.currentUser!.email,
          target_type: 'role',
          metadata: { code, name },
        },
      });

      return {
        ok: true,
        data: {
          code,
          name,
          description,
          user_count: 0,
          permissions,
        },
      };
    },
  );

  // POST /v1/roles/assign — 分配角色给用户
  app.post<{ Body: z.infer<typeof AssignRoleSchema> }>(
    '/assign',
    { onRequest: auth },
    async (req) => {
      if (req.currentUser!.role !== 'admin') {
        throw createHttpError.Forbidden('仅管理员可分配角色');
      }

      const parsed = AssignRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        throw createHttpError.BadRequest(parsed.error.message);
      }

      const { user_id, global_role, granted_by, note } = parsed.data;

      // 验证目标用户存在
      const user = await app.prisma.user.findUnique({ where: { id: user_id } });
      if (!user || user.deleted_at) {
        throw createHttpError.NotFound(`用户不存在: ${user_id}`);
      }

      // upsert 角色分配（唯一约束在 user_id）
      await app.prisma.userRoleAssignment.upsert({
        where: { user_id },
        update: { global_role, granted_by, note },
        create: { user_id, global_role, granted_by, note },
      });

      // 审计日志
      await app.prisma.auditLog.create({
        data: {
          actor_email: req.currentUser!.email,
          actor_name: req.currentUser!.name,
          action: 'user.role.assign',
          target_email: user.email,
          target_type: 'user',
          metadata: { global_role, note },
        },
      });

      // 通知被分配者
      await notifySvc.create({
        recipientEmail: user.email,
        type: 'role_assigned',
        title: '您被分配了新角色',
        body: `管理员已将您的角色变更为「${ROLE_NAMES[global_role] ?? global_role}」。如有问题请联系管理员。`,
        metadata: { global_role, assignedBy: req.currentUser!.email },
      });

      return { ok: true };
    },
  );
};
