/**
 * Auth plugin — Fastify JWT + dev_login
 *
 * Dev: dev_login query param → bypass JWT
 * Prod: Bearer JWT → extract user info
 *
 * AuthUser.department matches @mrdi/shared/permission AuthUser interface
 */
import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyRequest, FastifyInstance } from 'fastify';
import createHttpError from 'http-errors';
import type { AuthUser } from '../types/index.js';

export const authPlugin: FastifyPluginAsync<{
  secret: string;
  expiresIn: string;
  devLoginEnabled: boolean;
}> = fp(async (app: FastifyInstance, opts: { secret: string; expiresIn: string; devLoginEnabled: boolean }) => {
  const { secret, expiresIn, devLoginEnabled } = opts;

  await app.register(import('@fastify/jwt'), { secret, sign: { expiresIn } });

  app.decorateRequest('currentUser', null);

  app.addHook('onRequest', async (req: FastifyRequest) => {
    // ── Check dev_login bypass first (works for load testing / dev) ──
    // Check both req.url (may strip query string in some Fastify contexts)
    // and req.query for robustness
    const url = req.url;
    const q = req.query as Record<string, string | undefined>;
    const hasDevBypass = url.includes('dev_login')
      || url.includes('dev_email')
      || q['dev_login'] !== undefined
      || q['dev_email'] !== undefined;

    if (hasDevBypass) {
      req.currentUser = {
        email: q['email'] ?? q['dev_email'] ?? 'dev@mrdi.local',
        name: q['name'] ?? (q['email'] ?? q['dev_email'] ?? 'dev@mrdi.local').split('@')[0] ?? 'Dev User',
        department: q['department'] ?? 'Fab Operations',
        role: (q['role'] ?? 'viewer') as AuthUser['role'],
      };
      return;
    }

    // ── Skip JWT for known public sub-paths only ──
    // NOTE: do NOT blanket-skip all /perm-api/ — the routes ARE protected
    if (url.startsWith('/perm-api/v1/health')) {
      return;
    }

    // ── Protected route: verify JWT ──
    try {
      const payload = await req.jwtVerify() as Record<string, unknown>;
      req.currentUser = {
        email: (payload.email as string | undefined) ?? (payload.upn as string | undefined) ?? '',
        name: (payload.name as string | undefined) ?? (payload.preferred_username as string | undefined) ?? 'Unknown',
        department: (payload.department as string | undefined) ?? (payload.dept as string | undefined) ?? 'Unknown',
        role: mapRoleFromPayload(payload),
      };
    } catch {
      // currentUser stays null — route-level app.auth() will throw if needed
      req.currentUser = null;
    }
  });

  app.decorate('auth', (req: FastifyRequest) => {
    if (!req.currentUser) throw createHttpError.Unauthorized();
    return req.currentUser as AuthUser;
  });
});

/**
 * Map role from JWT payload.
 *
 * Supports two formats:
 * 1. mdm-api dev-login / standard JWT: payload.role = 'admin' | 'editor' | 'auditor' | 'viewer'
 * 2. M365 OAuth mock: payload.roles = ['cim-perm-admin', ...] (array format)
 *
 * Payload format 1 takes priority (explicit role is more reliable).
 */
function mapRoleFromPayload(payload: Record<string, unknown>): AuthUser['role'] {
  // Format 1: explicit role string (mdm-api dev-login / standard JWT)
  const explicitRole = payload.role as string | undefined;
  if (explicitRole && ['admin', 'auditor', 'editor', 'viewer'].includes(explicitRole)) {
    return explicitRole as AuthUser['role'];
  }

  // Format 2: M365 OAuth roles array
  const m365Roles = (payload.roles as string[] | undefined) ?? [];
  if (m365Roles.includes('cim-perm-admin'))   return 'admin';
  if (m365Roles.includes('cim-perm-auditor')) return 'auditor';
  if (m365Roles.includes('cim-perm-editor')) return 'editor';
  return 'viewer';
}

declare module 'fastify' {
  interface FastifyInstance {
    auth: (req: FastifyRequest) => AuthUser;
  }
}
