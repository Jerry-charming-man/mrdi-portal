/**
 * Auth routes
 * GET  /auth/v1/dev/login?email=xxx&role=yyy  (dev-only, guarded by DEV_LOGIN_ENABLED)
 * POST /auth/v1/login   { email, password }  (production password login)
 * GET  /auth/v1/m365/authorize?email=xxx      (dev mock OAuth — T3 · ADR-0006)
 * POST /auth/v1/m365/callback                 (dev mock token exchange — T3 · ADR-0006)
 * GET  /auth/v1/m365/mock-users               (dev mock user list — T3 · ADR-0006)
 */
import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import createHttpError from 'http-errors';
import { Prisma } from '@prisma/client';
import { NotificationService } from '../services/notificationService.js';
import { M365MockClient } from '../services/m365MockClient.js';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Extended user type with password fields (ADR-0005 · Sprint 2)
// Prisma schema has: password_hash, locked_until, failed_login_count, etc.
// Using a local interface to avoid workspace Prisma client cache issues.
interface UserWithPassword {
  id: string;
  email: string;
  name: string;
  department: string;
  status: string;
  global_role: string;
  password_hash: string | null;
  failed_login_count: number;
  locked_until: Date | null;
  must_change_password: boolean;
  deleted_at: Date | null;
  password_history: string[]; // Sprint 2
  m365_object_id: string | null; // ADR-0006
  m365_synced_at: Date | null; // ADR-0006
}

const DevLoginQuerySchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'auditor', 'editor', 'viewer']).default('editor'),
  name: z.string().default('Dev User'),
  department: z.string().default('CIM'),
});

const LoginBodySchema = z.object({
  email: z.string().email('请输入有效邮箱'),
  password: z.string().min(1, '密码不能为空'),
});

