import { v4 as uuidv4 } from 'uuid'
import { query } from '../db/pool.js'
import type { AuditEvent, ActorRole, PermStatus } from '../types/index.js'

interface AuditLogParams {
  requestId:  string
  eventType:  AuditEvent
  fromStatus?: PermStatus | null
  toStatus?:   PermStatus | null
  actorEmail: string
  actorName?: string
  actorRole:  ActorRole
  comment?:   string
  metadata?:  Record<string, unknown>
}

export class AuditService {
  async log(params: AuditLogParams): Promise<void> {
    const id = uuidv4()
    await query(
      `INSERT INTO permission_audit
         (id, request_id, event_type, from_status, to_status,
          actor_email, actor_name, actor_role, comment, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id,
        params.requestId,
        params.eventType,
        params.fromStatus ?? null,
        params.toStatus ?? null,
        params.actorEmail,
        params.actorName ?? null,
        params.actorRole,
        params.comment ?? null,
        JSON.stringify(params.metadata ?? {}),
      ]
    )
  }

  async list(params: {
    eventType?:   AuditEvent | 'all'
    actorEmail?:   string
    requestId?:   string
    from?:         string
    to?:           string
    page?:         number
    pageSize?:     number
  }) {
    const conditions = ['1=1']
    const values: unknown[] = []
    let p = 1

    if (params.eventType && params.eventType !== 'all') {
      conditions.push(`a.event_type = $${p++}`)
      values.push(params.eventType)
    }
    if (params.actorEmail) {
      conditions.push(`a.actor_email = $${p++}`)
      values.push(params.actorEmail)
    }
    if (params.requestId) {
      conditions.push(`a.request_id = $${p++}`)
      values.push(params.requestId)
    }
    if (params.from) {
      conditions.push(`a.created_at >= $${p++}`)
      values.push(params.from)
    }
    if (params.to) {
      conditions.push(`a.created_at <= $${p++}`)
      values.push(params.to)
    }

    const where = conditions.join(' AND ')
    const page     = Math.max(1, params.page ?? 1)
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20))
    const offset   = (page - 1) * pageSize

    const rows = await query(
      `SELECT a.*, r.request_no
       FROM permission_audit a
       JOIN permission_request r ON r.id = a.request_id
       WHERE ${where}
       ORDER BY a.created_at DESC
       LIMIT $${p++} OFFSET $${p}`,
      [...values, pageSize, offset]
    )

    return { data: rows, page, pageSize }
  }
}
