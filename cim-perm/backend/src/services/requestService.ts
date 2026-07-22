import { v4 as uuidv4 } from 'uuid'
import { query, queryOne } from '../db/pool'
import { AuditService } from './auditService'
import { MDMService } from './mdmService'
import { parseDuration } from '../utils/duration'
import type {
  PermRequestRow, PermAuditRow,
  CreateRequestBody, AuthUser,
  PermStatus, PermType, PermLevel, Urgency
} from '../types'

const audit = new AuditService()
const mdm   = new MDMService()

// Generate sequential request number: PRM-YYYY-NNNN
async function nextRequestNo(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `PRM-${year}-`
  const rows = await query<{ cnt: string }>(
    `SELECT COUNT(*)::text AS cnt FROM permission_request WHERE request_no LIKE $1`,
    [prefix + '%']
  )
  const seq = (parseInt(rows[0]?.cnt || '0') + 1).toString().padStart(4, '0')
  return prefix + seq
}

// Duration config validation
const DURATION_MAX: Record<PermType, string> = {
  system_access: '730d',
  functional:    '90d',
  data_export:   '30d',
  temporary:     '48h',
  batch:         '365d',
}

function validateDuration(type: PermType, requested: string): void {
  const max = DURATION_MAX[type]
  if (parseDuration(requested) > parseDuration(max)) {
    throw Object.assign(new Error(`申请时长 ${requested} 超出 ${type} 的上限 ${max}`), { status: 400 })
  }
}

// ============================================================
// Create request
// ============================================================
export async function createRequest(
  body: CreateRequestBody,
  user: AuthUser
): Promise<PermRequestRow> {
  validateDuration(body.permission_type, body.requested_duration)

  const id         = uuidv4()
  const requestNo   = await nextRequestNo()
  const expiresAt  = new Date(Date.now() + parseDuration(body.requested_duration) * 1000)

  const row = await queryOne<PermRequestRow>(
    `INSERT INTO permission_request
       (id, request_no, applicant_email, applicant_name, applicant_dept,
        target_system, permission_type, permission_level, resource_id, reason,
        attachment_ids, related_incident_id, related_request_id,
        requested_duration, expires_at, status, urgency)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'pending_it_review',$16)
     RETURNING *`,
    [
      id, requestNo,
      user.email, user.name, user.dept,
      body.target_system, body.permission_type, body.permission_level,
      body.resource_id, body.reason,
      JSON.stringify(body.attachment_ids ?? []),
      body.related_incident_id ?? null,
      body.related_request_id ?? null,
      body.requested_duration, expiresAt,
      body.urgency ?? 'normal',
    ]
  )

  await audit.log({
    requestId:  id,
    eventType: 'submit',
    actorEmail: user.email,
    actorName:  user.name,
    actorRole:  'applicant',
    comment:    body.reason.slice(0, 100),
  })

  return row!
}

