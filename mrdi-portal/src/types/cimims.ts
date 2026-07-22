// CIM-IMS TypeScript Types
// API Base: http://localhost:3000/cimims-api/v1/

export const INCIDENT_STATUS = {
  PENDING_TAKEOVER: 'pending_takeover',
  PROCESSING: 'processing',
  TRANSFERRED: 'transferred',
  PENDING_CONFIRM: 'pending_confirm',
  CLOSED: 'closed',
} as const

export type IncidentStatus = typeof INCIDENT_STATUS[keyof typeof INCIDENT_STATUS]

export const INCIDENT_TYPE = {
  SYSTEM: { code: 'system', label: '系统故障', bg: 'bg-research/10', text: 'text-research' },
  NETWORK: { code: 'network', label: '网络问题', bg: 'bg-ignite-soft', text: 'text-ignite' },
  ACCOUNT: { code: 'account', label: '账号问题', bg: 'bg-pink/10', text: 'text-pink' },
  EQUIPMENT: { code: 'equipment', label: '设备关联', bg: 'bg-indigo/10', text: 'text-indigo' },
  OTHER: { code: 'other', label: '其他', bg: 'bg-module', text: 'text-ink-2' },
} as const

export type IncidentType = typeof INCIDENT_TYPE[keyof typeof INCIDENT_TYPE]['code']

export const INCIDENT_URGENCY = {
  P1: { code: 'P1', label: '阻断生产', bg: 'bg-danger', text: 'text-danger' },
  P2: { code: 'P2', label: '影响效率', bg: 'bg-warn', text: 'text-warn' },
  P3: { code: 'P3', label: '一般', bg: 'bg-ink-3', text: 'text-ink-3' },
} as const

export type IncidentUrgency = typeof INCIDENT_URGENCY[keyof typeof INCIDENT_URGENCY]['code']

export const INCIDENT_IMPACT = {
  USER: { code: 'user', label: '单用户' },
  TEAM: { code: 'team', label: '班组' },
  DEPT: { code: 'dept', label: '部门' },
  FAB: { code: 'fab', label: 'Fab 级' },
} as const

export type IncidentImpact = typeof INCIDENT_IMPACT[keyof typeof INCIDENT_IMPACT]['code']

export const ENGINEER_TYPE = {
  network: { code: 'network', label: '网络', team: 'IT 基础设施组', color: 'text-research' },
  dba: { code: 'dba', label: '数据库', team: 'IT 数据组', color: 'text-ignite' },
  system: { code: 'system', label: '系统应用', team: 'IT 应用组', color: 'text-pink' },
  security: { code: 'security', label: '安全', team: 'IT 安全组', color: 'text-indigo' },
} as const

export type EngineerType = keyof typeof ENGINEER_TYPE

// Status display config
export const STATUS_CONFIG: Record<IncidentStatus, { label: string; bg: string; text: string }> = {
  pending_takeover: { label: '待接单', bg: 'bg-warn-soft', text: 'text-warn' },
  processing: { label: '处理中', bg: 'bg-ignite-soft', text: 'text-ignite' },
  transferred: { label: '转派处理中', bg: 'bg-pink/10', text: 'text-pink' },
  pending_confirm: { label: '待确认', bg: 'bg-research/10', text: 'text-research' },
  closed: { label: '已关闭', bg: 'bg-success-soft', text: 'text-success' },
}

// SLA Matrix: [type][urgency] = { responseHours, closeHours }
export const SLA_MATRIX: Record<IncidentType, Partial<Record<IncidentUrgency, { responseHours: number; closeHours: number }>>> = {
  system: {
    P1: { responseHours: 2, closeHours: 8 },
    P2: { responseHours: 4, closeHours: 8 },
    P3: { responseHours: 8, closeHours: 24 },
  },
  network: {
    P1: { responseHours: 1, closeHours: 4 },
    P2: { responseHours: 2, closeHours: 4 },
    P3: { responseHours: 4, closeHours: 8 },
  },
  account: {
    P2: { responseHours: 2, closeHours: 4 },
    P3: { responseHours: 4, closeHours: 8 },
  },
  equipment: {
    P2: { responseHours: 4, closeHours: 8 },
    P3: { responseHours: 8, closeHours: 24 },
  },
  other: {
    P2: { responseHours: 4, closeHours: 8 },
    P3: { responseHours: 8, closeHours: 24 },
  },
}

