/**
 * JWT 鉴权插件
 * dev-login: ?dev_login&email=xxx&role=yyy&admin_key=<ADMIN_KEY> → 签 JWT（仅 dev）
 *   - ADMIN_KEY 未设置: 允许 dev_login（向后兼容）
 *   - ADMIN_KEY 已设置: 必须传对 admin_key，否则 403
 * 生产: Bearer JWT → 注入 currentUser
 *
 * 实现说明：
 *   - @fastify/jwt 必须用 fp({ encapsulate: false }) 注册在 root scope，
 *     这样 /auth/v1 下的所有路由都能访问 app.jwt
 *   - onRequest hook 同样用 fp({ encapsulate: false }) 确保全局生效
 */
import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyRequest, FastifyInstance } from 'fastify';
import createHttpError from 'http-errors';

interface AuthPluginOptions {
  secret: string;
  expiresIn: string;
  devLoginEnabled: boolean;
  adminKey?: string;
}

// ── Step 1: @fastify/jwt 注册（root scope，encapsulate=false） ────────────────
const jwtPlugin: FastifyPluginAsync<{ secret: string; expiresIn: string }> = fp(
  async (app: FastifyInstance, opts: { secret: string; expiresIn: string }) => {
    await app.register(import('@fastify/jwt'), { secret: opts.secret, sign: { expiresIn: opts.expiresIn } });
  },
  { encapsulate: false, name: 'jwt' },
);

// ── Step 2: currentUser decoration + onRequest hook（root scope） ────────────
const authCorePlugin: FastifyPluginAsync<AuthPluginOptions> = fp(
  async (app: FastifyInstance, opts: AuthPluginOptions) => {
    const { devLoginEnabled, adminKey } = opts;
    app.log.info(`[auth] init — devLoginEnabled=${devLoginEnabled} adminKey=${adminKey !== undefined ? 'SET' : 'UNSET'}`);

    app.decorateRequest('currentUser', null);

    app.addHook('onRequest', async (req: FastifyRequest) => {
      const url = req.url;
      app.log.info(`[auth] onRequest url=[${url}] devLoginEnabled=${devLoginEnabled} hasDevLogin=${url.includes('dev_login')}`);

      if (devLoginEnabled && url.includes('dev_login')) {
        // ADMIN_KEY 检查（T2 · ADR-0006）
        if (adminKey !== undefined && adminKey !== '') {
          const q = req.query as Record<string, string>;
          if (q['admin_key'] !== adminKey) {
            app.log.warn(`[auth] dev_login rejected — wrong admin_key from ${req.ip}`);
            throw createHttpError.Forbidden('EMERGENCY_ACCESS_DISABLED');
          }
        }
        const q = req.query as Record<string, string>;
        req.currentUser = {
          email: q['email'] ?? 'dev@mrdi.local',
          name: q['name'] ?? 'Dev User',
          role: q['role'] ?? 'admin',
          department: q['department'] ?? 'CIM',
        };
        app.log.debug(`[auth] dev_login OK user=${req.currentUser.email}`);
        return;
      }

      try {
        app.log.debug('[auth] calling jwtVerify...');
        const payload = await req.jwtVerify() as { email: string; name: string; role: string; department: string };
        app.log.debug(`[auth] jwtVerify OK payload=${JSON.stringify(payload)}`);
        req.currentUser = { email: payload.email, name: payload.name, role: payload.role, department: payload.department };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        app.log.debug(`[auth] jwtVerify failed: ${msg}`);
        req.currentUser = null;
      }
    });

    app.decorate('auth', (req: FastifyRequest) => {
      if (!req.currentUser) throw createHttpError.Unauthorized();
      return req.currentUser as { email: string; name: string; role: string; department: string };
    });
  },
  { encapsulate: false, name: 'auth-core' },
);

// ── 统一导出 ───────────────────────────────────────────────────────────────────
export const authPlugin: FastifyPluginAsync<AuthPluginOptions> = fp(
  async (app: FastifyInstance, opts: AuthPluginOptions) => {
    await app.register(jwtPlugin, { secret: opts.secret, expiresIn: opts.expiresIn });
    await app.register(authCorePlugin, opts);
  },
);

declare module 'fastify' {
  interface FastifyInstance {
    auth: (req: FastifyRequest) => { email: string; name: string; role: string; department: string };
  }
}
