/**
 * CIM-RMS V1.0 — API Service
 * Base URL: http://localhost:3001/v1
 * Auth: dev_login query param (dev mode)
 *
 * Endpoints:
 *   GET    /auth/me
 *   GET    /dashboard/me
 *   GET    /requests
 *   GET    /requests/:id
 *   GET    /requests/:id/events
 *   POST   /requests
 *   POST   /requests/:id/approve
 *   POST   /requests/:id/reject
 *   POST   /requests/:id/schedule
 *   POST   /requests/:id/dev-start
 *   POST   /requests/:id/dev-complete
 *   POST   /requests/:id/uat-pass
 *   POST   /requests/:id/uat-fail
 *   POST   /requests/:id/deploy
 *   POST   /requests/:id/accept
 *   POST   /requests/:id/reject-acceptance
 *   POST   /requests/:id/comment
 */

import type {
  CimrmsRequest, CimrmsEvent, RequestStatus, RequestType, Urgency,
} from '../types/cimrms'

const BASE = 'http://localhost:3001/v1'
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

function authQuery(): string {
  return `dev_login=true&email=${encodeURIComponent(DEV_EMAIL)}&role=${encodeURIComponent(DEV_ROLE)}`
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const sep = path.includes('?') ? '&' : '?'
  const url = `${BASE}${path}${sep}${authQuery()}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    const errMsg = (body as { error?: string }).error ?? `HTTP ${res.status}`
    throw new Error(errMsg)
  }
  return snakeToCamel(await res.json()) as T
}

// ─── Backend response shapes (snake_case) ──────────────────────────────────

interface BackendRequest {
  id: string
  request_no: string
  title: string
  description: string
  type: string
  urgency: string
  status: string
  submitter_email: string
  submitter_name: string
  assignee_email?: string
  assignee_name?: string
  team?: string
  related_system?: string
  related_incident_id?: string
  expected_completion?: string
  attachment_ids?: string[]
  sla_hours?: number
  created_at: string
  updated_at: string
  closed_at?: string
}

interface BackendEvent {
  id: string
  request_id: string
  event: string
  actor: string
  actor_name: string
  detail?: string
  created_at: string
}

interface BackendDashboard {
  // Current user KPIs
  my_total: number
  my_open: number
  my_pending_approvals: number
  my_pending_actions: number
  my_submitted: number
  // Team KPIs
  team_total: number
  team_in_progress: number
  team_overdue: number
  // Throughput
  month_new: number
  month_closed: number
  completion_rate: number
  avg_close_hours: number
  // Weekly trend [{date, count}]
  weekly_trend: Array<{ date: string; count: number }>
}

interface BackendList {
  data: BackendRequest[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ─── M frontend type) ─────────────────────appers (snake_case → camelCase───

function localPart(email?: string): string {
  if (!email) return ''
  return email.split('@')[0] ?? ''
}

function mapRequest(r: BackendRequest): CimrmsRequest {
  return {
    id: r.id,
    requestNo: r.request_no,
    title: r.title,
    description: r.description,
    type: r.type as RequestType,
    urgency: r.urgency as Urgency,
    status: r.status as RequestStatus,
    submitter: r.submitter_email,
    submitterName: r.submitter_name || localPart(r.submitter_email),
    assignee: r.assignee_email,
    assigneeName: r.assignee_name || localPart(r.assignee_email),
    team: r.team,
    relatedSystem: r.related_system,
    relatedIncidentId: r.related_incident_id,
    expectedDate: r.expected_completion,
    attachments: r.attachment_ids,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    slaHours: r.sla_hours,
  }
}

function mapEvent(e: BackendEvent): CimrmsEvent {
  return {
    id: e.id,
    requestId: e.request_id,
    event: e.event,
    actor: e.actor,
    actorName: e.actor_name ?? e.actor,
    detail: e.detail,
    createdAt: e.created_at,
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

// Auth

export interface CurrentUser {
  id: string
  email: string
  name: string
  role: string
  department?: string
  teams?: string[]
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>('/auth/me')
}

// Dashboard

export async function getDashboardMe(): Promise<BackendDashboard> {
  return apiFetch<BackendDashboard>('/dashboard/me')
}

// Requests

export type RequestView = 'all' | 'mine' | 'pending_approval' | 'pending_action' | 'submitted_by_me'

export interface ListRequestsParams {
  view?: RequestView
  status?: RequestStatus | string
  type?: RequestType | string
  urgency?: Urgency | string
  search?: string
  page?: number
  pageSize?: number
}

export interface ListRequestsResult {
  data: CimrmsRequest[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getRequests(params: ListRequestsParams = {}): Promise<ListRequestsResult> {
  const q = new URLSearchParams()
  if (params.view) q.set('view', params.view)
  if (params.status) q.set('status', params.status)
  if (params.type) q.set('type', params.type)
  if (params.urgency) q.set('urgency', params.urgency)
  if (params.search) q.set('search', params.search)
  if (params.page) q.set('page', String(params.page))
  if (params.pageSize) q.set('pageSize', String(params.pageSize))
  const path = '/requests' + (q.toString() ? `?${q.toString()}` : '')
  const result = await apiFetch<BackendList>(path)
  return { ...result, data: result.data.map(mapRequest) }
}

export async function getRequest(id: string): Promise<CimrmsRequest> {
  const r = await apiFetch<BackendRequest>(`/requests/${encodeURIComponent(id)}`)
  return mapRequest(r)
}

export async function getRequestEvents(id: string): Promise<CimrmsEvent[]> {
  const list = await apiFetch<BackendEvent[]>(`/requests/${encodeURIComponent(id)}/events`)
  return list.map(mapEvent)
}

// Actions

export interface CreateRequestBody {
  title: string
  description: string
  type: RequestType
  urgency: Urgency
  related_system?: string
  related_incident_id?: string
  expected_completion?: string
  attachment_ids?: string[]
}

export async function createRequest(body: CreateRequestBody): Promise<CimrmsRequest> {
  const r = await apiFetch<BackendRequest>('/requests', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return mapRequest(r)
}

export async function approveRequest(id: string, comment?: string): Promise<CimrmsRequest> {
  const r = await apiFetch<BackendRequest>(`/requests/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  })
  return mapRequest(r)
}

