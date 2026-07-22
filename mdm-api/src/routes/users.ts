/**
 * User routes
 * GET  /v1/users              ← 列表（新增，Sprint 2）
 * GET  /v1/users/me
 * GET  /v1/users/by-email/:email
 * GET  /v1/users/by-email/:email/manager
 * PATCH /v1/users/:id/password  ← admin 直接改密（S3-9）
 */
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import createHttpError from 'http-errors';
import { requireAdmin } from '@mrdi/shared/permission';

const BCRYPT_ROUNDS = 12;

export const userRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // NOTE: use `as any` on onRequest to prevent TS from wrapping in array
  // (TS infers RouteShorthandOptions.onRequest as HookHandler[] and wraps the fn)
  const auth = (async (req: Parameters<typeof app.auth>[0]) => {
    app.auth(req);
  }) as Parameters<typeof app.get>[1]['onRequest'];

  // GET /v1/users — paginated user list
  app.get('/', { onRequest: auth }, async (req) => {
    const url = new URL(req.url, 'http://localhost');
    const search = url.searchParams.get('search') ?? '';
    const status = url.searchParams.get('status') ?? '';
    const department = url.searchParams.get('department') ?? '';
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '20', 10)));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { deleted_at: null };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    }
    if (department) {
      where.department = department;
    }

    const [total, data] = await Promise.all([
      app.prisma.user.count({ where }),
      app.prisma.user.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
        include: { roles: true },
      }),
    ]);

    // Map to frontend expected shape
    const items = data.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      department: u.department,
      status: u.status === 'active' ? 'Active' : u.status === 'suspended' ? 'Suspended' : 'Idle',
      last_active: '', // TODO: derive from session table
      created_at: u.created_at.toISOString(),
      roles: u.roles.map(r => r.global_role),
      system_access: [], // TODO: derive from api_keys table
    }));

    return {
      ok: true,
      data: items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });

  app.get('/me', { onRequest: auth }, async (req) => {
    const user = await app.prisma.user.findUnique({ where: { email: req.currentUser!.email } });
    if (!user || user.deleted_at) throw createHttpError.NotFound(`用户不存在`);
    return { ok: true, data: user };
  });

  app.get<{ Params: { email: string } }>(
    '/by-email/:email',
    { onRequest: auth },
    async (req) => {
      const user = await app.prisma.user.findUnique({ where: { email: req.params.email } });
      if (!user || user.deleted_at) throw createHttpError.NotFound(`用户 ${req.params.email} 不存在`);
      return { ok: true, data: user };
    },
  );

  app.get<{ Params: { email: string } }>(
    '/by-email/:email/manager',
    { onRequest: auth },
    async (req) => {
      const user = await app.prisma.user.findUnique({ where: { email: req.params.email }, include: { manager: true } });
      if (!user || user.deleted_at) throw createHttpError.NotFound(`用户 ${req.params.email} 不存在`);
      return { ok: true, data: user.manager ?? null };
    },
  );

  // PATCH /v1/users/:id/password — admin 直接改密（S3-9）
  const ChangePwdSchema = z.object({
    newPassword: z
      .string()
      .min(12, '密码至少 12 个字符')
      .regex(/[A-Z]/, '必须包含大写字母')
      .regex(/[a-z]/, '必须包含小写字母')
      .regex(/\d/, '必须包含数字')
      .regex(/[!@#$%^&*()_+\-=\[\]{};': "\\|,.<>\/?]/, '必须包含特殊字符'),
  });

  app.patch<{ Params: { id: string }; Body: z.infer<typeof ChangePwdSchema> }>(
    '/:id/password',
    { onRequest: auth },
    async (req, reply) => {
      const currentUser = req.currentUser ?? app.auth(req);
      requireAdmin(currentUser);

      const parsed = ChangePwdSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors[0]?.message ?? '密码不符合要求',
          },
        });
      }
      const { newPassword } = parsed.data;

      // Resolve target user by id
      const target = await app.prisma.user.findUnique({ where: { id: req.params.id } });
      if (!target || target.deleted_at) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: '目标用户不存在' } });
      }

      // Admin can change own password via this endpoint too
      const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      await app.prisma.user.update({
        where: { id: req.params.id },
        data: {
          password_hash: newHash,
          password_changed_at: new Date(),
          must_change_password: false, // admin change → clear must-change flag
          locked_until: null,
          failed_login_count: 0,
        } as any,
      });

      req.log.info(`[admin-change-password] ${currentUser.email} changed password for user ${target.email}`);

      return reply.send({ message: `已为 ${target.email} 修改密码` });
    },
  );
};
