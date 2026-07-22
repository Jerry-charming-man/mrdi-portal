/**
 * CIM-IMS V1.0 — API Service
 * Base URL: http://localhost:3002/v1
 * Auth: dev_login query param (dev mode)
 *
 * Endpoints:
 *   GET    /incidents
 *   GET    /incidents/:id
 *   GET    /incidents/:id/timeline
 *   POST   /incidents
 *   POST   /incidents/:id/take-over
 *   POST   /incidents/:id/transfer
 *   POST   /incidents/:id/timeline
 *   POST   /incidents/:id/mark-resolved
 *   POST   /incidents/:id/confirm
 *   POST   /incidents/:id/reject
 *   POST   /incidents/:id/force-close
 *   GET    /dashboard/me
 *   GET    /duty-pool
 *   GET    /settings/sla-configs
 *   GET    /settings/engineers
 */

import type {
  CimimsIncident, CimimsTimelineEntry, IncidentStatus, IncidentType,
  IncidentUrgency, IncidentImpact, EngineerType,
} from '../types/cimims'

const BASE = 'http://localhost:3002/v1'
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

interface BackendIncident {
  id: string
  incident_no: string
  title: string
  description: string
  type: string
  urgency: string
  status: string
  impact_scope: string
  submitter_email: string
  submitter_name: string
  duty_email?: string
  duty_name?: string
  engineer_email?: string
  engineer_name?: string
  engineer_type?: string
  related_system?: string
  related_request_id?: string
  attachment_ids?: string[]
  sla_hours?: number
  response_sla_hours?: number
  created_at: string
  updated_at: string
  closed_at?: string
}

interface BackendTimelineEntry {
  id: string
  incident_id: string
  action: string
  actor: string
  actor_name: string
  detail?: string
  is_internal: boolean
  created_at: string
}

interface BackendDashboard {
  my_open: number
  pending_takeover: number
  processing: number
  pending_confirm: number
  today_new: number
  today_closed: number
  avg_close_hours: number
  resolution_rate_30d: number
  p1_count: number
  sla_breach_count: number
  // Type distribution
  type_distribution: Array<{ type: string; count: number }>
  // Recent weekly trend
  weekly_trend: Array<{ date: string; count: number }>
}