export interface CimimsIncident {
  id: string
  incidentNo: string // INC-2026-XXXX
  title: string
  description: string
  type: IncidentType
  urgency: IncidentUrgency
  status: IncidentStatus
  impactScope: IncidentImpact
  submitter: string
  submitterName: string
  duty?: string
  dutyName?: string
  engineer?: string
  engineerName?: string
  engineerType?: EngineerType
  relatedSystem?: string
  relatedRequestId?: string
  attachments?: string[]
  slaHours?: number
  responseSlaHours?: number
  createdAt: string
  updatedAt: string
  closedAt?: string
  timeline?: CimimsTimelineEntry[]
}

export interface CimimsTimelineEntry {
  id: string
  incidentId: string
  action: string
  actor: string
  actorName: string
  detail?: string
  isInternal: boolean
  createdAt: string
}

export interface CimimsTodo {
  id: string
  title: string
  label: 'red' | 'green' | 'blue'
  priority: IncidentUrgency
  status: 'open' | 'done' | 'dismissed'
  relatedIncidentId?: string
  dueAt?: string
  createdAt: string
  updatedAt?: string
}

export interface CimimsAuditLog {
  id: string
  timestamp: string
  incidentId: string
  incidentNo: string
  event: string
  type: 'status_change' | 'comment' | 'takeover' | 'transfer' | 'escalation' | 'close'
  actor: string
  actorName: string
  detail?: string
}

export interface CimimsException {
  id: string
  incidentId: string
  incidentNo: string
  title: string
  type: 'sla_breach' | 'sla_50'
  severity: 'critical' | 'warning'
  currentStatus: IncidentStatus
  hoursElapsed: number
  slaHours: number
  assignee?: string
  createdAt: string
}

export interface CimimsNotificationRule {
  id: string
  event: string
  label: string
  inApp: boolean
  email: boolean
}

// Mock users
export const MOCK_USERS: Record<string, { name: string; email: string; role: string }> = {
  'u1': { name: '张志豪', email: 'zhang.zh@mrdi.com', role: 'duty' },
  'u2': { name: '王经理', email: 'wang.j@mrdi.com', role: 'auditor' },
  'u3': { name: '陈工', email: 'chen.g@mrdi.com', role: 'viewer' },
  'u4': { name: '李总监', email: 'li.d@mrdi.com', role: 'auditor' },
}

// Mock incidents
export const MOCK_INCIDENTS: CimimsIncident[] = [
  { id: 'i1', incidentNo: 'INC-2026-0287', title: 'MES 报表服务无法访问', description: 'Fab-1 车间 MES 报表模块无法打开，影响 PE 日常数据查看。', type: 'system', urgency: 'P1', status: 'pending_takeover', impactScope: 'fab', submitter: 'u3', submitterName: '王工 (PE)', slaHours: 4, createdAt: '2026-07-15T07:30:00Z', updatedAt: '2026-07-15T07:30:00Z', timeline: [{ id: 't1', incidentId: 'i1', action: '上报事件', actor: 'u3', actorName: '王工 (PE)', detail: 'Fab-1 车间 MES 报表无法访问', isInternal: false, createdAt: '2026-07-15T07:30:00Z' }] },
  { id: 'i2', incidentNo: 'INC-2026-0286', title: 'VPN 账号无法登录', description: '出差工程师反映 VPN 账号一直报错，无法连接公司内网。', type: 'account', urgency: 'P2', status: 'processing', impactScope: 'user', submitter: 'u3', submitterName: '王工 (PE)', duty: 'u1', dutyName: '张志豪', slaHours: 4, createdAt: '2026-07-15T06:50:00Z', updatedAt: '2026-07-15T07:00:00Z', timeline: [] },
  { id: 'i3', incidentNo: 'INC-2026-0285', title: '工程师 PC 软件版本不一致', description: '多名工程师反映 CAD 软件版本差异导致文件兼容问题。', type: 'system', urgency: 'P2', status: 'transferred', impactScope: 'team', submitter: 'u3', submitterName: '王工 (PE)', duty: 'u1', dutyName: '张志豪', engineer: 'u2', engineerName: '王经理', engineerType: 'system', slaHours: 8, createdAt: '2026-07-15T06:00:00Z', updatedAt: '2026-07-15T06:30:00Z', timeline: [] },
  { id: 'i4', incidentNo: 'INC-2026-0284', title: '打印机驱动异常', description: 'Etch 区打印机无法识别新批次纸张，打印空白。', type: 'equipment', urgency: 'P3', status: 'closed', impactScope: 'team', submitter: 'u3', submitterName: '王工 (PE)', duty: 'u1', dutyName: '张志豪', slaHours: 24, createdAt: '2026-07-14T10:00:00Z', updatedAt: '2026-07-14T12:00:00Z', closedAt: '2026-07-14T12:00:00Z', timeline: [] },
  { id: 'i5', incidentNo: 'INC-2026-0283', title: '申请开通 SPC 模块只读权限', description: '新进 PE 需要 SPC 模块只读权限用于数据分析。', type: 'account', urgency: 'P3', status: 'closed', impactScope: 'user', submitter: 'u3', submitterName: '王工 (PE)', duty: 'u1', dutyName: '张志豪', slaHours: 8, createdAt: '2026-07-14T08:00:00Z', updatedAt: '2026-07-14T11:30:00Z', closedAt: '2026-07-14T11:30:00Z', timeline: [] },
]

