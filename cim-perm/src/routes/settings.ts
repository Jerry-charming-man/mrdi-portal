/**
 * Settings routes
 * GET  /perm-api/v1/settings/perm-types
 * PUT  /perm-api/v1/settings/perm-types
 * GET  /perm-api/v1/settings/system-owners
 * PUT  /perm-api/v1/settings/system-owners
 * GET  /perm-api/v1/settings/notifications
 * PUT  /perm-api/v1/settings/notifications
 */
import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  getPermTypes, updatePermTypeConfig,
  getSystemOwners, upsertSystemOwner,
  getNotifSettings, updateNotifSettings,
} from '../services/configService.js';

export const settingsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('onRequest', async (req) => app.auth(req));

  // GET /settings/perm-types (viewer+) — 查看可用权限类型
  app.get('/settings/perm-types', async (req, reply) => {
    if (!['viewer', 'editor', 'auditor', 'admin'].includes(req.currentUser!.role)) {
      return reply.code(403).send({ error: { code: 'FORBIDDEN', message: '需要 viewer+ 角色，当前为 ' + req.currentUser!.role } });
    }
    try {
      return reply.send(await getPermTypes());
    } catch (e: unknown) {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: (e as Error).message } });
    }
  });

  // PUT /settings/perm-types
  const UpdatePermTypeSchema = z.object({
    code: z.string(),
    default_duration: z.string().optional(),
    min_duration: z.string().optional(),
    max_duration: z.string().optional(),
    enabled: z.boolean().optional(),
  });
  app.put('/settings/perm-types', async (req, reply) => {
    if (req.currentUser!.role !== 'admin') {
      return reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Admin only' } });
    }
    const parsed = UpdatePermTypeSchema.safeParse(req.body);
    if (!parsed.success || !parsed.data.code) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Missing code' } });
    }
    const { code, ...updates } = parsed.data;
    try {
      const row = await updatePermTypeConfig(code, updates);
      return reply.send(row);
    } catch (e: unknown) {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: (e as Error).message } });
    }
  });

  // GET /settings/system-owners (viewer+) — 查看系统 Owner 映射
  app.get('/settings/system-owners', async (req, reply) => {
    if (!['viewer', 'editor', 'auditor', 'admin'].includes(req.currentUser!.role)) {
      return reply.code(403).send({ error: { code: 'FORBIDDEN', message: '需要 viewer+ 角色，当前为 ' + req.currentUser!.role } });
    }
    try {
      return reply.send(await getSystemOwners());
    } catch (e: unknown) {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: (e as Error).message } });
    }
  });

  // PUT /settings/system-owners
  const UpdateSystemOwnerSchema = z.object({
    system_code: z.string().min(1),
    owner_email: z.string().email(),
    owner_name: z.string().optional(),
  });
  app.put('/settings/system-owners', async (req, reply) => {
    if (req.currentUser!.role !== 'admin') {
      return reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Admin only' } });
    }
    const parsed = UpdateSystemOwnerSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Missing fields' } });
    }
    try {
      const row = await upsertSystemOwner(
        parsed.data.system_code,
        parsed.data.owner_email,
        parsed.data.owner_name ?? '',
        req.currentUser!.email,
      );
      return reply.send(row);
    } catch (e: unknown) {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: (e as Error).message } });
    }
  });

  // GET /settings/notifications (viewer+)
  app.get('/settings/notifications', async (req, reply) => {
    if (!['viewer', 'editor', 'auditor', 'admin'].includes(req.currentUser!.role)) {
      return reply.code(403).send({ error: { code: 'FORBIDDEN', message: '需要 viewer+ 角色，当前为 ' + req.currentUser!.role } });
    }
    try {
      return reply.send(await getNotifSettings(req.currentUser!.email));
    } catch (e: unknown) {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: (e as Error).message } });
    }
  });

  // PUT /settings/notifications (viewer+)
  const UpdateNotifSchema = z.object({
    in_app: z.boolean().optional(),
    email: z.boolean().optional(),
    bb06: z.boolean().optional(),
    expiring_reminder_hours: z.number().int().min(0).optional(),
  });
  app.put('/settings/notifications', async (req, reply) => {
    if (!['viewer', 'editor', 'auditor', 'admin'].includes(req.currentUser!.role)) {
      return reply.code(403).send({ error: { code: 'FORBIDDEN', message: '需要 viewer+ 角色，当前为 ' + req.currentUser!.role } });
    }
    const parsed = UpdateNotifSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } });
    }
    try {
      await updateNotifSettings(req.currentUser!.email, parsed.data);
      return reply.send(await getNotifSettings(req.currentUser!.email));
    } catch (e: unknown) {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: (e as Error).message } });
    }
  });
};
