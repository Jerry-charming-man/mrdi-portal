/**
 * Todo routes — BB-06
 */
import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import createHttpError from 'http-errors';

export const todoRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req) => {
    const q = req.query as { status?: string; source?: string };
    const todos = await app.prisma.todo.findMany({
      where: { owner_email: req.currentUser!.email, ...(q.status ? { status: q.status as 'open' | 'done' | 'dismissed' } : {}), ...(q.source ? { source: q.source } : {}) },
      orderBy: { created_at: 'desc' },
    });
    return { ok: true, data: todos };
  });

  app.post('/', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req) => {
    const b = req.body as { owner_email: string; source: string; related_id?: string; title: string; label: 'red' | 'green' | 'blue'; due_at?: string };
    const todo = await app.prisma.todo.create({ data: { owner_email: b.owner_email, source: b.source, related_id: b.related_id, title: b.title, label: b.label, due_at: b.due_at ? new Date(b.due_at) : null } });
    return { ok: true, data: todo };
  });

  app.patch('/:id', {
    onRequest: async (req) => { app.auth(req); },
  }, async (req) => {
    const p = req.params as { id: string };
    const b = req.body as { status?: 'done' | 'dismissed'; title?: string; label?: 'red' | 'green' | 'blue' };
    const existing = await app.prisma.todo.findUnique({ where: { id: p.id } });
    if (!existing) throw createHttpError.NotFound('Todo not found');
    if (existing.owner_email !== req.currentUser!.email) throw createHttpError.Forbidden('Cannot update others todo');
    const updated = await app.prisma.todo.update({ where: { id: p.id }, data: { ...(b.status ? { status: b.status } : {}), ...(b.title ? { title: b.title } : {}), ...(b.label ? { label: b.label } : {}) } });
    return { ok: true, data: updated };
  });
};
