// MDM V2.1 TypeScript 类型定义
// 与 mrdi-portal 视觉系统完全一致

// ---- 全局角色 ----
export type MdmRole = 'mdm-admin' | 'mdm-editor' | 'mdm-viewer' | 'mdm-auditor'

export const ROLE_LABELS: Record<MdmRole, string> = {
  'mdm-admin': 'admin',
  'mdm-editor': 'editor',
  'mdm-viewer': 'viewer',
  'mdm-auditor': 'auditor',
}

// ---- 用户状态 ----
export type UserStatus = 'Active' | 'Idle' | 'Suspended'

// ---- 用户 ----
export interface MdmUser {
  email: string
  name: string
  department: string
  status: UserStatus
  lastActive: string // ISO time
  createdAt: string
  roles: MdmRole[]
  systemAccess: string[] // e.g. ['RMS', 'IMS', 'MDM']
  idleDays?: number
}

// ---- 角色定义 ----
export interface MdmRoleDef {
  code: MdmRole
  name: string
  description: string
  userCount: number
  permissions: string[]
}

// ---- 待办标签 ----
export type TodoLabel = 'red' | 'green' | 'blue'
export type TodoPriority = 'P1' | 'P2' | 'P3'
export type TodoStatus = 'open' | 'done' | 'dismissed'

export interface MdmTodo {
  id: number
  title: string
  description?: string
  label: TodoLabel
  priority: TodoPriority
  status: TodoStatus
  dueAt?: string
  source?: string // '来自 CIM-RMS · 2h 前'
  assignee?: string
  createdAt: string
}

// ---- 系统注册 ----
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

// ---- API Key ----
export interface ApiKey {
  id: string
  systemId: string
  prefix: string
  createdAt: string
  expiresAt?: string
  revokedAt?: string
  status: 'active' | 'revoked'
}

// ---- 审计日志（S4-3: MDM 统一审计，来自 GET /v1/audit）----
export interface MdmAuditLogItem {
  id: string
  action: string      // e.g. 'cimrms.request.approve'
  actorEmail: string
  actorName: string
  targetEmail?: string
  targetType?: string
  targetId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  createdAt: string   // ISO 8601
}

// ── 旧兼容类型（保留给 login-audit 等其他 API）──
export type AuditType =
  | 'role.assign' | 'role.revoke'
  | 'perm.grant' | 'perm.revoke'
  | 'sync.fail' | 'sync.success'
  | 'piv.fail' | 'user.login' | 'user.logout'

export interface AuditLog {
  id: number
  time: string
  operator: string
  type: AuditType
  target: string
  status: 'success' | 'failed'
  detail?: string
  retryCount?: number
}

// ---- PIV 死信 ----
export interface PivDeadLetter {
  id: number
  failedAt: string
  eventType: string
  device?: string
  user?: string
  retryCount: number
  maxRetries: number
  error: string
  status: 'pending' | 'retrying' | 'resolved' | 'ignored'
}

// ---- 访问矩阵 ----
export interface AccessMatrixRow {
  permission: string
  admin: boolean
  editor: boolean
  viewer: boolean
  auditor: boolean
}

// ---- KPI 数据 ----
export interface MdmKpi {
  label: string
  value: string
  sub?: string
  subColor?: string
  icon: string
  href?: string
}