// ── Dev login (GET, dev-only) ─────────────────────────────────────────────────
export const authRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {

  // GET /auth/v1/dev/login  — development shortcut (flag-guarded)
  app.get<{ Querystring: z.infer<typeof DevLoginQuerySchema> }>(
    '/dev/login',
    async (req, reply) => {
      if (!app.env.DEV_LOGIN_ENABLED) {
        return reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'dev login 已禁用' } });
      }

      const parsed = DevLoginQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return reply.code(400).send({
          error: { code: 'VALIDATION_ERROR', message: '参数校验失败', details: parsed.error.flatten() },
        });
      }
      const { email, role, name, department } = parsed.data;

      let user = await app.prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await app.prisma.user.upsert({
          where: { email },
          update: { name, global_role: role as 'admin' | 'auditor' | 'editor' | 'viewer' },
          create: { email, name, department, global_role: role as 'admin' | 'auditor' | 'editor' | 'viewer' },
        });
      }

      const token = app.jwt.sign({
        email: user.email,
        name: user.name,
        role: user.global_role,
        department: user.department,
      });

      if (app.env.NODE_ENV === 'development') {
        req.log.info(`[dev-login] ${email} → ${role}`);
      }

      return reply.send({
        token,
        user: {
          email: user.email,
          name: user.name,
          role: user.global_role,
          department: user.department,
        },
      });
    },
  );

  // POST /auth/v1/login — password login
  app.post<{ Body: z.infer<typeof LoginBodySchema> }>(
    '/login',
    async (req, reply) => {
      const parsed = LoginBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message ?? '参数校验失败' },
        });
      }
      const { email, password } = parsed.data;

      const user = await app.prisma.user.findUnique({ where: { email } }) as UserWithPassword | null;
      if (!user || user.deleted_at) {
        // 记录失败登录（不区分用户是否存在，防止用户枚举）
        await logAudit(app, email, 'auth.login.fail', `password`, { reason: 'user_not_found' });
        return reply.code(401).send({
          error: { code: 'AUTH_FAILED', message: '邮箱或密码错误' },
        });
      }

      // ── 账号锁定检查 ───────────────────────────────────────────────────
      if (user.locked_until && user.locked_until > new Date()) {
        const waitSec = Math.ceil((user.locked_until.getTime() - Date.now()) / 1000);
        await logAudit(app, email, 'auth.login.locked', `password`, { waitSec });
        return reply.code(423).send({
          error: {
            code: 'ACCOUNT_LOCKED',
            message: `账号已锁定，请在 ${Math.ceil(waitSec / 60)} 分钟后重试`,
            lockedUntil: user.locked_until.toISOString(),
          },
        });
      }

      // ── 密码校验 ───────────────────────────────────────────────────────
      if (!user.password_hash) {
        await logAudit(app, email, 'auth.login.fail', `password`, { reason: 'no_password_set' });
        return reply.code(401).send({
          error: { code: 'AUTH_FAILED', message: '邮箱或密码错误' },
        });
      }

      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        const newFailedCount = user.failed_login_count + 1;
        const shouldLock = newFailedCount >= MAX_FAILED_ATTEMPTS;
        const lockedUntil = shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : user.locked_until;

        await app.prisma.user.update({
          where: { email },
          data: {
            failed_login_count: newFailedCount,
            locked_until: shouldLock ? lockedUntil : user.locked_until,
          } as any,
        });

        // 每次失败都记
        await logAudit(app, email, 'auth.login.fail', `password`, {
          failedCount: newFailedCount,
          locked: shouldLock,
          lockedUntil: lockedUntil?.toISOString(),
        });

        if (shouldLock) {
          // 账号被锁定（T5 · 独立安全事件）
          await logAudit(app, email, 'auth.login.lock', `password`, {
            failedCount: newFailedCount,
            lockedUntil: lockedUntil!.toISOString(),
          });
          await sendNotification(app, {
            recipientEmail: email,
            type: 'account_locked',
            title: '账号已被锁定',
            body: `您的账号因连续 ${MAX_FAILED_ATTEMPTS} 次密码错误已被锁定 15 分钟。请在 ${new Date(Date.now() + LOCK_DURATION_MS).toLocaleTimeString('zh-HK', { timeZone: 'Asia/Hong_Kong' })} 后重试，或联系管理员解锁。`,
          });
          return reply.code(423).send({
            error: {
              code: 'ACCOUNT_LOCKED',
              message: `连续 ${MAX_FAILED_ATTEMPTS} 次密码错误，账号已锁定 15 分钟`,
              lockedUntil: lockedUntil!.toISOString(),
            },
          });
        }

        return reply.code(401).send({
          error: {
            code: 'AUTH_FAILED',
            message: `邮箱或密码错误（剩余 ${MAX_FAILED_ATTEMPTS - newFailedCount} 次）`,
          },
        });
      }

      // ── 登录成功 ───────────────────────────────────────────────────────
      await app.prisma.user.update({
        where: { email },
        data: {
          failed_login_count: 0,
          locked_until: null,
        } as any,
      });

      // 强制改密检查：admin 重置 / 密码过期 / 首次登录
      if (user.must_change_password) {
        await logAudit(app, user.email, 'auth.login.success', `password`, {
          role: user.global_role,
          mustChangePassword: true,
        });
        return reply.code(200).send({
          token: null, // 不签发 token，强制改密
          user: {
            email: user.email,
            name: user.name,
            role: user.global_role,
            department: user.department,
          },
          requirePasswordChange: true,
          message: '请先设置新密码',
        });
      }

      // 签发 JWT
      const token = app.jwt.sign({
        email: user.email,
        name: user.name,
        role: user.global_role,
        department: user.department,
      });

      await logAudit(app, email, 'auth.login.success', `password`, { role: user.global_role });
      await sendNotification(app, {
        recipientEmail: email,
        type: 'auth_login',
        title: '新设备登录提醒',
        body: `您的账号于 ${new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' })} 在新设备登录，如非本人操作请立即修改密码。`,
        metadata: { ip: req.ip, userAgent: req.headers['user-agent'] },
      });

      req.log.info(`[login] ${email} → ${user.global_role}`);

      return reply.send({
        token,
        user: {
          email: user.email,
          name: user.name,
          role: user.global_role,
          department: user.department,
        },
      });
    },
  );

  // ── M365 OAuth Mock Routes（T3 · ADR-0006）─────────────────────────────

  // GET /auth/v1/m365/mock-users — 返回可用 mock 用户列表（dev 调试用）
  app.get('/m365/mock-users', async (_req, reply) => {
    if (!app.env.M365_MOCK_ENABLED) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'M365 mock 未启用' } });
    }
    const client = new M365MockClient(app, '/auth/v1/m365/callback');
    return reply.send({ users: client.listMockUsers() });
  });

  // GET /auth/v1/m365/authorize — 启动 mock OAuth flow，返回 redirect URL
  // 前端拿到 URL 后模拟跳转（或直接用 POST /callback 跳过跳转）
  app.get<{ Querystring: { email?: string; redirect_uri?: string } }>(
    '/m365/authorize',
    async (req, reply) => {
      if (!app.env.M365_MOCK_ENABLED) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'M365 mock 未启用' } });
      }
      const { email } = req.query;
      const client = new M365MockClient(app, '/auth/v1/m365/callback');
      const result = client.authorize(email);
      req.log.info(`[m365-mock] authorize email=${email ?? 'default'}`);
      return reply.send({
        redirectTo: result.redirectTo,
        code: result.code,
        message: 'mock: 模拟 M365 OAuth authorize 跳转',
      });
    },
  );

  // POST /auth/v1/m365/callback — 处理 mock OAuth callback
  // Body: { code: string } — 直接 exchange code 并签发 JWT
  const M365CallbackSchema = z.object({
    code: z.string().min(1, 'code 不能为空'),
  });

  app.post<{ Body: z.infer<typeof M365CallbackSchema> }>(
    '/m365/callback',
    async (req, reply) => {
      if (!app.env.M365_MOCK_ENABLED) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'M365 mock 未启用' } });
      }

      const parsed = M365CallbackSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message ?? '参数校验失败' },
        });
      }
      const { code } = parsed.data;

      const client = new M365MockClient(app, '/auth/v1/m365/callback');

      // Step 2: exchange code → token
      let tokenResponse: ReturnType<typeof client.exchangeCode>;
      try {
        tokenResponse = client.exchangeCode(code);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        req.log.warn(`[m365-mock] exchangeCode failed: ${msg}`);
        return reply.code(400).send({ error: { code: 'INVALID_CODE', message: '无效或已过期的授权码' } });
      }

      // Step 3: getMe → user info
      let meInfo: ReturnType<typeof client.getMe>;
      try {
        meInfo = client.getMe(tokenResponse.access_token);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        req.log.error(`[m365-mock] getMe failed: ${msg}`);
        return reply.code(401).send({ error: { code: 'INVALID_TOKEN', message: '无效的 access token' } });
      }

      // Step 4: upsert user（m365_object_id 关联）
      // Note: m365_object_id/m365_synced_at in Prisma schema but pre-generated client
      // types don't include them yet — use 'as any' to bypass until regenerated.
      const role = MOCK_ROLE_MAP[meInfo.id] ?? 'editor';
      const user = await app.prisma.user.upsert({
        where: { email: meInfo.mail },
        update: {
          name: meInfo.displayName,
          department: meInfo.department,
          m365_object_id: meInfo.id,
          m365_synced_at: new Date(),
        } as any,
        create: {
          email: meInfo.mail,
          name: meInfo.displayName,
          department: meInfo.department,
          global_role: role as 'admin' | 'auditor' | 'editor' | 'viewer',
          m365_object_id: meInfo.id,
          m365_synced_at: new Date(),
        } as any,
      });

      // Step 5: 签发 JWT
      const jwtToken = app.jwt.sign({
        email: user.email,
        name: user.name,
        role: user.global_role,
        department: user.department,
      });

      await logAudit(app, user.email, 'auth.login.m365_mock', 'oauth', {
        m365UserId: meInfo.id,
        displayName: meInfo.displayName,
      });

      req.log.info(`[m365-mock] login OK user=${user.email} role=${user.global_role}`);

      return reply.send({
        token: jwtToken,
        user: {
          email: user.email,
          name: user.name,
          role: user.global_role,
          department: user.department,
        },
        m365: {
          objectId: meInfo.id,
          syncedAt: (user as any).m365_synced_at?.toISOString() ?? null,
        },
      });
    },
  );

  // ── POST /auth/v1/change-password（T6 · ADR-0006）───────────────────────
  // 要求：已登录用户，校验旧密码 + 强度 + password_history
  const ChangePasswordSchema = z.object({
    oldPassword: z.string().min(1, '旧密码不能为空'),
    newPassword: z
      .string()
      .min(12, '密码至少 12 个字符')
      .regex(/[A-Z]/, '必须包含大写字母')
      .regex(/[a-z]/, '必须包含小写字母')
      .regex(/\d/, '必须包含数字')
      .regex(/[!@#$%^&*()_+\-=\[\]{};': "\\|,.<>\/?]/, '必须包含特殊字符'),
  });

  app.post<{ Body: z.infer<typeof ChangePasswordSchema> }>(
    '/change-password',
    async (req, reply) => {
      // 需要登录
      const currentUser = req.currentUser ?? app.auth(req);

      const parsed = ChangePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors[0]?.message ?? '密码不符合要求',
          },
        });
      }
      const { oldPassword, newPassword } = parsed.data;

      const user = await app.prisma.user.findUnique({
        where: { email: currentUser.email },
      }) as UserWithPassword | null;

      if (!user || user.deleted_at) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: '用户不存在' } });
      }

      // 旧密码校验
      if (!user.password_hash) {
        return reply.code(400).send({ error: { code: 'BAD_REQUEST', message: '当前账号未设置密码' } });
      }
      const match = await bcrypt.compare(oldPassword, user.password_hash);
      if (!match) {
        await logAudit(app, currentUser.email, 'auth.password.change.fail', 'password', {
          reason: 'wrong_old_password',
        });
        return reply.code(401).send({ error: { code: 'AUTH_FAILED', message: '旧密码不正确' } });
      }

      // 新旧密码不能相同
      const newMatch = await bcrypt.compare(newPassword, user.password_hash);
      if (newMatch) {
        return reply.code(400).send({ error: { code: 'BAD_REQUEST', message: '新密码不能与旧密码相同' } });
      }

      // password_history 检查（最近 5 次不能重用）
      const history = user.password_history ?? [];
      for (const histHash of history) {
        const histMatch = await bcrypt.compare(newPassword, histHash);
        if (histMatch) {
          await logAudit(app, currentUser.email, 'auth.password.change.fail', 'password', {
            reason: 'password_in_history',
          });
          return reply.code(400).send({
            error: { code: 'BAD_REQUEST', message: '不能使用最近使用过的密码' },
          });
        }
      }

      // 生成新密码哈希
      const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      const newHistory = [user.password_hash, ...history].slice(0, 5); // 保留最近 5 次

      await app.prisma.user.update({
        where: { email: currentUser.email },
        data: {
          password_hash: newHash,
          password_changed_at: new Date(),
          password_history: newHistory,
          must_change_password: false,
        } as any,
      });

      await logAudit(app, currentUser.email, 'auth.password.changed', 'password', {});
      await sendNotification(app, {
        recipientEmail: currentUser.email,
        type: 'password_changed',
        title: '密码已修改',
        body: `您的账号密码已于 ${new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' })} 修改。如非本人操作，请立即联系管理员。`,
        metadata: { ip: req.ip, userAgent: req.headers['user-agent'] },
      });

      req.log.info(`[change-password] OK user=${currentUser.email}`);

      // 签发新 JWT（替换旧 token）
      const newToken = app.jwt.sign({
        email: user.email,
        name: user.name,
        role: user.global_role,
        department: user.department,
      });

      return reply.send({ message: '密码修改成功', token: newToken });
    },
  );

  // ── POST /auth/v1/unlock/:email（admin 用 · T8）──────────────────────────
  // 管理员解锁任意用户账号
  app.post<{ Params: { email: string } }>(
    '/unlock/:email',
    async (req, reply) => {
      const currentUser = req.currentUser ?? app.auth(req);

      // 只有 admin 可以解锁
      if (currentUser.role !== 'admin') {
        return reply.code(403).send({ error: { code: 'FORBIDDEN', message: '只有管理员可以解锁账号' } });
      }

      const targetEmail = req.params.email;
      const target = await app.prisma.user.findUnique({ where: { email: targetEmail } }) as UserWithPassword | null;
      if (!target || target.deleted_at) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: '目标用户不存在' } });
      }

      if (!target.locked_until || target.locked_until <= new Date()) {
        return reply.code(400).send({ error: { code: 'BAD_REQUEST', message: '该账号未被锁定' } });
      }

      await app.prisma.user.update({
        where: { email: targetEmail },
        data: {
          locked_until: null,
          failed_login_count: 0,
        } as any,
      });

      await logAudit(app, currentUser.email, 'auth.user.unlocked', 'user', {
        targetEmail,
        unlockedBy: currentUser.email,
      });
      await sendNotification(app, {
        recipientEmail: targetEmail,
        type: 'account_unlocked',
        title: '账号已解锁',
        body: `您的账号已被管理员 ${currentUser.name} 解锁，现可正常登录。`,
      });

      req.log.info(`[unlock] ${currentUser.email} unlocked ${targetEmail}`);
      return reply.send({ message: `账号 ${targetEmail} 已解锁` });
    },
  );

  // ── POST /auth/v1/admin/reset-password（T6b · ADR-0006）─────────────────
  // admin 重置任意用户密码，强制目标用户下次登录改密
  const AdminResetSchema = z.object({
    targetEmail: z.string().email('必须提供目标用户邮箱'),
    newPassword: z
      .string()
      .min(12, '密码至少 12 个字符')
      .regex(/[A-Z]/, '必须包含大写字母')
      .regex(/[a-z]/, '必须包含小写字母')
      .regex(/\d/, '必须包含数字')
      .regex(/[!@#$%^&*()_+\-=\[\]{};': "\\|,.<>\/?]/, '必须包含特殊字符'),
  });

  app.post<{ Body: z.infer<typeof AdminResetSchema> }>(
    '/admin/reset-password',
    async (req, reply) => {
      const currentUser = req.currentUser ?? app.auth(req);

      // 只有 admin 可以重置密码
      if (currentUser.role !== 'admin') {
        return reply.code(403).send({ error: { code: 'FORBIDDEN', message: '只有管理员可以重置密码' } });
      }

      const parsed = AdminResetSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors[0]?.message ?? '参数校验失败',
          },
        });
      }
      const { targetEmail, newPassword } = parsed.data;

      const target = await app.prisma.user.findUnique({
        where: { email: targetEmail },
      }) as UserWithPassword | null;
      if (!target || target.deleted_at) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: '目标用户不存在' } });
      }

      // admin 不能重置自己（防止锁死）
      if (targetEmail === currentUser.email) {
        return reply.code(400).send({ error: { code: 'BAD_REQUEST', message: '管理员不能重置自己的密码，请使用改密功能' } });
      }

      const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

      // 更新密码，清除锁定状态
      await app.prisma.user.update({
        where: { email: targetEmail },
        data: {
          password_hash: newHash,
          password_changed_at: new Date(),
          locked_until: null,
          failed_login_count: 0,
          must_change_password: true, // 强制下次登录改密
          // password_history 不强制追加（重置不等同于用户主动改密）
        } as any,
      });

      await logAudit(app, currentUser.email, 'auth.password.reset', 'password', {
        targetEmail,
        resetBy: currentUser.email,
      });

      req.log.info(`[admin-reset] ${currentUser.email} reset password for ${targetEmail}`);

      return reply.send({
        message: `已为 ${targetEmail} 重置密码，该用户下次登录将被要求设置新密码`,
      });
    },
  );
};

