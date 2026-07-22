/**
 * Auth routes — dev login
 */
import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

const DevLoginQuerySchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'auditor', 'engineer', 'duty', 'viewer']).default('duty'),
  name: z.string().default('Dev User'),
  department: z.string().default('IT'),
});

export const authRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // GET /v1/auth/dev/login
  app.get<{ Querystring: z.infer<typeof DevLoginQuerySchema> }>('/dev/login', async (req, reply) => {
    const parsed = DevLoginQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } });
    }
    const { email, role, name, department } = parsed.data;
    const token = app.jwt.sign({ email, name, role, department });
    return reply.send({ token, user: { email, name, role, department } });
  });

  // POST /v1/auth/login
  app.post<{ Body: z.infer<typeof DevLoginQuerySchema> }>('/login', async (req, reply) => {
    const parsed = DevLoginQuerySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } });
    }
    const { email, role, name, department } = parsed.data;
    const token = app.jwt.sign({ email, name, role, department });
    return reply.send({ token, user: { email, name, role, department } });
  });
};