// ============================================================
// List requests
// ============================================================
export async function listRequests(params: {
  status?:       string
  type?:         string
  system?:       string
  applicant?:    string
  search?:       string
  page?:         number
  pageSize?:     number
  view?:         'all' | 'mine' | 'it_review' | 'owner_review' | 'expiring'
  userEmail?:    string
  userRole?:     string
  userSystem?:   string   // for auditor role
}) {
  const page     = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 10))
  const offset   = (page - 1) * pageSize
  const conditions: string[] = ['1=1']
  const values: unknown[] = []
  let p = 1

  // Role-based filtering
  if (params.userRole === 'viewer') {
    conditions.push(`applicant_email = $${p++}`)
    values.push(params.userEmail)
  } else if (params.userRole === 'auditor') {
    // Auditor sees only their own system's requests
    // (simplified: auditor sees all for now, real impl would filter by target_system)
  }

  if (params.view === 'mine') {
    conditions.push(`applicant_email = $${p++}`)
    values.push(params.userEmail)
  } else if (params.view === 'it_review') {
    conditions.push(`status = 'pending_it_review'`)
  } else if (params.view === 'owner_review') {
    conditions.push(`status = 'pending_owner_review'`)
  } else if (params.view === 'expiring') {
    conditions.push(`status IN ('granted','expiring_soon')`)
  }

  if (params.status) {
    conditions.push(`status = $${p++}`)
    values.push(params.status)
  }
  if (params.type) {
    conditions.push(`permission_type = $${p++}`)
    values.push(params.type)
  }
  if (params.system) {
    conditions.push(`target_system = $${p++}`)
    values.push(params.system)
  }
  if (params.applicant) {
    conditions.push(`applicant_email = $${p++}`)
    values.push(params.applicant)
  }
  if (params.search) {
    conditions.push(`(request_no ILIKE $${p} OR resource_id ILIKE $${p} OR applicant_name ILIKE $${p})`)
    values.push('%' + params.search + '%')
    p++
  }

  const where = conditions.join(' AND ')

  const countRows = await queryOne<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM permission_request WHERE ${where}`, values
  )
  const total = parseInt(countRows?.total || '0')

  const rows = await query<PermRequestRow>(
    `SELECT * FROM permission_request WHERE ${where}
     ORDER BY created_at DESC LIMIT $${p++} OFFSET $${p}`,
    [...values, pageSize, offset]
  )

  return { data: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

// ============================================================
// Get single request
// ============================================================
export async function getRequest(id: string): Promise<PermRequestRow | null> {
  return queryOne<PermRequestRow>(`SELECT * FROM permission_request WHERE id = $1`, [id])
}

// ============================================================
// IT Review
// ============================================================
export async function itReview(
  id: string,
  body: { action: 'approve' | 'reject'; comment?: string },
  user: AuthUser
): Promise<PermRequestRow> {
  const req = await getRequest(id)
  if (!req) throw Object.assign(new Error('申请不存在'), { status: 404 })
  if (req.status !== 'pending_it_review') {
    throw Object.assign(new Error('当前状态不允许 IT 审核'), { status: 400 })
  }
  if (body.action === 'reject' && !body.comment?.trim()) {
    throw Object.assign(new Error('驳回时必须填写原因'), { status: 400 })
  }

  const newStatus: PermStatus = body.action === 'approve'
    ? 'pending_owner_review'
    : 'rejected'

  const row = await queryOne<PermRequestRow>(
    `UPDATE permission_request SET
       status = $1,
       it_reviewer_email = $2,
       it_reviewer_name = $3,
       it_reviewed_at   = NOW(),
       reject_reason = CASE WHEN $1 = 'rejected' THEN $4 ELSE NULL END,
       closed_at     = CASE WHEN $1 = 'rejected' THEN NOW() ELSE NULL END
     WHERE id = $5
     RETURNING *`,
    [newStatus, user.email, user.name, body.comment ?? null, id]
  )

  await audit.log({
    requestId:  id,
    eventType: 'it_review',
    fromStatus: req.status,
    toStatus:   newStatus,
    actorEmail: user.email,
    actorName:  user.name,
    actorRole:  'it',
    comment:    body.comment,
  })

  return row!
}

// ============================================================
// Owner Review
// ============================================================
export async function ownerReview(
  id: string,
  body: { action: 'approve' | 'reject'; comment?: string },
  user: AuthUser
): Promise<PermRequestRow> {
  const req = await getRequest(id)
  if (!req) throw Object.assign(new Error('申请不存在'), { status: 404 })
  if (req.status !== 'pending_owner_review') {
    throw Object.assign(new Error('当前状态不允许 Owner 核准'), { status: 400 })
  }
  if (body.action === 'reject' && !body.comment?.trim()) {
    throw Object.assign(new Error('驳回时必须填写原因'), { status: 400 })
  }

  let row: PermRequestRow | null = null

  if (body.action === 'approve') {
    // Call MDM to grant permission
    const grantResult = await mdm.grantPermission({
      user_email:   req.applicant_email,
      resource_id:   req.resource_id,
      permission:   `${req.permission_type}:${req.permission_level}`,
      expires_at:   req.expires_at,
      granted_by:   user.email,
    })

    row = await queryOne<PermRequestRow>(
      `UPDATE permission_request SET
         status = 'pending_grant',
         owner_reviewer_email = $1,
         owner_reviewer_name  = $2,
         owner_reviewed_at      = NOW()
       WHERE id = $3
       RETURNING *`,
      [user.email, user.name, id]
    )

    // Immediately mark as granted after MDM grant
    await queryOne<PermRequestRow>(
      `UPDATE permission_request SET
         status = 'granted',
         grant_id = $1,
         updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [grantResult.grant_id, id]
    )
    const updated = await getRequest(id)

    await audit.log({
      requestId:  id,
      eventType: 'owner_review',
      fromStatus: req.status,
      toStatus:   'pending_grant',
      actorEmail: user.email,
      actorName:  user.name,
      actorRole:  'owner',
      comment:    body.comment,
    })
    await audit.log({
      requestId:  id,
      eventType: 'grant',
      fromStatus: 'pending_grant',
      toStatus:   'granted',
      actorEmail: 'system',
      actorName:  '系统',
      actorRole:  'system',
      metadata:   { grant_id: grantResult.grant_id, duration: req.requested_duration },
    })
    return updated!
  } else {
    row = await queryOne<PermRequestRow>(
      `UPDATE permission_request SET
         status = 'rejected',
         owner_reviewer_email = $1,
         owner_reviewer_name  = $2,
         owner_reviewed_at      = NOW(),
         reject_reason         = $3,
         closed_at             = NOW()
       WHERE id = $4
       RETURNING *`,
      [user.email, user.name, body.comment ?? null, id]
    )
  }

  await audit.log({
    requestId:  id,
    eventType: 'owner_review',
    fromStatus: req.status,
    toStatus:   'rejected',
    actorEmail: user.email,
    actorName:  user.name,
    actorRole:  'owner',
    comment:    body.comment,
  })

  return row!
}