export const MOCK_TODOS: CimimsTodo[] = [
  { id: 't1', title: '接单 INC-0287 · MES 报表服务无法访问', label: 'red', priority: 'P1', status: 'open', relatedIncidentId: 'i1', dueAt: '今天 11:30', createdAt: '2026-07-15T07:30:00Z' },
  { id: 't2', title: '处置 INC-0286 · VPN 账号无法登录', label: 'red', priority: 'P2', status: 'open', relatedIncidentId: 'i2', dueAt: '今天 10:50', createdAt: '2026-07-15T06:50:00Z' },
  { id: 't3', title: 'FYI: Q3 系统升级 7/20 通知', label: 'blue', priority: 'P3', status: 'open', dueAt: '7/20', createdAt: '2026-07-10T09:00:00Z' },
]

export const MOCK_AUDIT_LOGS: CimimsAuditLog[] = [
  { id: 'a1', timestamp: '2026-07-15T07:30:00Z', incidentId: 'i1', incidentNo: 'INC-2026-0287', event: '上报事件', type: 'status_change', actor: 'u3', actorName: '王工 (PE)', detail: 'Fab-1 车间 MES 报表无法访问' },
  { id: 'a2', timestamp: '2026-07-15T07:00:00Z', incidentId: 'i2', incidentNo: 'INC-2026-0286', event: '接单', type: 'takeover', actor: 'u1', actorName: '张志豪', detail: 'IT 值班张志豪接单处理' },
  { id: 'a3', timestamp: '2026-07-15T06:30:00Z', incidentId: 'i3', incidentNo: 'INC-2026-0285', event: '转派', type: 'transfer', actor: 'u1', actorName: '张志豪', detail: '转派给 IT 应用组 · 王经理' },
  { id: 'a4', timestamp: '2026-07-14T12:00:00Z', incidentId: 'i4', incidentNo: 'INC-2026-0284', event: '关闭', type: 'close', actor: 'u1', actorName: '张志豪', detail: '已更换驱动，问题解决' },
]

export const MOCK_EXCEPTIONS: CimimsException[] = [
  { id: 'e1', incidentId: 'i1', incidentNo: 'INC-2026-0287', title: 'MES 报表服务无法访问', type: 'sla_breach', severity: 'critical', currentStatus: 'pending_takeover', hoursElapsed: 4.5, slaHours: 4, assignee: '张志豪', createdAt: '2026-07-15T07:30:00Z' },
  { id: 'e2', incidentId: 'i2', incidentNo: 'INC-2026-0286', title: 'VPN 账号无法登录', type: 'sla_50', severity: 'warning', currentStatus: 'processing', hoursElapsed: 2.1, slaHours: 4, assignee: '张志豪', createdAt: '2026-07-15T06:50:00Z' },
]

// SLA distribution data for dashboard
export const TYPE_DISTRIBUTION = [
  { type: '系统故障', count: 5, pct: 45, color: 'bg-research' },
  { type: '网络问题', count: 3, pct: 28, color: 'bg-ignite' },
  { type: '账号问题', count: 2, pct: 15, color: 'bg-pink' },
  { type: '设备关联', count: 1, pct: 8, color: 'bg-indigo' },
  { type: '其他', count: 1, pct: 4, color: 'bg-ink-3' },
]
