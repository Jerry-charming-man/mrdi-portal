/**
 * MDM V2.2 — API Service
 * Base URL: http://localhost:3000/v1
 * Auth: JWT Bearer token (from authStore localStorage) · Sprint 3
 *
 * Endpoints:
 *   USERS
 *     GET    /users
 *     GET    /users/:id
 *     GET    /users/me
 *     POST   /users
 *     PUT    /users/:id
 *     DELETE /users/:id
 *     PATCH  /v1/users/:id/password   ← admin change password
 *
 *   AUTH (admin actions — require JWT)
 *     POST   /auth/v1/unlock/:email        ← admin unlock
 *     POST   /auth/v1/admin/reset-password ← admin reset password
 *
 *   ROLES
 *     GET    /roles
 *     POST   /roles
 *     POST   /roles/assign
 *
 *   SYSTEMS
 *     GET    /systems
 *     POST   /systems
 *     PUT    /systems/:id
 *
 *   PERMISSIONS
 *     GET    /permissions/check
 *     POST   /permissions/grant
 *
 *   AUDIT
 *     GET    /audit
 *
 *   TODOS
 *     GET    /todos
 *     POST   /todos
 *     PUT    /todos/:id
 *     DELETE /todos/:id
 */

import type { MdmRole } from '../types/mdm'
import i18n from '../i18n'

const BASE = 'http://localhost:3000/v1'

// ─── API Error class（带 i18nKey + code + details）────────────────────────

export interface I18nZodIssue {
  path: string
  message: string
  code: string
  i18nKey: string
  minimum?: number
  maximum?: number
}

export class ApiError extends Error {
  i18nKey: string
  code: string
  status: number
  details?: Record<string, unknown>
  issues?: I18nZodIssue[]

  constructor(
    i18nKey: string,
    code: string,
    message: string,
    status: number,
    details?: Record<string, unknown>,
    issues?: I18nZodIssue[],
  ) {
    super(message)
    this.name = 'ApiError'
    this.i18nKey = i18nKey
    this.code = code
    this.status = status
    this.details = details
    this.issues = issues
  }
}

type TFunction = (key: string, opts?: Record<string, unknown>) => string
const defaultT: TFunction = (k, opts) => i18n.t(k, opts)

/** 把 ApiError 转成用户可见的本地化字符串（带回退链） */
export function tError(err: unknown, t: TFunction = defaultT): string {
  if (err instanceof ApiError) {
    // 1. 优先用 err.i18nKey
    if (err.i18nKey && i18n.exists(err.i18nKey)) {
      return t(err.i18nKey, err.details ?? {})
    }
    // 2. Zod 多 issue：拼成列表
    if (err.issues && err.issues.length > 0) {
      const lines: string[] = []
      for (const issue of err.issues) {
        // 尝试具体 key（cimrms.validation.title.required）→ 通用 key（validation.required）→ 原始 message
        if (issue.i18nKey && i18n.exists(issue.i18nKey)) {
          lines.push(t(issue.i18nKey, issue as unknown as Record<string, unknown>))
        } else {
          const generic = `validation.${issue.code}`
          if (i18n.exists(generic)) {
            lines.push(t(generic, issue as unknown as Record<string, unknown>))
          } else {
            lines.push(issue.message)
          }
        }
      }
      return lines.join('；')
    }
    // 3. 通用 error.<code> fallback
    const generic = `error.${err.code.toLowerCase()}`
    if (i18n.exists(generic)) {
      return t(generic, err.details ?? {})
    }
    // 4. 最后用 err.message
    return err.message
  }
  if (err instanceof Error) return err.message
  return String(err)
}

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

// ─── Auth helper ─────────────────────────────────────────────────────────────

