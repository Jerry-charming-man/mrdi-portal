/**
 * JWT 鉴权插件
 * dev-login: ?dev_login&email=xxx&role=yyy → 签 JWT（仅 dev）
 * 生产: Bearer JWT → 注入 currentUser
 */
import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyRequest, FastifyInstance } from 'fastify';
import createHttpError from 'http-errors';

export const authPlugin: FastifyPluginAsync<{
  secret: string;
  expiresIn: string;
  devLoginEnabled: boolean;
}> = fp(async (app: FastifyInstance, opts: { secret: string; expiresIn: string; devLoginEnabled: boolean }) => {
  const { secret, expiresIn, devLoginEnabled } = opts;

  await app.register(import('@fastify/jwt'), { secret, sign: { expiresIn } });

  app.decorateRequest('currentUser', null);

  app.addHook('onRequest', async (req: FastifyRequest) => {
    const url = req.url;

    if (devLoginEnabled && url.includes('dev_login')) {
      const q = req.query as Record<string, string>;
      req.currentUser = {
        email: q['email'] ?? 'dev@mrdi.local',
        name: q['name'] ?? 'Dev User',
        role: q['role'] ?? 'admin',
        department: q['department'] ?? 'CIM',
      };
      return;
    }

    try {
      const payload = await req.jwtVerify() as { email: string; name: string; role: string; department: string };
      req.currentUser = { email: payload.email, name: payload.name, role: payload.role, department: payload.department };
    } catch {
      req.currentUser = null;
    }
  });

  app.decorate('auth', (req: FastifyRequest) => {
    if (!req.currentUser) throw createHttpError.Unauthorized();
    return req.currentUser as { email: string; name: string; role: string; department: string };
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    auth: (req: FastifyRequest) => { email: string; name: string; role: string; department: string };
  }
}
