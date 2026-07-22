// CIM-RMS TypeScript Types
// API Base: http://localhost:3000/cimrms-api/v1/

export const REQUEST_STATUS = {
  SUBMITTED: 'submitted',
  PENDING_MANAGER: 'pending_manager',
  MANAGER_REJECTED: 'manager_rejected',
  POOL: 'pool',
  SCHEDULED: 'scheduled',
  IN_DEVELOPMENT: 'in_development',
  PENDING_UAT: 'pending_uat',
  PENDING_DEPLOY: 'pending_deploy',
  DEPLOYED: 'deployed',
  PENDING_ACCEPTANCE: 'pending_acceptance',
  CLOSED: 'closed',
} as const

export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS]

export const REQUEST_TYPE = {
  FEATURE: { code: 'feature', label: '功能开发' },
  CONFIG: { code: 'config', label: '系统配置' },
  REPORT: { code: 'report', label: '报表需求' },
  INTEGRATION: { code: 'integration', label: '接口对接' },
  OTHER: { code: 'other', label: '其他' },
} as const

export type RequestType = typeof REQUEST_TYPE[keyof typeof REQUEST_TYPE]['code']

export const URGENCY = {
  P1: { code: 'P1', label: '紧急', color: '#B91C1C', bg: 'bg-danger-soft', text: 'text-danger' },
  P2: { code: 'P2', label: '一般', color: '#B45309', bg: 'bg-warn-soft', text: 'text-warn' },
  P3: { code: 'P3', label: '低', color: '#6B6B6B', bg: 'bg-module', text: 'text-ink-3' },
} as const

export type Urgency = typeof URGENCY[keyof typeof URGENCY]['code']

export interface CimrmsUser {
  id: string
  name: string
  email: string
  department: string
  role: 'admin' | 'auditor' | 'editor' | 'viewer'
  manager?: string
  teams?: string[]
}

export interface CimrmsRequest {
  id: string
  requestNo: string // NC-2026-XXXX
  title: string
  description: string
  type: RequestType
  urgency: Urgency
  status: RequestStatus
  submitter: string
  submitterName: string
  assignee?: string
  assigneeName?: string
  team?: string
  relatedSystem?: string
  relatedIncidentId?: string
  expectedDate?: string
  attachments?: string[]
  createdAt: string
  updatedAt: string
  slaHours?: number
  events?: CimrmsEvent[]
}

export interface CimrmsEvent {
  id: string
  requestId: string
  event: string
  actor: string
  actorName: string
  detail?: string
  createdAt: string
}

export interface CimrmsComment {
  id: string
  requestId: string
  author: string
  authorName: string
  content: string
  createdAt: string
}

export interface CimrmsTodo {
  id: string
  title: string
  label: 'red' | 'green' | 'blue'
  priority: Urgency
  status: 'open' | 'done' | 'dismissed'
  relatedRequestId?: string
  dueAt?: string
  createdAt: string
  updatedAt?: string
}

export interface CimrmsAuditLog {
  id: string
  timestamp: string
  requestId: string
  requestNo: string
  event: string
  actor: string
  actorName: string
  detail?: string
  type: 'status_change' | 'comment' | 'assignment' | 'escalation' | 'attachment'
}

export interface CimrmsException {
  id: string
  requestId: string
  requestNo: string
  title: string
  type: 'sla_breach' | 'sla_50' | 'rejected_loop'
  severity: 'critical' | 'warning'
  currentStatus: RequestStatus
  hoursElapsed: number
  slaHours: number
  assignee?: string
  createdAt: string
}

export interface CimrmsNotificationRule {
  id: string
  event: string
  label: string
  inApp: boolean
  email: boolean
}

