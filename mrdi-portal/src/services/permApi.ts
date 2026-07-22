/**
 * CIM-PERM V1.0 — API Service
 * Base URL: http://localhost:3003/perm-api/v1
 * Auth: dev_login query param (dev mode)
 */

import type {
  PermRequest, PermAudit, PermTodo,
} from '../types/cimperm'
import type { PermissionStatus, PermissionType, PermissionLevel, UrgencyLevel } from '../types/cimperm'

const BASE = 'http://localhost:3003/perm-api/v1'
const DEV_EMAIL = 'zhang.zh@mrdi.example'
const DEV_ROLE = 'editor'

// ─── Snake → Camel mapper ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function snakeToCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(snakeToCamel)
  if (obj !== null && typeof obj === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
      out[camel] = snakeToCamel(v)
    }
    return out
  }
  return obj
}

// ─── HTTP helpers ───────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}dev_login=true&email=${encodeURIComponent(DEV_EMAIL)}&role=${encodeURIComponent(DEV_ROLE)}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return snakeToCamel(await res.json()) as T
}

// ─── Types matching backend response ───────────────────────────────────────

interface BackendRequest {
  id: string; request_no: string; applicant_email: string; applicant_name: string
  applicant_dept: string; target_system: string; permission_type: string
  permission_level: string; resource_id: string; reason: string
  attachment_ids: string[]; related_incident_id?: string; related_request_id?: string
  requested_duration: string; expires_at: string; status: string
  urgency: string; it_reviewer_email?: string; it_reviewer_name?: string
  it_reviewed_at?: string; owner_reviewer_email?: string; owner_reviewer_name?: string
  owner_reviewed_at?: string; grant_id?: string; revoke_reason?: string
  reject_reason?: string; created_at: string; updated_at: string; closed_at?: string
}

interface BackendAudit {
  id: string; request_id: string; event_type: string; from_status?: string
  to_status?: string; actor_email: string; actor_name?: string
  actor_role: string; comment?: string; metadata?: Record<string, unknown>; created_at: string
}

interface BackendDashboard {
  my_total: number; granted: number; expiring_soon: number
  pending_it: number; pending_owner: number; week_granted: number; week_revoked: number
}

interface BackendList {
  data: BackendRequest[]; total: number; page: number; pageSize: number; totalPages: number
}

// ─── Mappers ────────────────────────────────────────────────────────────────

function mapRequest(r: BackendRequest): PermRequest {
  return {
    id: r.id,
    requestNo: r.request_no,
    applicantEmail: r.applicant_email,
    applicantName: r.applicant_name,
    applicantDept: r.applicant_dept,
    targetSystem: r.target_system,
    permissionType: r.permission_type as PermissionType,
    permissionLevel: r.permission_level as PermissionLevel,
    resourceId: r.resource_id,
    reason: r.reason,
    attachmentIds: r.attachment_ids,
    relatedIncidentId: r.related_incident_id,
    relatedRequestId: r.related_request_id,
    requestedDuration: r.requested_duration,
    expiresAt: r.expires_at,
    status: r.status as PermissionStatus,
    urgency: r.urgency as UrgencyLevel,
    itReviewerEmail: r.it_reviewer_email,
    itReviewerName: r.it_reviewer_name,
    itReviewedAt: r.it_reviewed_at,
    ownerReviewerEmail: r.owner_reviewer_email,
    ownerReviewerName: r.owner_reviewer_name,
    ownerReviewedAt: r.owner_reviewed_at,
    grantId: r.grant_id,
    revokeReason: r.revoke_reason,
    rejectReason: r.reject_reason,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    closedAt: r.closed_at,
  }
}

function mapAudit(a: BackendAudit): PermAudit {
  return {
    id: a.id,
    requestId: a.request_id,
    eventType: a.event_type as PermAudit['eventType'],
    fromStatus: (a.from_status ?? '') as PermAudit['fromStatus'],
    toStatus: (a.to_status ?? '') as PermAudit['toStatus'],
    actorEmail: a.actor_email,
    actorName: a.actor_name ?? a.actor_email,
    actorRole: a.actor_role as PermAudit['actorRole'],
    comment: a.comment,
    metadata: a.metadata,
    createdAt: a.created_at,
  }
}

// ─── API Functions ──────────────────────────────────────────────────────────

export async function getDashboard() {
  const d = await apiFetch<BackendDashboard>('/dashboard/me')
  return d
}

export async function getRequests(params: {
  view?: 'mine' | 'it_review' | 'owner_review' | 'expiring' | 'all'
  status?: string; type?: string; system?: string; search?: string
  page?: number; pageSize?: number
} = {}) {
  const q = new URLSearchParams()
  if (params.view)    q.set('view', params.view)
  if (params.status)  q.set('status', params.status)
  if (params.type)    q.set('type', params.type)
  if (params.system)  q.set('system', params.system)
  if (params.search)  q.set('search', params.search)
  if (params.page)    q.set('page', String(params.page))
  if (params.pageSize) q.set('pageSize', String(params.pageSize))
  const path = '/requests' + (q.toString() ? `?${q.toString()}` : '')
  const result = await apiFetch<BackendList>(path)
  return { ...result, data: result.data.map(mapRequest) }
}