// ============================================================
// Revoke
// ============================================================
export async function revokeRequest(
  id: string,
  body: { reason: string },
  user: AuthUser
): Promise<PermRequestRow> {
  const req = await getRequest(id)
  if (!req) throw Object.assign(new Error('申请不存在'), { status: 404 })
  if (!['granted', 'expiring_soon'].includes(req.status)) {
    throw Object.assign(new Error('仅已授予的权限可撤销'), { status: 400 })
  }

  if (req.grant_id) {
    await mdm.revokePermission(req.grant_id)
  }

  const row = await queryOne<PermRequestRow>(
    `UPDATE permission_request SET
       status = 'revoked',
       revoke_reason = $1,
       closed_at    = NOW(),
       updated_at   = NOW()
     WHERE id = $2
     RETURNING *`,
    [body.reason, id]
  )

  await audit.log({
    requestId:  id,
    eventType: 'revoke',
    fromStatus: req.status,
    toStatus:   'revoked',
    actorEmail: user.email,
    actorName:  user.name,
    actorRole:  user.role === 'admin' ? 'admin' : 'owner',
    comment:    body.reason,
    metadata:  { grant_id: req.grant_id },
  })

  return row!
}

// ============================================================
// Withdraw (applicant)
// ============================================================
export async function withdrawRequest(
  id: string,
  user: AuthUser
): Promise<PermRequestRow> {
  const req = await getRequest(id)
  if (!req) throw Object.assign(new Error('申请不存在'), { status: 404 })
  if (req.applicant_email !== user.email) {
    throw Object.assign(new Error('只能撤回自己的申请'), { status: 403 })
  }
  if (!['pending_it_review', 'pending_owner_review'].includes(req.status)) {
    throw Object.assign(new Error('当前状态不允许撤回'), { status: 400 })
  }

  const row = await queryOne<PermRequestRow>(
    `UPDATE permission_request SET
       status   = 'revoked',
       closed_at = NOW(),
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id]
  )

  await audit.log({
    requestId:  id,
    eventType: 'withdraw',
    fromStatus: req.status,
    toStatus:   'revoked',
    actorEmail: user.email,
    actorName:  user.name,
    actorRole:  'applicant',
  })

  return row!
}

// ============================================================
// Extend (renew)
// ============================================================
export async function extendRequest(
  id: string,
  body: { new_duration: string },
  user: AuthUser
): Promise<PermRequestRow> {
  const req = await getRequest(id)
  if (!req) throw Object.assign(new Error('申请不存在'), { status: 404 })
  validateDuration(req.permission_type, body.new_duration)

  const newExpiresAt = new Date(Date.now() + parseDuration(body.new_duration) * 1000)

  // Extend MDM grant if exists
  if (req.grant_id) {
    await mdm.extendPermission(req.grant_id, newExpiresAt)
  }

  const row = await queryOne<PermRequestRow>(
    `UPDATE permission_request SET
       expires_at = $1,
       status     = 'granted',
       updated_at  = NOW()
     WHERE id = $2
     RETURNING *`,
    [newExpiresAt, id]
  )

  await audit.log({
    requestId:  id,
    eventType: 'extend',
    actorEmail: user.email,
    actorName:  user.name,
    actorRole:  user.role === 'admin' ? 'admin' : 'owner',
    metadata:  { new_duration: body.new_duration, new_expires_at: newExpiresAt.toISOString() },
  })

  return row!
}

// ============================================================
// Comment
// ============================================================
export async function addComment(
  id: string,
  body: { comment: string },
  user: AuthUser
): Promise<void> {
  await audit.log({
    requestId:  id,
    eventType: 'comment',
    actorEmail: user.email,
    actorName:  user.name,
    actorRole:  'applicant',
    comment:    body.comment,
  })
}

// ============================================================
// Dashboard stats
// ============================================================
export async function dashboardStats(userEmail: string, role: string) {
  const base = role === 'viewer'
    ? `applicant_email = '${userEmail}'`
    : '1=1'

  const [
    myTotal,
    granted,
    expiringSoon,
    pendingIT,
    pendingOwner,
  ] = await Promise.all([
    queryOne<{ cnt: string }>(`SELECT COUNT(*)::text AS cnt FROM permission_request WHERE ${base}`),
    queryOne<{ cnt: string }>(`SELECT COUNT(*)::text AS cnt FROM permission_request WHERE ${base} AND status = 'granted'`),
    queryOne<{ cnt: string }>(`SELECT COUNT(*)::text AS cnt FROM permission_request WHERE ${base} AND status = 'expiring_soon'`),
    queryOne<{ cnt: string }>(`SELECT COUNT(*)::text AS cnt FROM permission_request WHERE status = 'pending_it_review'`),
    queryOne<{ cnt: string }>(`SELECT COUNT(*)::text AS cnt FROM permission_request WHERE status = 'pending_owner_review'`),
  ])

  const weekGranted = await queryOne<{ cnt: string }>(
    `SELECT COUNT(*)::text AS cnt FROM permission_request
     WHERE status = 'granted' AND created_at > NOW() - INTERVAL '7 days'`
  )
  const weekRevoked = await queryOne<{ cnt: string }>(
    `SELECT COUNT(*)::text AS cnt FROM permission_request
     WHERE status = 'revoked' AND updated_at > NOW() - INTERVAL '7 days'`
  )

  return {
    my_total:       parseInt(myTotal?.cnt || '0'),
    granted:       parseInt(granted?.cnt || '0'),
    expiring_soon:  parseInt(expiringSoon?.cnt || '0'),
    pending_it:    parseInt(pendingIT?.cnt || '0'),
    pending_owner: parseInt(pendingOwner?.cnt || '0'),
    week_granted:   parseInt(weekGranted?.cnt || '0'),
    week_revoked:   parseInt(weekRevoked?.cnt || '0'),
  }
}

// ============================================================
// List expiring soon
// ============================================================
export async function listExpiringSoon(userEmail?: string, role?: string): Promise<PermRequestRow[]> {
  const base = (userEmail && role === 'viewer')
    ? `applicant_email = '${userEmail}' AND`
    : ''

  return query<PermRequestRow>(
    `SELECT * FROM permission_request
     WHERE ${base} status IN ('granted','expiring_soon')
       AND expires_at < NOW() + INTERVAL '25 hours'
       AND expires_at > NOW()
     ORDER BY expires_at ASC`
  )
}

// ============================================================
// Get audit log for a request
// ============================================================
export async function getAuditLog(requestId: string): Promise<PermAuditRow[]> {
  return query<PermAuditRow>(
    `SELECT * FROM permission_audit WHERE request_id = $1 ORDER BY created_at DESC`,
    [requestId]
  )
}

// ============================================================
// Mark expiring soon (called by cron)
// ============================================================
export async function markExpiringSoon(): Promise<number> {
  const result = await query<{ id: string }>(
    `UPDATE permission_request SET status = 'expiring_soon', updated_at = NOW()
     WHERE status = 'granted'
       AND expires_at < NOW() + INTERVAL '25 hours'
       AND expires_at > NOW()
     RETURNING id`
  )

  for (const row of result) {
    await audit.log({
      requestId:  row.id,
      eventType: 'expire_warning',
      toStatus:   'expiring_soon',
      actorEmail: 'system',
      actorName:  '系统',
      actorRole:  'system',
    })
  }

  return result.length
}

// ============================================================
// Auto-revoke expired (called by cron)
// ============================================================
export async function autoRevokeExpired(): Promise<number> {
  const expired = await query<PermRequestRow>(
    `SELECT * FROM permission_request
     WHERE status IN ('granted','expiring_soon')
       AND expires_at < NOW()`
  )

  for (const req of expired) {
    if (req.grant_id) {
      try {
        await mdm.revokePermission(req.grant_id)
      } catch (e) {
        console.error(`Failed to revoke grant ${req.grant_id}:`, e)
      }
    }

    await query(
      `UPDATE permission_request SET status = 'expired', closed_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [req.id]
    )

    await audit.log({
      requestId:  req.id,
      eventType: 'expire',
      fromStatus: req.status,
      toStatus:   'expired',
      actorEmail: 'system',
      actorName:  '系统',
      actorRole:  'system',
      metadata:   { grant_id: req.grant_id },
    })
  }

  return expired.length
}