export async function rejectRequest(id: string, comment: string): Promise<CimrmsRequest> {
  const r = await apiFetch<BackendRequest>(`/requests/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  })
  return mapRequest(r)
}

export interface ScheduleRequestBody {
  assignee_email?: string
  scheduled_at?: string
  comment?: string
}

export async function scheduleRequest(id: string, body: ScheduleRequestBody = {}): Promise<CimrmsRequest> {
  const r = await apiFetch<BackendRequest>(`/requests/${encodeURIComponent(id)}/schedule`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return mapRequest(r)
}

export async function devStart(id: string): Promise<CimrmsRequest> {
  const r = await apiFetch<BackendRequest>(`/requests/${encodeURIComponent(id)}/dev-start`, {
    method: 'POST',
  })
  return mapRequest(r)
}

export interface DevCompleteBody {
  comment?: string
  attachment_ids?: string[]
}

export async function devComplete(id: string, body: DevCompleteBody = {}): Promise<CimrmsRequest> {
  const r = await apiFetch<BackendRequest>(`/requests/${encodeURIComponent(id)}/dev-complete`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return mapRequest(r)
}

export async function uatPass(id: string, comment?: string): Promise<CimrmsRequest> {
  const r = await apiFetch<BackendRequest>(`/requests/${encodeURIComponent(id)}/uat-pass`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  })
  return mapRequest(r)
}

export interface UatFailBody {
  comment: string
  attachments?: string[]
}

export async function uatFail(id: string, comment: string, attachments?: string[]): Promise<CimrmsRequest> {
  const r = await apiFetch<BackendRequest>(`/requests/${encodeURIComponent(id)}/uat-fail`, {
    method: 'POST',
    body: JSON.stringify({ comment, attachments }),
  })
  return mapRequest(r)
}

export async function deploy(id: string): Promise<CimrmsRequest> {
  const r = await apiFetch<BackendRequest>(`/requests/${encodeURIComponent(id)}/deploy`, {
    method: 'POST',
  })
  return mapRequest(r)
}

export async function acceptRequest(id: string): Promise<CimrmsRequest> {
  const r = await apiFetch<BackendRequest>(`/requests/${encodeURIComponent(id)}/accept`, {
    method: 'POST',
  })
  return mapRequest(r)
}

export async function rejectAcceptance(id: string, comment: string): Promise<CimrmsRequest> {
  const r = await apiFetch<BackendRequest>(`/requests/${encodeURIComponent(id)}/reject-acceptance`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  })
  return mapRequest(r)
}

export interface CommentBody {
  content: string
  is_internal?: boolean
}

export async function addComment(id: string, body: CommentBody): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/requests/${encodeURIComponent(id)}/comment`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// ── SPC Trend ──────────────────────────────────────────────────────────────

export type SpcArea = 'Photo' | 'Etch' | 'Diffusion' | 'CMP' | 'WireBond'
export type SpcParam = 'CD' | 'Thickness' | 'Resistance' | 'Voltage' | 'Current'

export interface SpcDataPoint {
  time: string
  value: number
  ucl: number
  cl: number
  lcl: number
  ruleViolations: string[]
}

export interface SpcTrendResult {
  ok: boolean
  area: string
  equipment: string
  param: string
  limits: { ucl: number; cl: number; lcl: number }
  total: number
  data: SpcDataPoint[]
}

export async function getSpcTrend(
  area: string,
  equipment: string,
  param: string,
  points = 30,
): Promise<SpcTrendResult> {
  const q = new URLSearchParams({ area, equipment, param, points: String(points) })
  return apiFetch<SpcTrendResult>(`/spc/trend?${q.toString()}`)
}