export async function getRequest(id: string) {
  const r = await apiFetch<BackendRequest>(`/requests/${id}`)
  return mapRequest(r)
}

export async function createRequest(body: {
  target_system: string; permission_type: string; permission_level: string
  resource_id: string; reason: string; requested_duration: string
  urgency?: string; attachment_ids?: string[]
  related_incident_id?: string; related_request_id?: string
}) {
  const r = await apiFetch<BackendRequest>('/requests', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return mapRequest(r)
}

export async function getRequestAudits(id: string) {
  const list = await apiFetch<BackendAudit[]>(`/requests/${id}/audit`)
  return list.map(mapAudit)
}

export async function getAllAudits(params: {
  eventType?: string; actor?: string; requestId?: string
  page?: number; pageSize?: number
} = {}) {
  const q = new URLSearchParams()
  if (params.eventType)  q.set('eventType', params.eventType)
  if (params.actor)       q.set('actor', params.actor)
  if (params.requestId)   q.set('request_id', params.requestId)
  if (params.page)        q.set('page', String(params.page))
  if (params.pageSize)    q.set('pageSize', String(params.pageSize))
  const path = '/audit' + (q.toString() ? `?${q.toString()}` : '')
  const result = await apiFetch<{ data: BackendAudit[]; total: number }>(path)
  return { ...result, data: result.data.map(mapAudit) }
}

export async function getExpiringSoon() {
  const data = await apiFetch<BackendRequest[]>('/expiring-soon')
  return data.map(mapRequest)
}

export async function itReview(id: string, approved: boolean, comment: string) {
  const r = await apiFetch<BackendRequest>(`/requests/${id}/it-review`, {
    method: 'POST',
    body: JSON.stringify({ approved, comment }),
  })
  return mapRequest(r)
}

export async function ownerReview(id: string, approved: boolean, comment: string) {
  const r = await apiFetch<BackendRequest>(`/requests/${id}/owner-review`, {
    method: 'POST',
    body: JSON.stringify({ approved, comment }),
  })
  return mapRequest(r)
}

export async function revokeRequest(id: string, reason: string) {
  const r = await apiFetch<BackendRequest>(`/requests/${id}/revoke`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
  return mapRequest(r)
}

export async function withdrawRequest(id: string) {
  const r = await apiFetch<BackendRequest>(`/requests/${id}/withdraw`, {
    method: 'POST',
  })
  return mapRequest(r)
}

export async function addComment(id: string, comment: string) {
  await apiFetch<{ ok: boolean }>(`/requests/${id}/comment`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  })
}

export async function getPermTypes() {
  return apiFetch<Array<{
    id: string; code: string; label: string; description: string
    default_duration: string; min_duration: string; max_duration: string; enabled: boolean
  }>>('/perm-types')
}

export async function getSystemOwners() {
  return apiFetch<Array<{
    id: string; system_code: string; owner_email: string; owner_name: string
  }>>('/settings/system-owners')
}

export async function getNotifSettings() {
  return apiFetch<{
    id: string; user_email: string; in_app: boolean; email: boolean
    bb06: boolean; expiring_reminder_hours: number
  }>('/settings/notifications')
}

export async function updateNotifSettings(body: {
  in_app?: boolean; email?: boolean; bb06?: boolean; expiring_reminder_hours?: number
}) {
  return apiFetch('/settings/notifications', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

// ─── Todo derivation from requests ─────────────────────────────────────────

export function deriveTodos(requests: PermRequest[]): PermTodo[] {
  const todos: PermTodo[] = []
  for (const r of requests) {
    const colorMap: Record<string, PermTodo['color']> = {
      granted: 'green', expiring_soon: 'red',
      pending_it_review: 'blue', pending_owner_review: 'blue',
    }
    const statusMap: Record<string, PermTodo['status']> = {
      granted: 'done', expiring_soon: 'open',
      pending_it_review: 'open', pending_owner_review: 'open',
    }
    const urgencyLabel: Record<string, string> = {
      granted: '权限已开通', expiring_soon: '即将过期',
      pending_it_review: '待 IT 审核', pending_owner_review: '待 Owner 核准',
    }
    if (colorMap[r.status]) {
      todos.push({
        id: `td-${r.id}`,
        requestId: r.id,
        requestNo: r.requestNo,
        label: `${urgencyLabel[r.status]} · ${r.targetSystem} ${r.permissionType}`,
        color: colorMap[r.status],
        status: statusMap[r.status],
        createdAt: r.createdAt,
        dueAt: r.expiresAt,
      })
    }
  }
  return todos
}
