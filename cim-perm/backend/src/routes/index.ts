import { Router, Request, Response } from 'express'
import { authMiddleware, requireRole } from '../middleware/auth'
import {
  createRequest, listRequests, getRequest,
  itReview, ownerReview, revokeRequest, withdrawRequest,
  extendRequest, addComment, dashboardStats,
  listExpiringSoon, getAuditLog,
} from '../services/requestService'
import { AuditService } from '../services/auditService'
import {
  getPermTypes, updatePermTypeConfig,
  getSystemOwners, upsertSystemOwner,
  getNotifSettings, updateNotifSettings,
} from '../services/configService'
import type { CreateRequestBody, ReviewBody, RevokeBody, ExtendBody, CommentBody } from '../types'

export function createRouter(): Router {
  const router = Router()
  const auditService = new AuditService()

  // ── Health ──────────────────────────────────────────────────
  router.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))

  // All routes below require auth
  router.use(authMiddleware)

  // ── Helpers ────────────────────────────────────────────────
  function requireAuth(req: Request & { user?: { email: string; name: string; role: string; dept: string } }, res: Response) {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return true }
    return false
  }

  // ── Requests CRUD ──────────────────────────────────────────
  router.post('/requests', async (req, res) => {
    if (requireAuth(req as Parameters<typeof requireAuth>[0], res)) return
    try {
      const body = req.body as CreateRequestBody
      if (!body.target_system || !body.permission_type || !body.permission_level ||
          !body.resource_id   || !body.reason         || !body.requested_duration) {
        return res.status(400).json({ error: 'Missing required fields' })
      }
      const row = await createRequest(body, req.user!)
      res.status(201).json(row)
    } catch (e: unknown) {
      const err = e as { status?: number; message: string }
      res.status(err.status ?? 500).json({ error: err.message })
    }
  })

  function safeInt(val: unknown, fallback: number): number {
    const n = parseInt(val as string)
    return isNaN(n) ? fallback : n
  }

  router.get('/requests', async (req, res) => {
    if (requireAuth(req as Parameters<typeof requireAuth>[0], res)) return
    try {
      const result = await listRequests({
        status:     req.query.status     as string,
        type:       req.query.type       as string,
        system:     req.query.system     as string,
        applicant:  req.query.applicant   as string,
        search:     req.query.search     as string,
        page:       safeInt(req.query.page,     1),
        pageSize:   safeInt(req.query.pageSize, 10),
        view:       req.query.view      as 'all' | 'mine' | 'it_review' | 'owner_review' | 'expiring',
        userEmail:  req.user!.email,
        userRole:   req.user!.role,
      })
      res.json(result)
    } catch (e: unknown) {
      res.status(500).json({ error: (e as Error).message })
    }
  })

  router.get('/requests/:id', async (req, res) => {
    if (requireAuth(req as Parameters<typeof requireAuth>[0], res)) return
    try {
      const row = await getRequest(req.params.id)
      if (!row) return res.status(404).json({ error: '申请不存在' })
      res.json(row)
    } catch (e: unknown) {
      res.status(500).json({ error: (e as Error).message })
    }
  })

  router.get('/requests/:id/audit', async (req, res) => {
    if (requireAuth(req as Parameters<typeof requireAuth>[0], res)) return
    try {
      const rows = await getAuditLog(req.params.id)
      res.json(rows)
    } catch (e: unknown) {
      res.status(500).json({ error: (e as Error).message })
    }
  })

  // IT Review (editor role)
  router.post('/requests/:id/it-review',
    requireRole('editor', 'admin'),
    async (req, res) => {
      try {
        const body = req.body as ReviewBody
        const row  = await itReview(req.params.id, body, req.user!)
        res.json(row)
      } catch (e: unknown) {
        const err = e as { status?: number; message: string }
        res.status(err.status ?? 500).json({ error: err.message })
      }
    }
  )

  // Owner Review (auditor role)
  router.post('/requests/:id/owner-review',
    requireRole('auditor', 'admin'),
    async (req, res) => {
      try {
        const body = req.body as ReviewBody
        const row  = await ownerReview(req.params.id, body, req.user!)
        res.json(row)
      } catch (e: unknown) {
        const err = e as { status?: number; message: string }
        res.status(err.status ?? 500).json({ error: err.message })
      }
    }
  )

  // Revoke
  router.post('/requests/:id/revoke',
    requireRole('auditor', 'admin'),
    async (req, res) => {
      try {
        const body = req.body as RevokeBody
        if (!body.reason?.trim()) return res.status(400).json({ error: '必须填写撤销原因' })
        const row = await revokeRequest(req.params.id, body, req.user!)
        res.json(row)
      } catch (e: unknown) {
        const err = e as { status?: number; message: string }
        res.status(err.status ?? 500).json({ error: err.message })
      }
    }
  )

  // Withdraw (applicant)
  router.post('/requests/:id/withdraw', async (req, res) => {
    try {
      const row = await withdrawRequest(req.params.id, req.user!)
      res.json(row)
    } catch (e: unknown) {
      const err = e as { status?: number; message: string }
      res.status(err.status ?? 500).json({ error: err.message })
    }
  })

  // Extend
  router.post('/requests/:id/extend',
    requireRole('auditor', 'admin'),
    async (req, res) => {
      try {
        const body = req.body as ExtendBody
        if (!body.new_duration) return res.status(400).json({ error: 'Missing new_duration' })
        const row = await extendRequest(req.params.id, body, req.user!)
        res.json(row)
      } catch (e: unknown) {
        const err = e as { status?: number; message: string }
        res.status(err.status ?? 500).json({ error: err.message })
      }
    }
  )

  // Comment
  router.post('/requests/:id/comment', async (req, res) => {
    try {
      const body = req.body as CommentBody
      if (!body.comment?.trim()) return res.status(400).json({ error: 'Missing comment' })
      await addComment(req.params.id, body, req.user!)
      res.json({ ok: true })
    } catch (e: unknown) {
      res.status(500).json({ error: (e as Error).message })
    }
  })

  // ── Dashboard ──────────────────────────────────────────────
  router.get('/dashboard/me', async (req, res) => {
    try {
      const stats = await dashboardStats(req.user!.email, req.user!.role)
      res.json(stats)
    } catch (e: unknown) {
      res.status(500).json({ error: (e as Error).message })
    }
  })

  // ── Expiring soon ────────────────────────────────────────
  router.get('/expiring-soon', async (req, res) => {
    try {
      const rows = await listExpiringSoon(req.user!.email, req.user!.role)
      res.json(rows)
    } catch (e: unknown) {
      res.status(500).json({ error: (e as Error).message })
    }
  })

  // ── Audit ────────────────────────────────────────────────
  router.get('/audit', requireRole('auditor', 'editor', 'admin'), async (req, res) => {
    try {
      const result = await auditService.list({
        eventType:   req.query.eventType   as 'all' | undefined,
        actorEmail:  req.query.actor       as string | undefined,
        requestId:  req.query.request_id  as string | undefined,
        from:       req.query.from        as string | undefined,
        to:         req.query.to          as string | undefined,
        page:       safeInt(req.query.page,     1),
        pageSize:   safeInt(req.query.pageSize, 10),
      })
      res.json(result)
    } catch (e: unknown) {
      res.status(500).json({ error: (e as Error).message })
    }
  })

  // ── Perm Types ────────────────────────────────────────────
  router.get('/perm-types', async (_req, res) => {
    try {
      const rows = await getPermTypes()
      res.json(rows)
    } catch (e: unknown) {
      res.status(500).json({ error: (e as Error).message })
    }
  })

  // ── Settings ──────────────────────────────────────────────
  router.get('/settings/perm-types', requireRole('admin'), async (_req, res) => {
    try { res.json(await getPermTypes()) }
    catch (e: unknown) { res.status(500).json({ error: (e as Error).message }) }
  })

  router.put('/settings/perm-types', requireRole('admin'), async (req, res) => {
    try {
      const { code, ...updates } = req.body
      if (!code) return res.status(400).json({ error: 'Missing code' })
      const row = await updatePermTypeConfig(code, updates)
      res.json(row)
    } catch (e: unknown) {
      res.status(500).json({ error: (e as Error).message })
    }
  })

  router.get('/settings/system-owners', async (_req, res) => {
    try { res.json(await getSystemOwners()) }
    catch (e: unknown) { res.status(500).json({ error: (e as Error).message }) }
  })

  router.put('/settings/system-owners', requireRole('admin'), async (req, res) => {
    try {
      const { system_code, owner_email, owner_name } = req.body
      if (!system_code || !owner_email) {
        return res.status(400).json({ error: 'Missing fields' })
      }
      const row = await upsertSystemOwner(system_code, owner_email, owner_name ?? '', req.user!.email)
      res.json(row)
    } catch (e: unknown) {
      res.status(500).json({ error: (e as Error).message })
    }
  })

  router.get('/settings/notifications', async (req, res) => {
    try {
      res.json(await getNotifSettings(req.user!.email))
    } catch (e: unknown) {
      res.status(500).json({ error: (e as Error).message })
    }
  })

  router.put('/settings/notifications', async (req, res) => {
    try {
      await updateNotifSettings(req.user!.email, req.body)
      res.json(await getNotifSettings(req.user!.email))
    } catch (e: unknown) {
      res.status(500).json({ error: (e as Error).message })
    }
  })

  return router
}
