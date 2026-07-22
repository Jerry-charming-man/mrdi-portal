/**
 * cimrms-api — app.ts
 * Fastify 实例 + 全局插件注册
 */
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { envPlugin } from './plugins/env.js';
import { prismaPlugin } from './plugins/prisma.js';
import { mdmPlugin } from './plugins/mdm.js';
import { teamsNotifyPlugin } from './plugins/teamsNotify.js';
import { errorHandlerPlugin } from './plugins/errorHandler.js';
import { authPlugin } from './plugins/auth.js';
import { wsPlugin } from './plugins/websocket.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { requestRoutes } from './routes/requests.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { spcRoutes } from './routes/spc.js';
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
  await app.register(errorHandlerPlugin);

  // ── Swagger UI（A10 — 仅非生产环境）────────────────────────────────────
  if (env.NODE_ENV !== 'production') {
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'MRDI CIM-RMS API',
          description: 'MRDI 需求管理系统 API（Sprint 3）',
          version: '1.0.0',
        },
        servers: [{ url: `http://localhost:${env.PORT ?? 3001}`, description: 'Local dev' }],
        tags: [
          { name: 'Auth', description: '认证' },
          { name: 'Requests', description: '需求管理' },
          { name: 'Dashboard', description: 'Dashboard KPI' },
          { name: 'SPC', description: '统计过程控制' },
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
  await app.register(teamsNotifyPlugin, { env });

  await app.register(healthRoutes, { prefix: '/v1' });
  await app.register(wsPlugin, { prefix: '/v1' });   // GET /v1/ws — WebSocket real-time push
  await app.register(authRoutes, { prefix: '/v1/auth' });
  await app.register(requestRoutes, { prefix: '/v1/requests' });
  await app.register(dashboardRoutes, { prefix: '/v1/dashboard' });
  await app.register(spcRoutes, { prefix: '/v1/spc' });

  return app;
}
