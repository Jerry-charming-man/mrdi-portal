/**
 * mdm-api — app.ts
 * Fastify 实例 + 全局插件注册
 *
 * Auth 设计（ADR-0006 · T2）：
 *   - @fastify/jwt 直接在 root scope 注册（无 fp() 包装）
 *   - currentUser decoration + onRequest hook 在 root scope 注册（无 fp() 包装）
 *   - authPlugin() 不再自包含 onRequest 逻辑，改为暴露 auth() decorator factory
 *
 * 原因：fp() 默认 encapsulate=true，sub-plugin 的 onRequest hook
 *       不会传播到 child scope 的路由（/auth/v1/*）。
 */
import Fastify from 'fastify';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import createHttpError from 'http-errors';
import { envPlugin } from './plugins/env.js';
import { prismaPlugin } from './plugins/prisma.js';
import { errorHandlerPlugin } from './plugins/errorHandler.js';
import { bullmqPlugin } from './plugins/bullmq.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { roleRoutes } from './routes/roles.js';
import { permissionRoutes } from './routes/permissions.js';
import { systemRoutes } from './routes/systems.js';
import { todoRoutes } from './routes/todos.js';
import { notificationRoutes } from './routes/notifications.js';
import { systemNotificationRoutes } from './routes/systemNotifications.js';
import { loginAuditRoutes } from './routes/loginAudit.js';
import { auditRoutes } from './routes/audit.js';
import type { Env } from './config/env.js';

export async function buildApp(env: Env): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'SYS:standard' },
            }
          : undefined,
    },
  });

  await app.register(envPlugin, env);
  await app.register(prismaPlugin, { DATABASE_URL: env.DATABASE_URL });

  // BullMQ notification worker（S3-1b）
  await app.register(bullmqPlugin);

  // CORS — allow portal SPA (localhost:8089 etc.)
  await app.register(cors, {
    origin: true, // allow all in dev; tighten in production via CORS_ORIGINS env
    credentials: true,
  });

  await app.register(errorHandlerPlugin);

  // ── Swagger UI（A10 — 仅非生产环境）────────────────────────────────────
  if (env.NODE_ENV !== 'production') {
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'MRDI MDM API',
          description: 'MRDI 主数据管理 + 权限授权 API（Sprint 3）',
          version: '1.0.0',
        },
        servers: [{ url: `http://localhost:${env.PORT ?? 3000}`, description: 'Local dev' }],
        tags: [
          { name: 'Auth', description: '认证相关（login / dev-login / m365-mock）' },
          { name: 'Users', description: '用户管理' },
          { name: 'Roles', description: '角色管理' },
          { name: 'Permissions', description: '资源级权限授予 / 撤销' },
          { name: 'Notifications', description: '通知中心' },
          { name: 'Systems', description: '系统配置' },
          { name: 'Todos', description: '待办事项' },
          { name: 'Audit', description: '跨服务审计聚合（S4-3）' },
        ],
      },
    });
    await app.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: { docExpansion: 'list', deepLinking: false },
    });
    app.log.info('[swagger] Swagger UI available at /docs');
  }

  // ── Auth setup（root scope，直接注册，不用 fp() 封装）───────────────────
  await app.register(import('@fastify/jwt'), { secret: env.JWT_SECRET, sign: { expiresIn: env.JWT_EXPIRES_IN } });

  app.decorateRequest('currentUser', null);

  app.addHook('onRequest', async (req: FastifyRequest) => {
    const url = req.url;
    app.log.debug(`[auth] onRequest url=${url}`);

    if (env.DEV_LOGIN_ENABLED && url.includes('/dev/login')) {
      // ADMIN_KEY 检查（T2 · ADR-0006）
      if (env.ADMIN_KEY !== undefined && env.ADMIN_KEY !== '') {
        const q = req.query as Record<string, string>;
        if (q['admin_key'] !== env.ADMIN_KEY) {
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

  // ── Routes ─────────────────────────────────────────────────────────────
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/auth/v1' });
  await app.register(userRoutes, { prefix: '/v1/users' });
  await app.register(roleRoutes, { prefix: '/v1/roles' });
  await app.register(permissionRoutes, { prefix: '/v1/permissions' });
  await app.register(systemRoutes, { prefix: '/v1/systems' });
  await app.register(todoRoutes, { prefix: '/v1/todos' });
  await app.register(notificationRoutes, { prefix: '/v1/notifications' });
  // System notification endpoint (service token auth — no JWT required)
  await app.register(systemNotificationRoutes, { prefix: '/v1/notifications' });
  // Login audit (S3-10)
  await app.register(loginAuditRoutes, { prefix: '/v1/login-audit' });
  // Unified audit (S4-3)
  await app.register(auditRoutes, { prefix: '/v1/audit' });

  return app;
}

// Module augmentation for app.auth() and req.currentUser
declare module 'fastify' {
  interface FastifyInstance {
    auth: (req: FastifyRequest) => { email: string; name: string; role: string; department: string };
  }
}