// Status → display config
export const STATUS_CONFIG: Record<RequestStatus, { label: string; bg: string; text: string }> = {
  submitted: { label: '已提交', bg: 'bg-module', text: 'text-ink-3' },
  pending_manager: { label: '待主管审批', bg: 'bg-warn-soft', text: 'text-warn' },
  manager_rejected: { label: '已驳回', bg: 'bg-danger-soft', text: 'text-danger' },
  pool: { label: '需求池', bg: 'bg-module', text: 'text-ink-3' },
  scheduled: { label: '已排期', bg: 'bg-ignite-soft', text: 'text-ignite' },
  in_development: { label: '开发中', bg: 'bg-ignite-soft', text: 'text-ignite' },
  pending_uat: { label: '待 UAT', bg: 'bg-research/10', text: 'text-research' },
  pending_deploy: { label: '待上线', bg: 'bg-ignite-soft', text: 'text-ignite' },
  deployed: { label: '已上线', bg: 'bg-ignite-soft', text: 'text-ignite' },
  pending_acceptance: { label: '待验收', bg: 'bg-research/10', text: 'text-research' },
  closed: { label: '已关闭', bg: 'bg-success-soft', text: 'text-success' },
}

// Mock users
export const MOCK_USERS: CimrmsUser[] = [
  { id: 'u1', name: '张志豪', email: 'zhang.zh@mrdi.com', department: 'Fab-1', role: 'editor', teams: ['IT-CIM'] },
  { id: 'u2', name: '王经理', email: 'wang.j@mrdi.com', department: 'IT', role: 'auditor', teams: ['IT'] },
  { id: 'u3', name: '陈工', email: 'chen.g@mrdi.com', department: 'PE', role: 'viewer' },
  { id: 'u4', name: '李总监', email: 'li.d@mrdi.com', department: 'IT', role: 'auditor', teams: ['IT'] },
]

// Mock requests
export const MOCK_REQUESTS: CimrmsRequest[] = [
  { id: 'r1', requestNo: 'NC-2026-0142', title: 'D02 SPC 漂移调查', description: 'D02 腔体近期 SPC 数据持续漂移，需排查原因并调整控制限。', type: 'feature', urgency: 'P1', status: 'pending_manager', submitter: 'u3', submitterName: '陈工 (PE)', relatedSystem: 'SPC', createdAt: '2026-07-15T07:30:00Z', updatedAt: '2026-07-15T07:30:00Z', slaHours: 24, events: [{ id: 'e1', requestId: 'r1', event: '提交需求', actor: 'u3', actorName: '陈工 (PE)', createdAt: '2026-07-15T07:30:00Z' }, { id: 'e2', requestId: 'r1', event: '自动派单至主管', actor: 'system', actorName: '系统', detail: '派单至 IT 主管王经理', createdAt: '2026-07-15T07:30:01Z' }] },
  { id: 'r2', requestNo: 'NC-2026-0141', title: 'Etch 区 PM 频次调整', description: '根据近期设备状态数据，Etch 区 PM 频次需从每月1次调整为每月2次。', type: 'config', urgency: 'P2', status: 'closed', submitter: 'u3', submitterName: '陈工 (PE)', assignee: 'u1', assigneeName: '张志豪', relatedSystem: 'MES', createdAt: '2026-07-10T09:00:00Z', updatedAt: '2026-07-14T16:00:00Z', slaHours: 48, events: [] },
  { id: 'r3', requestNo: 'NC-2026-0140', title: 'CMP 区域报表自动生成', description: 'CMP 区域生产报表需从手动改为自动生成，减少 PE 重复劳动。', type: 'report', urgency: 'P2', status: 'pending_uat', submitter: 'u3', submitterName: '陈工 (PE)', assignee: 'u1', assigneeName: '张志豪', relatedSystem: 'MES', createdAt: '2026-07-08T10:00:00Z', updatedAt: '2026-07-14T14:00:00Z', slaHours: 72, events: [] },
  { id: 'r4', requestNo: 'NC-2026-0139', title: 'Photo 区 MES 接口超时重试', description: 'Photo 区 MES 接口频繁超时，需要增加自动重试机制。', type: 'integration', urgency: 'P1', status: 'in_development', submitter: 'u3', submitterName: '陈工 (PE)', assignee: 'u1', assigneeName: '张志豪', team: 'IT-CIM', relatedSystem: 'MES', createdAt: '2026-07-05T08:00:00Z', updatedAt: '2026-07-12T10:00:00Z', slaHours: 12, events: [] },
  { id: 'r5', requestNo: 'NC-2026-0138', title: '报表自动生成 V2', description: '在 V1 基础上增加多维度分析和导出功能。', type: 'report', urgency: 'P3', status: 'deployed', submitter: 'u3', submitterName: '陈工 (PE)', assignee: 'u1', assigneeName: '张志豪', team: 'IT-CIM', relatedSystem: 'MES', createdAt: '2026-06-28T09:00:00Z', updatedAt: '2026-07-14T18:00:00Z', slaHours: 168, events: [] },
]

