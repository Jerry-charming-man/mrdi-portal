/**
 * cim-perm — app.ts (Fastify 4)
 *
 * Migrated from Express to Fastify 4. All routes preserved at
 * /perm-api/v1 prefix, same endpoints, same business logic in services.
 */
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { envPlugin } from './plugins/env.js';
import { pgPlugin } from './plugins/pg.js';
import { mdmPlugin } from './plugins/mdm.js';
import { errorHandlerPlugin } from './plugins/errorHandler.js';
import { authPlugin } from './plugins/auth.js';
import { healthRoutes } from './routes/health.js';
import { requestRoutes } from './routes/requests.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { settingsRoutes } from './routes/settings.js';
import { permTypesRoutes } from './routes/permTypes.js';
import { auditRoutes } from './routes/audit.js';
import type { Env } from './config/env.js';

export async function buildApp(env: Env): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
        : undefined,
    },
  });

  await app.register(envPlugin, env);
  await app.register(pgPlugin);
  await app.register(errorHandlerPlugin);

  // ── Swagger UI（A10 — 仅非生产环境）────────────────────────────────────
  if (env.NODE_ENV !== 'production') {
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'MRDI CIM-PERM API',
          description: 'MRDI 权限请求管理系统 API（Sprint 3）',
          version: '1.0.0',
        },
        servers: [{ url: `http://localhost:${env.PORT ?? 3003}`, description: 'Local dev' }],
        tags: [
          { name: 'Requests', description: '权限申请管理' },
          { name: 'Dashboard', description: 'Dashboard 统计' },
          { name: 'PermTypes', description: '权限类型配置' },
          { name: 'Settings', description: '系统设置' },
          { name: 'Audit', description: '审计日志' },
        ],
      },
    });
    await app.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: { docExpansion: 'list', deepLinking: false },
    });
    app.log.info('[swagger] Swagger UI available at /docs');
  }

  await app.register(authPlugin, {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    devLoginEnabled: env.DEV_LOGIN_ENABLED,
  });
  await app.register(mdmPlugin, { env });

  // Mount at /perm-api/v1 (per spec)
  await app.register(healthRoutes, { prefix: '/perm-api/v1' });
  await app.register(requestRoutes, { prefix: '/perm-api/v1' });
  await app.register(dashboardRoutes, { prefix: '/perm-api/v1' });
  await app.register(permTypesRoutes, { prefix: '/perm-api/v1' });
  await app.register(settingsRoutes, { prefix: '/perm-api/v1' });
  await app.register(auditRoutes, { prefix: '/perm-api/v1' });

  return app;
}
