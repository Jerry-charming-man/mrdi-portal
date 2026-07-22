import { Request, Response, NextFunction } from 'express'
import * as dotenv from 'dotenv'
import type { AuthUser } from '../types'

dotenv.config()

// In production: verify JWT against Entra ID
// In dev: read from dev token header or .env
export function authMiddleware(
  req: Request & { user?: AuthUser },
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization ?? ''

  // ── Production path: Bearer JWT ──
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const payload = parseJwtPayload(token)
      req.user = {
        email:  payload.email  ?? payload.upn ?? '',
        name:   payload.name  ?? payload.preferred_username ?? '未知',
        dept:   payload.dept  ?? payload.department       ?? '未知部门',
        role:   mapM365RoleToAppRole(payload.roles ?? []),
      }
      return next()
    } catch {
      return res.status(401).json({ error: 'Invalid token' })
    }
  }

  // ── Dev path: ?dev_email=xxx ──
  const devEmail = (req.query.dev_email as string) ?? process.env.DEV_USER_EMAIL
  if (process.env.NODE_ENV === 'development' && devEmail) {
    req.user = {
      email: devEmail,
      name:  devEmail.split('@')[0],
      dept:  'Fab Operations',
      role:  (process.env.DEV_USER_ROLE as AuthUser['role']) ?? 'viewer',
    }
    return next()
  }

  return res.status(401).json({ error: 'Missing or invalid authorization' })
}

// ── JWT payload parser (no external lib needed for reading claims) ──
function parseJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Malformed JWT')
  const payload = Buffer.from(parts[1], 'base64url').toString('utf-8')
  return JSON.parse(payload)
}

// Map M365 app roles → CIM-PERM roles
function mapM365RoleToAppRole(m365Roles: string[]): AuthUser['role'] {
  if (m365Roles.includes('cim-perm-admin'))    return 'admin'
  if (m365Roles.includes('cim-perm-auditor')) return 'auditor'
  if (m365Roles.includes('cim-perm-editor'))  return 'editor'
  return 'viewer'
}

// ── Role guard helpers ──
export function requireRole(...roles: AuthUser['role'][]) {
  return (req: Request & { user?: AuthUser }, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Requires role: ${roles.join(' or ')}` })
    }
    next()
  }
}