/** Read JWT from authStore localStorage (written by authStore persist middleware) */
function getJwt(): string | null {
  try {
    const raw = localStorage.getItem('mrdi-auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed.state?.token ?? null
  } catch {
    return null
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getJwt()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  }
  // Inject Bearer token if available (admin actions need it)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const sep = path.includes('?') ? '&' : '?'
  const url = `${BASE}${path}${sep}`
  const res = await fetch(url.endsWith('?') ? url.slice(0, -1) : url, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as {
      error?: {
        code?: string
        i18nKey?: string
        message?: string
        details?: Record<string, unknown>
        issues?: I18nZodIssue[]
      }
      message?: string
    }
    const e = body.error ?? {}
    const message = e.message ?? body.message ?? res.statusText ?? `HTTP ${res.status}`
    const code = e.code ?? 'HTTP_ERROR'
    const i18nKey = e.i18nKey ?? 'error.http_error'
    throw new ApiError(
      i18nKey,
      code,
      message,
      res.status,
      e.details,
      e.issues,
    )
  }
  // 204 No Content
  if (res.status === 204) return undefined as T
  return snakeToCamel(await res.json()) as T
}

// ─── Backend response shapes (snake_case) ──────────────────────────────────

interface BackendUser {
  id: string
  email: string
  name: string
  department: string
  status: 'Active' | 'Idle' | 'Suspended'
  last_active: string
  created_at: string
  roles: string[]
  system_access: string[]
  idle_days?: number
}

interface BackendRole {
  code: MdmRole
  name: string
  description: string
  user_count: number
  permissions: string[]
}

interface BackendSystem {
  id: string
  name: string
  description: string
  api_base: string
  version: string
  active_users: number
  weekly_change: number
  status: 'healthy' | 'partial' | 'down'
}

interface BackendAuditLog {
  id: number
  time: string
  operator: string
  type: string
  target: string
  status: 'success' | 'failed'
  detail?: string
  retry_count?: number
}

interface BackendTodo {
  id: number
  title: string
  description?: string
  label: 'red' | 'green' | 'blue'
  priority: 'P1' | 'P2' | 'P3'
  status: 'open' | 'done' | 'dismissed'
  due_at?: string
  source?: string
  assignee?: string
  created_at: string
}

interface BackendPermissionCheck {
  user_email: string
  resource_id: string
  permission_id: string
  granted: boolean
  reason?: string
  checked_at: string
}

// ─── Frontend shapes (camelCase) ────────────────────────────────────────────

export interface MdmUser {
  id: string
  email: string
  name: string
  department: string
  status: 'Active' | 'Idle' | 'Suspended'
  lastActive: string
  createdAt: string
  roles: MdmRole[]
  systemAccess: string[]
  idleDays?: number
}

export interface MdmRoleDef {
  code: MdmRole
  name: string
  description: string
  userCount: number
  permissions: string[]
}

export interface RegisteredSystem {
  id: string
  name: string
  description: string
  apiBase: string
  version: string
  activeUsers: number
  weeklyChange: number
  status: 'healthy' | 'partial' | 'down'
}

export interface AuditLog {
  id: number
  time: string
  operator: string
  type: string
  target: string
  status: 'success' | 'failed'
  detail?: string
  retryCount?: number
}

export interface MdmTodo {
  id: number
  title: string
  description?: string
  label: 'red' | 'green' | 'blue'
  priority: 'P1' | 'P2' | 'P3'
  status: 'open' | 'done' | 'dismissed'
  dueAt?: string
  source?: string
  assignee?: string
  createdAt: string
}

export interface PermissionCheckResult {
  userEmail: string
  resourceId: string
  permissionId: string
  granted: boolean
  reason?: string
  checkedAt: string
}

// ─── Mappers ────────────────────────────────────────────────────────────────

function mapUser(u: BackendUser): MdmUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    department: u.department,
    status: u.status,
    lastActive: u.last_active,
    createdAt: u.created_at,
    roles: u.roles as MdmRole[],
    systemAccess: u.system_access,
    idleDays: u.idle_days,
  }
}

