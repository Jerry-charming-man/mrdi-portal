/**
 * Auth routes — dev login + current user
 * GET  /v1/auth/dev/login?email=xxx&role=yyy&name=zzz
 * GET  /v1/auth/me          — 获取当前登录用户
 * POST /v1/auth/login       — 登录（POST variant）
 */
import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

const DevLoginQuerySchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'auditor', 'editor', 'viewer']).default('editor'),
  name: z.string().default('Dev User'),
  department: z.string().default('CIM'),
});

export const authRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get<{ Querystring: z.infer<typeof DevLoginQuerySchema> }>(
    '/dev/login',
    async (req, reply) => {
      const parsed = DevLoginQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return reply.code(400).send({
          error: { code: 'VALIDATION_ERROR', message: '参数校验失败', details: parsed.error.flatten() },
        });
      }
      const { email, role, name, department } = parsed.data;

      const token = app.jwt.sign({
        email,
        name,
        role,
        department,
      });

      if (app.env.NODE_ENV === 'development') {
        req.log.info(`[dev-login] ${email} → ${role} | token: ${token.slice(0, 40)}...`);
      }

      return reply.send({
        token,
        user: { email, name, role, department },
      });
    },
  );

  // POST variant for SPA / fetch from frontend
  app.post<{ Body: z.infer<typeof DevLoginQuerySchema> }>(
    '/dev/login',
    async (req, reply) => {
      const parsed = DevLoginQuerySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: { code: 'VALIDATION_ERROR', message: '参数校验失败', details: parsed.error.flatten() },
        });
      }
      const { email, role, name, department } = parsed.data;

      const token = app.jwt.sign({ email, name, role, department });

      return reply.send({ token, user: { email, name, role, department } });
    },
  );

  // Alias for /v1/auth/login (POST) - spec says `POST /auth/login`
  app.post<{ Body: z.infer<typeof DevLoginQuerySchema> }>(
    '/login',
    async (req, reply) => {
      const parsed = DevLoginQuerySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: { code: 'VALIDATION_ERROR', message: '参数校验失败', details: parsed.error.flatten() },
        });
      }
      const { email, role, name, department } = parsed.data;
      const token = app.jwt.sign({ email, name, role, department });
      return reply.send({ token, user: { email, name, role, department } });
    },
  );

  // GET /v1/auth/me — 当前登录用户信息
  app.get('/me', { onRequest: async (req) => { app.auth(req); } }, async (req) => {
    const u = req.currentUser!;
    return {
      id: '',
      email: u.email,
      name: u.name,
      role: u.role,
      department: u.department,
      teams: [],
    };
  });
};