// ── Mock 用户 → 角色映射（T3）────────────────────────────────────────────────
// 简化：按 mock 用户 ID 映射角色（dev 调试用）
const MOCK_ROLE_MAP: Record<string, string> = {
  'mock-user-admin-001': 'admin',
  'mock-user-editor-001': 'editor',
  'mock-user-viewer-001': 'viewer',
};
async function logAudit(
  app: FastifyInstance,
  actorEmail: string,
  action: string,
  targetType: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await app.prisma.auditLog.create({
      data: {
        actor_email: actorEmail,
        actor_name: actorEmail,
        action,
        target_type: targetType,
        metadata: (metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });
  } catch (e) {
    app.log.error({ err: e }, '[audit] failed to write audit log');
  }
}

// ── Helper: send notification (fire-and-forget, non-blocking) ─────────────────
async function sendNotification(
  app: FastifyInstance,
  options: { recipientEmail: string; type: string; title: string; body?: string; metadata?: Record<string, unknown> },
): Promise<void> {
  try {
    const svc = new NotificationService(app.prisma);
    await svc.create({
      recipientEmail: options.recipientEmail,
      type: options.type as import('@prisma/client').NotificationType,
      title: options.title,
      body: options.body,
      metadata: options.metadata,
    });
  } catch (e) {
    app.log.error({ err: e }, '[notification] failed to send notification');
  }
}