function mapRole(r: BackendRole): MdmRoleDef {
  return {
    code: r.code,
    name: r.name,
    description: r.description,
    userCount: r.user_count,
    permissions: r.permissions,
  }
}

function mapSystem(s: BackendSystem): RegisteredSystem {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    apiBase: s.api_base,
    version: s.version,
    activeUsers: s.active_users,
    weeklyChange: s.weekly_change,
    status: s.status,
  }
}

function mapAudit(a: BackendAuditLog): AuditLog {
  return {
    id: a.id,
    time: a.time,
    operator: a.operator,
    type: a.type,
    target: a.target,
    status: a.status,
    detail: a.detail,
    retryCount: a.retry_count,
  }
}

function mapTodo(t: BackendTodo): MdmTodo {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    label: t.label,
    priority: t.priority,
    status: t.status,
    dueAt: t.due_at,
    source: t.source,
    assignee: t.assignee,
    createdAt: t.created_at,
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

// ── USERS ──

export interface ListUsersParams {
  search?: string
  status?: 'Active' | 'Idle' | 'Suspended'
  department?: string
  page?: number
  pageSize?: number
}

export interface ListUsersResult {
  data: MdmUser[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getUsers(params: ListUsersParams = {}): Promise<ListUsersResult> {
  const q = new URLSearchParams()
  if (params.search) q.set('search', params.search)
  if (params.status) q.set('status', params.status)
  if (params.department) q.set('department', params.department)
  if (params.page) q.set('page', String(params.page))
  if (params.pageSize) q.set('pageSize', String(params.pageSize))
  const path = '/users' + (q.toString() ? `?${q.toString()}` : '')
  const result = await apiFetch<{ data: BackendUser[]; total: number; page: number; pageSize: number; totalPages: number }>(path)
  return { ...result, data: result.data.map(mapUser) }
}

export async function getUser(id: string): Promise<MdmUser> {
  const u = await apiFetch<BackendUser>(`/users/${encodeURIComponent(id)}`)
  return mapUser(u)
}

export async function getMe(): Promise<MdmUser> {
  const u = await apiFetch<BackendUser>('/users/me')
  return mapUser(u)
}

export interface CreateUserBody {
  email: string
  name: string
  department: string
  status?: 'Active' | 'Idle' | 'Suspended'
  roles?: MdmRole[]
  system_access?: string[]
}

export async function createUser(body: CreateUserBody): Promise<MdmUser> {
  const u = await apiFetch<BackendUser>('/users', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return mapUser(u)
}

export interface UpdateUserBody {
  name?: string
  department?: string
  status?: 'Active' | 'Idle' | 'Suspended'
  roles?: MdmRole[]
  system_access?: string[]
}

export async function updateUser(id: string, body: UpdateUserBody): Promise<MdmUser> {
  const u = await apiFetch<BackendUser>(`/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  return mapUser(u)
}

export async function deleteUser(id: string): Promise<void> {
  await apiFetch<void>(`/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

// ── ROLES ──

export async function getRoles(): Promise<MdmRoleDef[]> {
  const list = await apiFetch<BackendRole[]>('/roles')
  return list.map(mapRole)
}

export interface CreateRoleBody {
  code: MdmRole
  name: string
  description: string
  permissions: string[]
}

export async function createRole(body: CreateRoleBody): Promise<MdmRoleDef> {
  const r = await apiFetch<BackendRole>('/roles', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return mapRole(r)
}

export async function assignRole(
  userId: string,
  role: MdmRole,
  grantedBy: string,
): Promise<void> {
  await apiFetch<{ ok: boolean }>('/roles/assign', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, role, granted_by: grantedBy }),
  })
}

// ── SYSTEMS ──

export async function getSystems(): Promise<RegisteredSystem[]> {
  const list = await apiFetch<BackendSystem[]>('/systems')
  return list.map(mapSystem)
}

export interface CreateSystemBody {
  name: string
  description: string
  api_base: string
  version: string
}

export async function createSystem(body: CreateSystemBody): Promise<RegisteredSystem> {
  const s = await apiFetch<BackendSystem>('/systems', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return mapSystem(s)
}

export interface UpdateSystemBody {
  name?: string
  description?: string
  api_base?: string
  version?: string
  status?: 'healthy' | 'partial' | 'down'
}

export async function updateSystem(id: string, body: UpdateSystemBody): Promise<RegisteredSystem> {
  const s = await apiFetch<BackendSystem>(`/systems/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  return mapSystem(s)
}

// ── PERMISSIONS ──

export interface ListPermissionGrantsParams {
  user_email?: string
  resource_id?: string
  permission_id?: string
  page?: number
  pageSize?: number
}

export interface ListPermissionGrantsResult {
  data: PermissionCheckResult[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getPermissionGrants(
  params: ListPermissionGrantsParams = {},
): Promise<ListPermissionGrantsResult> {
  const q = new URLSearchParams()
  if (params.user_email) q.set('user_email', params.user_email)
  if (params.resource_id) q.set('resource_id', params.resource_id)
  if (params.permission_id) q.set('permission_id', params.permission_id)
  if (params.page) q.set('page', String(params.page))
  if (params.pageSize) q.set('pageSize', String(params.pageSize))
  const path = '/permissions/check' + (q.toString() ? `?${q.toString()}` : '')
  return apiFetch<ListPermissionGrantsResult>(path)
}

export async function checkPermission(
  email: string,
  resourceId: string,
  permissionId: string,
): Promise<PermissionCheckResult> {
  const q = new URLSearchParams({
    user_email: email,
    resource_id: resourceId,
    permission_id: permissionId,
  })
  const result = await apiFetch<BackendPermissionCheck>(`/permissions/check?${q.toString()}`)
  return {
    userEmail: result.user_email,
    resourceId: result.resource_id,
    permissionId: result.permission_id,
    granted: result.granted,
    reason: result.reason,
    checkedAt: result.checked_at,
  }
}

export interface GrantPermissionBody {
  user_email: string
  resource_id: string
  permission_id: string
  expires_at?: string
  reason?: string
}

export async function grantPermission(body: GrantPermissionBody): Promise<PermissionCheckResult> {
  const result = await apiFetch<BackendPermissionCheck>('/permissions/grant', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return {
    userEmail: result.user_email,
    resourceId: result.resource_id,
    permissionId: result.permission_id,
    granted: result.granted,
    reason: result.reason,
    checkedAt: result.checked_at,
  }
}

// ── AUDIT ──

export interface ListAuditParams {
  type?: string
  operator?: string
  start_time?: string
  end_time?: string
  page?: number
  pageSize?: number
}

export interface ListAuditResult {
  data: AuditLog[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getAuditLogs(params: ListAuditParams = {}): Promise<ListAuditResult> {
  const q = new URLSearchParams()
  if (params.type) q.set('type', params.type)
  if (params.operator) q.set('operator', params.operator)
  if (params.start_time) q.set('start_time', params.start_time)
  if (params.end_time) q.set('end_time', params.end_time)
  if (params.page) q.set('page', String(params.page))
  if (params.pageSize) q.set('pageSize', String(params.pageSize))
  const path = '/audit' + (q.toString() ? `?${q.toString()}` : '')
  const result = await apiFetch<{ data: BackendAuditLog[]; total: number; page: number; pageSize: number; totalPages: number }>(path)
  return { ...result, data: result.data.map(mapAudit) }
}

// ── TODOS ──

export async function getTodos(): Promise<MdmTodo[]> {
  const list = await apiFetch<BackendTodo[]>('/todos')
  return list.map(mapTodo)
}

export interface CreateTodoBody {
  title: string
  description?: string
  label?: 'red' | 'green' | 'blue'
  priority?: 'P1' | 'P2' | 'P3'
  due_at?: string
  source?: string
  assignee?: string
}

export async function createTodo(body: CreateTodoBody): Promise<MdmTodo> {
  const t = await apiFetch<BackendTodo>('/todos', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return mapTodo(t)
}

export interface UpdateTodoBody {
  title?: string
  description?: string
  label?: 'red' | 'green' | 'blue'
  priority?: 'P1' | 'P2' | 'P3'
  status?: 'open' | 'done' | 'dismissed'
  due_at?: string
}

export async function updateTodo(id: number | string, body: UpdateTodoBody): Promise<MdmTodo> {
  const t = await apiFetch<BackendTodo>(`/todos/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  return mapTodo(t)
}

export async function deleteTodo(id: number | string): Promise<void> {
  await apiFetch<void>(`/todos/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
  })
}

// ── NOTIFICATIONS ────────────────────────────────────────────────────────

export type NotificationType =
  | 'auth_login'
  | 'account_locked'
  | 'password_changed'
  | 'role_assigned'
  | 'role_revoked'
  | 'permission_granted'
  | 'permission_revoked'
  | 'system_alert'
  | 'incident_created'
  | 'request_submitted'
  | 'approval_needed'
  | 'sla_warning'
  | 'sla_breach'

export interface MdmNotification {
  id: string
  recipientEmail: string
  type: NotificationType
  title: string
  body: string | null
  metadata: Record<string, unknown> | null
  readAt: string | null
  createdAt: string
}

interface BackendNotification {
  id: string
  recipient_email: string
  type: string
  title: string
  body: string | null
  metadata: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

function mapNotification(n: BackendNotification): MdmNotification {
  return {
    id: n.id,
    recipientEmail: n.recipient_email,
    type: n.type as NotificationType,
    title: n.title,
    body: n.body,
    metadata: n.metadata,
    readAt: n.read_at,
    createdAt: n.created_at,
  }
}

export interface ListNotificationsParams {
  unreadOnly?: boolean
  page?: number
  pageSize?: number
}

export interface ListNotificationsResult {
  data: MdmNotification[]
  total: number
  unreadCount: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getNotifications(params: ListNotificationsParams = {}): Promise<ListNotificationsResult> {
  const q = new URLSearchParams()
  if (params.unreadOnly) q.set('unread', 'true')
  if (params.page) q.set('page', String(params.page))
  if (params.pageSize) q.set('pageSize', String(params.pageSize))
  const path = '/notifications' + (q.toString() ? `?${q.toString()}` : '')
  const r = await apiFetch<{ data: BackendNotification[]; total: number; unreadCount: number; page: number; pageSize: number; totalPages: number }>(path)
  return { ...r, data: r.data.map(mapNotification) }
}

export async function getUnreadCount(): Promise<number> {
  const r = await apiFetch<{ unreadCount: number }>('/notifications/count')
  return r.unreadCount
}

export async function markRead(id: string): Promise<void> {
  await apiFetch(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' })
}

export async function markAllRead(): Promise<void> {
  await apiFetch('/notifications/read-all', { method: 'PATCH' })
}

export async function deleteNotification(id: string): Promise<void> {
  await apiFetch(`/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN AUDIT — S3-10 · require JWT Bearer + admin role
// ═══════════════════════════════════════════════════════════════════════════════

export interface AuditLogItem {
  id: string
  action: string
  actorEmail: string
  actorName: string | null
  targetType: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface AuditPage {
  items: AuditLogItem[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

export interface FailedLoginSummary {
  period: string
  totalFailed: number
  byEmail: Array<{ email: string; count: number; lastAt: string; lastReason: string | null }>
}

export interface AuditSummary {
  date: string
  successLogins: number
  failedLogins: number
  lockedAccounts: number
  totalActiveUsers: number
}

/**
 * GET /v1/login-audit — paginated login audit log
 */
export async function listLoginAudit(params?: {
  action?: string; email?: string; dateFrom?: string; dateTo?: string; page?: number; pageSize?: number
}): Promise<AuditPage> {
  const qs = new URLSearchParams()
  if (params?.action) qs.set('action', params.action)
  if (params?.email) qs.set('email', params.email)
  if (params?.dateFrom) qs.set('dateFrom', params.dateFrom)
  if (params?.dateTo) qs.set('dateTo', params.dateTo)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
  return apiFetch<AuditPage>(`/login-audit?${qs}`)
}

/**
 * GET /v1/login-audit/failed-logins — failed login summary by email (7 days)
 */
export async function getFailedLogins(): Promise<FailedLoginSummary> {
  return apiFetch<FailedLoginSummary>('/login-audit/failed-logins')
}

/**
 * GET /v1/login-audit/summary — today's login summary
 */
export async function getAuditSummary(): Promise<AuditSummary> {
  return apiFetch<AuditSummary>('/login-audit/summary')
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ACTIONS — S3-9 · require JWT Bearer + admin role
// ═══════════════════════════════════════════════════════════════════════════════

export interface AdminUnlockResult { message: string }
export interface AdminResetResult  { message: string }
export interface AdminChangePwdResult { message: string }

/**
 * Admin unlock: POST /auth/v1/unlock/:email
 * Clears locked_until + failed_login_count for the target user.
 */
export async function adminUnlock(email: string): Promise<AdminUnlockResult> {
  return apiFetch<AdminUnlockResult>(`/auth/v1/unlock/${encodeURIComponent(email)}`, {
    method: 'POST',
  })
}

/**
 * Admin reset password: POST /auth/v1/admin/reset-password
 * Sets new password + forces must_change_password=true on next login.
 */
export async function adminResetPassword(
  targetEmail: string,
  newPassword: string,
): Promise<AdminResetResult> {
  return apiFetch<AdminResetResult>('/auth/v1/admin/reset-password', {
    method: 'POST',
    body: JSON.stringify({ targetEmail, newPassword }),
  })
}

/**
 * Admin change password: PATCH /v1/users/:id/password
 * Directly sets password (no must_change_password flag).
 */
export async function adminChangePassword(
  userId: string,
  newPassword: string,
): Promise<AdminChangePwdResult> {
  return apiFetch<AdminChangePwdResult>(
    `/v1/users/${encodeURIComponent(userId)}/password`,
    { method: 'PATCH', body: JSON.stringify({ newPassword }) },
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MDM AUDIT LOG — S4-3 · GET /v1/audit
// ═══════════════════════════════════════════════════════════════════════════════

export interface MdmAuditParams {
  system?: string   // 'cimrms' | 'cimims' | 'cim-perm'
  action?: string   // partial match, e.g. 'request.approve'
  actor?: string    // partial match on actorEmail
  target?: string   // partial match on targetEmail / targetId
  dateFrom?: string // YYYY-MM-DD
  dateTo?: string   // YYYY-MM-DD
  page?: number
  pageSize?: number
}

export interface MdmAuditPage {
  items: import('../types/mdm.js').MdmAuditLogItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export async function getMdmAuditLogs(params: MdmAuditParams = {}): Promise<MdmAuditPage> {
  const q = new URLSearchParams()
  if (params.system)   q.set('system', params.system)
  if (params.action)   q.set('action', params.action)
  if (params.actor)    q.set('actor', params.actor)
  if (params.target)   q.set('target', params.target)
  if (params.dateFrom) q.set('dateFrom', params.dateFrom)
  if (params.dateTo)   q.set('dateTo', params.dateTo)
  if (params.page)     q.set('page', String(params.page))
  if (params.pageSize) q.set('pageSize', String(params.pageSize))
  const qs = q.toString()
  const path = '/audit' + (qs ? `?${qs}` : '')
  return apiFetch<MdmAuditPage>(path)
}