export const MOCK_TODOS: CimrmsTodo[] = [
  { id: 't1', title: 'UAT 验证 · NC-0140 CMP 区域报表自动生成', label: 'red', priority: 'P1', status: 'open', relatedRequestId: 'r3', dueAt: '今天 18:00', createdAt: '2026-07-14T14:00:00Z' },
  { id: 't2', title: '审批 NC-2026-0142 D02 SPC 漂移调查', label: 'red', priority: 'P1', status: 'open', relatedRequestId: 'r1', dueAt: '今天 17:00', createdAt: '2026-07-15T07:30:00Z' },
  { id: 't3', title: 'FYI: Q3 系统升级 7/20 通知', label: 'blue', priority: 'P3', status: 'open', dueAt: '7/20', createdAt: '2026-07-10T09:00:00Z' },
]

export const MOCK_AUDIT_LOGS: CimrmsAuditLog[] = [
  { id: 'a1', timestamp: '2026-07-15T07:30:00Z', requestId: 'r1', requestNo: 'NC-2026-0142', event: '状态变更', actor: 'system', actorName: '系统', detail: 'submitted → pending_manager', type: 'status_change' },
  { id: 'a2', timestamp: '2026-07-15T06:00:00Z', requestId: 'r4', requestNo: 'NC-2026-0139', event: '开发完成', actor: 'u1', actorName: '张志豪', detail: '标记为开发完成，等待 UAT', type: 'status_change' },
  { id: 'a3', timestamp: '2026-07-14T18:00:00Z', requestId: 'r5', requestNo: 'NC-2026-0138', event: '上线完成', actor: 'u1', actorName: '张志豪', detail: '报表自动生成 V2 已上线生产环境', type: 'status_change' },
  { id: 'a4', timestamp: '2026-07-14T16:00:00Z', requestId: 'r2', requestNo: 'NC-2026-0141', event: '关闭', actor: 'u3', actorName: '陈工 (PE)', detail: '验收通过，正式关闭', type: 'status_change' },
  { id: 'a5', timestamp: '2026-07-14T14:00:00Z', requestId: 'r3', requestNo: 'NC-2026-0140', event: '状态变更', actor: 'u1', actorName: '张志豪', detail: 'in_development → pending_uat', type: 'status_change' },
]

export const MOCK_EXCEPTIONS: CimrmsException[] = [
  { id: 'ex1', requestId: 'r4', requestNo: 'NC-2026-0139', title: 'CMP 区域报表自动生成', type: 'sla_breach', severity: 'critical', currentStatus: 'in_development', hoursElapsed: 72, slaHours: 12, assignee: '张志豪', createdAt: '2026-07-05T08:00:00Z' },
  { id: 'ex2', requestId: 'r3', requestNo: 'NC-2026-0140', title: 'Photo 区 MES 接口超时重试', type: 'sla_50', severity: 'warning', currentStatus: 'pending_uat', hoursElapsed: 6, slaHours: 12, assignee: '张志豪', createdAt: '2026-07-08T10:00:00Z' },
]