interface BackendList {
  data: BackendIncident[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ─── Mappers ────────────────────────────────────────────────────────────────

function localPart(email?: string): string {
  if (!email) return ''
  return email.split('@')[0] ?? ''
}

function mapIncident(i: BackendIncident): CimimsIncident {
  return {
    id: i.id,
    incidentNo: i.incident_no,
    title: i.title,
    description: i.description,
    type: i.type as IncidentType,
    urgency: i.urgency as IncidentUrgency,
    status: i.status as IncidentStatus,
    impactScope: i.impact_scope as IncidentImpact,
    submitter: i.submitter_email,
    submitterName: i.submitter_name || localPart(i.submitter_email),
    duty: i.duty_email,
    dutyName: i.duty_name || localPart(i.duty_email),
    engineer: i.engineer_email,
    engineerName: i.engineer_name || localPart(i.engineer_email),
    engineerType: i.engineer_type as EngineerType | undefined,
    relatedSystem: i.related_system,
    relatedRequestId: i.related_request_id,
    attachments: i.attachment_ids,
    slaHours: i.sla_hours,
    responseSlaHours: i.response_sla_hours,
    createdAt: i.created_at,
    updatedAt: i.updated_at,
    closedAt: i.closed_at,
  }
}

function mapTimeline(e: BackendTimelineEntry): CimimsTimelineEntry {
  return {
    id: e.id,
    incidentId: e.incident_id,
    action: e.action,
    actor: e.actor,
    actorName: e.actor_name ?? e.actor,
    detail: e.detail,
    isInternal: e.is_internal,
    createdAt: e.created_at,
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

// Incidents

export type IncidentView = 'all' | 'mine' | 'submitted_by_me' | 'pending_takeover' | 'processing' | 'pending_confirm' | 'closed'

export interface ListIncidentsParams {
  view?: IncidentView
  status?: IncidentStatus | string
  type?: IncidentType | string
  urgency?: IncidentUrgency | string
  search?: string
  page?: number
  pageSize?: number
}

export interface ListIncidentsResult {
  data: CimimsIncident[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getIncidents(params: ListIncidentsParams = {}): Promise<ListIncidentsResult> {
  const q = new URLSearchParams()
  if (params.view) q.set('view', params.view)
  if (params.status) q.set('status', params.status)
  if (params.type) q.set('type', params.type)
  if (params.urgency) q.set('urgency', params.urgency)
  if (params.search) q.set('search', params.search)
  if (params.page) q.set('page', String(params.page))
  if (params.pageSize) q.set('pageSize', String(params.pageSize))
  const path = '/incidents' + (q.toString() ? `?${q.toString()}` : '')
  const result = await apiFetch<BackendList>(path)
  return { ...result, data: result.data.map(mapIncident) }
}

export async function getIncident(id: string): Promise<CimimsIncident> {
  const i = await apiFetch<BackendIncident>(`/incidents/${encodeURIComponent(id)}`)
  return mapIncident(i)
}

export async function getIncidentTimeline(id: string): Promise<CimimsTimelineEntry[]> {
  const list = await apiFetch<BackendTimelineEntry[]>(`/incidents/${encodeURIComponent(id)}/timeline`)
  return list.map(mapTimeline)
}

export interface CreateIncidentBody {
  title: string
  description: string
  type: IncidentType
  urgency: IncidentUrgency
  impact_scope: IncidentImpact
  related_system?: string
  related_request_id?: string
  attachment_ids?: string[]
}

export async function createIncident(body: CreateIncidentBody): Promise<CimimsIncident> {
  const i = await apiFetch<BackendIncident>('/incidents', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return mapIncident(i)
}

export interface TakeOverBody {
  comment?: string
}

export async function takeOver(id: string, body: TakeOverBody = {}): Promise<CimimsIncident> {
  const i = await apiFetch<BackendIncident>(`/incidents/${encodeURIComponent(id)}/take-over`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return mapIncident(i)
}

export interface TransferBody {
  engineer_email: string
  engineer_type: EngineerType
  reason: string
}

export async function transferIncident(id: string, body: TransferBody): Promise<CimimsIncident> {
  const i = await apiFetch<BackendIncident>(`/incidents/${encodeURIComponent(id)}/transfer`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return mapIncident(i)
}

export interface TimelineBody {
  action: string
  detail?: string
  is_internal?: boolean
}

export async function addTimelineEntry(id: string, body: TimelineBody): Promise<CimimsTimelineEntry> {
  const e = await apiFetch<BackendTimelineEntry>(`/incidents/${encodeURIComponent(id)}/timeline`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return mapTimeline(e)
}

export interface MarkResolvedBody {
  solution: string
  attachment_ids?: string[]
}

export async function markResolved(id: string, body: MarkResolvedBody): Promise<CimimsIncident> {
  const i = await apiFetch<BackendIncident>(`/incidents/${encodeURIComponent(id)}/mark-resolved`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return mapIncident(i)
}

export async function confirmIncident(id: string, body: { satisfaction?: number; comment?: string } = {}): Promise<CimimsIncident> {
  const i = await apiFetch<BackendIncident>(`/incidents/${encodeURIComponent(id)}/confirm`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return mapIncident(i)
}

export async function rejectIncident(id: string, reason: string): Promise<CimimsIncident> {
  const i = await apiFetch<BackendIncident>(`/incidents/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
  return mapIncident(i)
}

export async function forceCloseIncident(id: string, reason: string): Promise<CimimsIncident> {
  const i = await apiFetch<BackendIncident>(`/incidents/${encodeURIComponent(id)}/force-close`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
  return mapIncident(i)
}

// Dashboard

export async function getDashboard(): Promise<BackendDashboard> {
  return apiFetch<BackendDashboard>('/dashboard/me')
}

// Duty pool

export interface DutyPoolItem {
  incidentId: string
  incidentNo: string
  title: string
  type: string
  urgency: string
  impactScope: string
  relatedSystem?: string
  elapsedHours: number
  slaHours: number
  createdAt: string
  priorityScore: number
}

export async function getDutyPool(): Promise<DutyPoolItem[]> {
  return apiFetch<DutyPoolItem[]>('/duty-pool')
}

// SLA configs

export interface SlaConfig {
  type: string
  urgency: string
  responseHours: number
  closeHours: number
}

export async function getSlaConfigs(): Promise<SlaConfig[]> {
  return apiFetch<SlaConfig[]>('/settings/sla-configs')
}

// Engineers

export interface EngineerEntry {
  email: string
  name: string
  type: EngineerType
  team: string
  isDuty: boolean
  activeIncidents: number
}

export async function getEngineers(): Promise<EngineerEntry[]> {
  return apiFetch<EngineerEntry[]>('/settings/engineers')
}
