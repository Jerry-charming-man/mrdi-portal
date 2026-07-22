// ============================================================
// CIM-PERM V1.0 Types — 按设计规范完全对齐
// ============================================================

// --- Enums ---

export type PermissionStatus =
  | 'pending_it_review'
  | 'pending_owner_review'
  | 'pending_grant'
  | 'granted'
  | 'expiring_soon'
  | 'expired'
  | 'revoked'
  | 'rejected'

export type PermissionType =
  | 'system_access'
  | 'functional'
  | 'data_export'
  | 'temporary'
  | 'batch'

export type PermissionLevel = 'read' | 'write' | 'admin'

export type UrgencyLevel = 'normal' | 'urgent' | 'critical'

// --- Status config (设计规范 2.1) ---
export const PERM_STATUS = {
  pending_it_review:   { label: '待 IT 审核',   bg: 'bg-warn-soft',    text: 'text-warn',    pulse: false },
  pending_owner_review:{ label: '待 Owner 核准', bg: 'bg-indigo/10',    text: 'text-indigo',  pulse: false },
  pending_grant:       { label: '待授予',        bg: 'bg-module',       text: 'text-ink-2',  pulse: false },
  granted:             { label: '已授予',        bg: 'bg-success-soft', text: 'text-success', pulse: false },
  expiring_soon:       { label: '即将过期',      bg: 'bg-danger-soft',  text: 'text-danger',  pulse: true  },
  expired:             { label: '已过期',        bg: 'bg-ink-5/30',     text: 'text-ink-3',  pulse: false },
  revoked:             { label: '已撤销',        bg: 'bg-ink-5/30',     text: 'text-ink-3',  pulse: false },
  rejected:            { label: '已驳回',        bg: 'bg-danger-soft',  text: 'text-danger',  pulse: false },
} as const

// --- Type config (设计规范 2.2) ---
export const PERM_TYPE = {
  system_access: {
    label: '系统访问', defaultDuration: '365d', max: '730d', min: '30d',
    desc: '开通某系统的账号（如 MES、SPC、ERP 系统的登录权限）',
    bg: 'bg-research/10', text: 'text-research',
    color: '#307FE2',
  },
  functional: {
    label: '功能权限', defaultDuration: '30d', max: '90d', min: '1d',
    desc: '系统内特定功能模块的读写权限（如 SPC 漂移查询）',
    bg: 'bg-ignite-soft', text: 'text-ignite',
    color: '#00B388',
  },
  data_export: {
    label: '数据导出', defaultDuration: '7d', max: '30d', min: '1d',
    desc: '特定报表 / 数据的导出权限（高敏感，最长 30 天）',
    bg: 'bg-pink/10', text: 'text-pink',
    color: '#EF60A3',
  },
  temporary: {
    label: '临时权限', defaultDuration: '48h', max: '48h', min: '1h',
    desc: '紧急一次性需求，严格 ≤ 48h 自动回收',
    bg: 'bg-warn-soft', text: 'text-warn',
    color: '#B45309',
  },
  batch: {
    label: '批量权限', defaultDuration: '按申请', max: '365d', min: '1d',
    desc: '批量开通同组用户权限（行政类，需 IT 值班协助）',
    bg: 'bg-indigo/10', text: 'text-indigo',
    color: '#6A6DCD',
  },
} as const

// --- Level config (设计规范 2.3) ---
export const PERM_LEVEL = {
  read:  { label: '只读', bg: 'bg-module',          text: 'text-ink-2' },
  write: { label: '读写', bg: 'bg-research/10',    text: 'text-research' },
  admin: { label: '管理', bg: 'bg-ink',            text: 'text-pure' },
} as const

// --- Urgency config (设计规范 2.4) ---
export const URGENCY = {
  normal:   { label: '常规',   bg: 'bg-module',        text: 'text-ink-2'    },
  urgent:   { label: '🔥 加急', bg: 'bg-warn-soft',    text: 'text-warn'     },
  critical: { label: '紧急',   bg: 'bg-danger-soft',  text: 'text-danger'   },
} as const

// --- Audit event config (设计规范 3.6 + 6.1) ---
export const PERM_AUDIT_TYPE = {
  submit:       { label: '提交',       bg: 'bg-research/10', text: 'text-research' },
  it_review:    { label: 'IT 审核',    bg: 'bg-ignite-soft', text: 'text-ignite'  },
  owner_review: { label: 'Owner 核准', bg: 'bg-indigo/10',   text: 'text-indigo'  },
  grant:        { label: '授予',       bg: 'bg-success-soft',text: 'text-success' },
  revoke:       { label: '撤销',       bg: 'bg-ink-5/30',    text: 'text-ink-3'  },
  expire:       { label: '到期回收',   bg: 'bg-danger-soft', text: 'text-danger'  },
  extend:       { label: '续期',       bg: 'bg-warn-soft',    text: 'text-warn'   },
  comment:      { label: '评论',       bg: 'bg-ink-5/30',    text: 'text-ink-3'  },
  withdraw:     { label: '撤回',       bg: 'bg-ink-5/30',    text: 'text-ink-3'  },
} as const

// --- Duration helpers ---
export function parseDuration(d: string): number {
  if (d.endsWith('d')) return parseInt(d) * 86400
  if (d.endsWith('h')) return parseInt(d) * 3600
  return parseInt(d)
}

export function formatDuration(seconds: number): string {
  if (seconds >= 86400) return `${Math.round(seconds / 86400)}d`
  return `${Math.round(seconds / 3600)}h`
}

// --- Interfaces ---
export interface PermRequest {
  id: string
  requestNo: string
  applicantEmail: string
  applicantName: string
  applicantDept: string
  targetSystem: string
  permissionType: PermissionType
  permissionLevel: PermissionLevel
  resourceId: string
  reason: string
  attachmentIds: string[]
  attachmentNames?: string[]
  relatedIncidentId?: string
  relatedRequestId?: string
  requestedDuration: string
  expiresAt: string
  status: PermissionStatus
  urgency: UrgencyLevel
  itReviewerEmail?: string
  itReviewerName?: string
  itReviewedAt?: string
  ownerReviewerEmail?: string
  ownerReviewerName?: string
  ownerReviewedAt?: string
  grantId?: string
  rejectReason?: string
  revokeReason?: string
  createdAt: string
  updatedAt: string
  closedAt?: string
}

export interface PermAudit {
  id: string
  requestId: string
  eventType: keyof typeof PERM_AUDIT_TYPE
  fromStatus: PermissionStatus | ''
  toStatus: PermissionStatus | ''
  actorEmail: string
  actorName: string
  actorRole: 'applicant' | 'it' | 'owner' | 'system' | 'admin'
  comment?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface PermTodo {
  id: string
  requestId: string
  requestNo: string
  label: string
  desc?: string
  color: 'red' | 'green' | 'blue'
  status: 'open' | 'done' | 'dismissed'
  createdAt: string
  dueAt?: string
}

export interface PermSetting {
  notificationRules: {
    inApp: boolean
    email: boolean
    bb06: boolean
  }
  systemOwners: Array<{ system: string; email: string; name: string }>
  expiringReminderHours: number
}

// ============================================================
// Mock Data
// ============================================================

const now = new Date()
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000).toISOString()
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600000).toISOString()

export const MOCK_REQUESTS: PermRequest[] = [
  {
    id: 'prm-1',
    requestNo: 'PRM-2026-0312',
    applicantEmail: 'chen@mrdi.com',
    applicantName: '陈工',
    applicantDept: 'PE 部',
    targetSystem: 'SPC',
    permissionType: 'functional',
    permissionLevel: 'read',
    resourceId: 'spc:module:cd-drift',
    reason: '因 NC-2026-0142「D02 SPC 漂移调查」需求，需要 SPC 模块的只读权限查看 CD 漂移数据。漂移问题定位完后权限即可回收。如有疑问请联系 IT 值班（张志豪）。',
    attachmentIds: [],
    attachmentNames: ['NC-2026-0142-需求单.pdf'],
    relatedRequestId: 'NC-2026-0142',
    requestedDuration: '30d',
    expiresAt: daysFromNow(29),
    status: 'granted',
    urgency: 'normal',
    itReviewerEmail: 'admin@mrdi.com',
    itReviewerName: '张志豪',
    ownerReviewerEmail: 'owner@mrdi.com',
    ownerReviewerName: '王经理',
    grantId: '0x8f3a2c',
    createdAt: hoursFromNow(-0.2),
    updatedAt: hoursFromNow(-0.17),
  },
  {
    id: 'prm-2',
    requestNo: 'PRM-2026-0311',
    applicantEmail: 'wang@mrdi.com',
    applicantName: '王工',
    applicantDept: 'EE 部',
    targetSystem: 'MES',
    permissionType: 'data_export',
    permissionLevel: 'write',
    resourceId: 'mes:report:production',
    reason: '导出 MES 产线报表用于周度良率分析',
    attachmentIds: [],
    requestedDuration: '7d',
    expiresAt: hoursFromNow(7 * 24),
    status: 'pending_it_review',
    urgency: 'normal',
    itReviewerEmail: 'admin@mrdi.com',
    itReviewerName: '张志豪',
    createdAt: hoursFromNow(-0.63),
    updatedAt: hoursFromNow(-0.63),
  },
  {
    id: 'prm-3',
    requestNo: 'PRM-2026-0310',
    applicantEmail: 'zhang@mrdi.com',
    applicantName: '张志豪',
    applicantDept: 'IT 部',
    targetSystem: 'Etch',
    permissionType: 'functional',
    permissionLevel: 'write',
    resourceId: 'etch:recipe:write',
    reason: 'Etch 机台配方调整需求，需要配方写入权限',
    attachmentIds: [],
    relatedIncidentId: 'INC-2026-0287',
    requestedDuration: '30d',
    expiresAt: daysFromNow(28),
    status: 'pending_owner_review',
    urgency: 'normal',
    itReviewerEmail: 'admin@mrdi.com',
    itReviewerName: '张志豪',
    ownerReviewerEmail: 'owner@mrdi.com',
    ownerReviewerName: '王经理',
    createdAt: hoursFromNow(-1.2),
    updatedAt: hoursFromNow(-1),
  },
  {
    id: 'prm-4',
    requestNo: 'PRM-2026-0309',
    applicantEmail: 'zhou@mrdi.com',
    applicantName: '周工',
    applicantDept: 'PE 部',
    targetSystem: 'SPC',
    permissionType: 'temporary',
    permissionLevel: 'write',
    resourceId: 'spc:export:emergency',
    reason: '紧急导出 SPC 数据用于设备调试',
    attachmentIds: [],
    requestedDuration: '2h',
    expiresAt: hoursFromNow(5),
    status: 'expiring_soon',
    urgency: 'urgent',
    itReviewerEmail: 'admin@mrdi.com',
    itReviewerName: '张志豪',
    ownerReviewerEmail: 'owner@mrdi.com',
    ownerReviewerName: '王经理',
    grantId: 'grant-004',
    createdAt: hoursFromNow(-19),
    updatedAt: hoursFromNow(-18),
  },
  {
    id: 'prm-5',
    requestNo: 'PRM-2026-0308',
    applicantEmail: 'wang@mrdi.com',
    applicantName: '王经理',
    applicantDept: '生产部',
    targetSystem: 'D02',
    permissionType: 'system_access',
    permissionLevel: 'admin',
    resourceId: 'equipment:E02',
    reason: 'D02 设备管理权限，用于产线维护',
    attachmentIds: [],
    requestedDuration: '90d',
    expiresAt: daysFromNow(87),
    status: 'granted',
    urgency: 'normal',
    itReviewerEmail: 'admin@mrdi.com',
    itReviewerName: '张志豪',
    ownerReviewerEmail: 'owner@mrdi.com',
    ownerReviewerName: '王经理',
    grantId: 'grant-005',
    createdAt: daysFromNow(-3),
    updatedAt: daysFromNow(-2.8),
  },
  {
    id: 'prm-6',
    requestNo: 'PRM-2026-0307',
    applicantEmail: 'li@mrdi.com',
    applicantName: '李明',
    applicantDept: 'PE 部',
    targetSystem: 'MES',
    permissionType: 'functional',
    permissionLevel: 'write',
    resourceId: 'mes:module:production-report',
    reason: 'MES 生产报表录入，用于日报生成',
    attachmentIds: [],
    relatedRequestId: 'NC-2026-0145',
    requestedDuration: '30d',
    expiresAt: hoursFromNow(8),
    status: 'expiring_soon',
    urgency: 'normal',
    itReviewerEmail: 'admin@mrdi.com',
    itReviewerName: '张志豪',
    ownerReviewerEmail: 'owner@mrdi.com',
    ownerReviewerName: '王经理',
    grantId: 'grant-007',
    createdAt: daysFromNow(-22),
    updatedAt: daysFromNow(-21),
  },
  {
    id: 'prm-7',
    requestNo: 'PRM-2026-0306',
    applicantEmail: 'zhang@mrdi.com',
    applicantName: '张志豪',
    applicantDept: 'IT 部',
    targetSystem: 'MES',
    permissionType: 'data_export',
    permissionLevel: 'read',
    resourceId: 'mes:report:yield',
    reason: '导出良率报表用于周会汇报',
    attachmentIds: [],
    requestedDuration: '7d',
    expiresAt: hoursFromNow(14),
    status: 'expiring_soon',
    urgency: 'urgent',
    itReviewerEmail: 'admin@mrdi.com',
    itReviewerName: '张志豪',
    ownerReviewerEmail: 'owner@mrdi.com',
    ownerReviewerName: '王经理',
    grantId: 'grant-006',
    createdAt: daysFromNow(-20),
    updatedAt: daysFromNow(-19),
  },
  {
    id: 'prm-8',
    requestNo: 'PRM-2026-0305',
    applicantEmail: 'liu@mrdi.com',
    applicantName: '刘洋',
    applicantDept: '生产部',
    targetSystem: 'SPC',
    permissionType: 'batch',
    permissionLevel: 'read',
    resourceId: 'spc:all-reports',
    reason: '新员工入职需要批量开通报表权限',
    attachmentIds: [],
    requestedDuration: '90d',
    expiresAt: daysFromNow(88),
    status: 'pending_it_review',
    urgency: 'normal',
    itReviewerEmail: 'admin@mrdi.com',
    itReviewerName: '张志豪',
    createdAt: hoursFromNow(-3),
    updatedAt: hoursFromNow(-3),
  },
]

export const MOCK_AUDITS: PermAudit[] = [
  {
    id: 'audit-1', requestId: 'prm-1', eventType: 'submit',
    fromStatus: '', toStatus: 'pending_it_review',
    actorEmail: 'chen@mrdi.com', actorName: '陈工 (PE)', actorRole: 'applicant',
    comment: '请尽快审批，生产需要', createdAt: hoursFromNow(-0.2),
  },
  {
    id: 'audit-2', requestId: 'prm-1', eventType: 'it_review',
    fromStatus: 'pending_it_review', toStatus: 'pending_owner_review',
    actorEmail: 'admin@mrdi.com', actorName: '张志豪 (IT 值班)', actorRole: 'it',
    comment: '关联需求 NC-0142，合理', createdAt: hoursFromNow(-0.17),
  },
  {
    id: 'audit-3', requestId: 'prm-1', eventType: 'owner_review',
    fromStatus: 'pending_owner_review', toStatus: 'pending_grant',
    actorEmail: 'owner@mrdi.com', actorName: '王经理 (SPC Owner)', actorRole: 'owner',
    comment: '业务需求合理，核准', createdAt: hoursFromNow(-0.083),
  },
  {
    id: 'audit-4', requestId: 'prm-1', eventType: 'grant',
    fromStatus: 'pending_grant', toStatus: 'granted',
    actorEmail: 'system@mrdi.com', actorName: '系统', actorRole: 'system',
    metadata: { grantId: '0x8f3a2c', duration: '30d' }, createdAt: hoursFromNow(-0.05),
  },
  {
    id: 'audit-5', requestId: 'prm-6', eventType: 'grant',
    fromStatus: 'pending_grant', toStatus: 'expiring_soon',
    actorEmail: 'system@mrdi.com', actorName: '系统', actorRole: 'system',
    metadata: { grantId: 'grant-007', duration: '30d' }, createdAt: daysFromNow(-22),
  },
  {
    id: 'audit-6', requestId: 'prm-8', eventType: 'submit',
    fromStatus: '', toStatus: 'pending_it_review',
    actorEmail: 'liu@mrdi.com', actorName: '刘洋', actorRole: 'applicant',
    createdAt: hoursFromNow(-3),
  },
  {
    id: 'audit-7', requestId: 'prm-3', eventType: 'submit',
    fromStatus: '', toStatus: 'pending_it_review',
    actorEmail: 'zhang@mrdi.com', actorName: '张志豪', actorRole: 'applicant',
    comment: '关联 INC-2026-0287', createdAt: hoursFromNow(-1.2),
  },
  {
    id: 'audit-8', requestId: 'prm-3', eventType: 'it_review',
    fromStatus: 'pending_it_review', toStatus: 'pending_owner_review',
    actorEmail: 'admin@mrdi.com', actorName: '张志豪 (IT 值班)', actorRole: 'it',
    comment: '合理性审核通过', createdAt: hoursFromNow(-1),
  },
]

export const MOCK_TODOS: PermTodo[] = [
  { id: 'td-1', requestId: 'prm-6', requestNo: 'PRM-2026-0307', label: '权限即将过期 · MES 报表读写', desc: '还剩 8h · 30 天', color: 'red', status: 'open', createdAt: daysFromNow(-1), dueAt: hoursFromNow(8) },
  { id: 'td-2', requestId: 'prm-7', requestNo: 'PRM-2026-0306', label: '权限即将过期 · MES 良率导出', desc: '还剩 14h · 7 天', color: 'red', status: 'open', createdAt: daysFromNow(-1), dueAt: hoursFromNow(14) },
  { id: 'td-3', requestId: 'prm-4', requestNo: 'PRM-2026-0309', label: '权限即将过期 · SPC 紧急导出', desc: '还剩 5h · 2h', color: 'red', status: 'open', createdAt: hoursFromNow(-19), dueAt: hoursFromNow(5) },
  { id: 'td-4', requestId: 'prm-1', requestNo: 'PRM-2026-0312', label: '权限已开通 · SPC 模块 / read', desc: '30 天', color: 'green', status: 'open', createdAt: hoursFromNow(-0.05) },
  { id: 'td-5', requestId: 'prm-8', requestNo: 'PRM-2026-0305', label: 'SPC 批量权限待 IT 审核', desc: '刘洋 · 90d', color: 'green', status: 'open', createdAt: hoursFromNow(-3) },
]

export const MOCK_EXPIRING: PermRequest[] = MOCK_REQUESTS.filter(r => r.status === 'expiring_soon')

export const TYPE_DISTRIBUTION = [
  { type: '系统访问', count: 12, pct: 38 },
  { type: '功能权限', count: 10, pct: 32 },
  { type: '数据导出', count: 6,  pct: 18 },
  { type: '临时权限', count: 2,  pct: 8  },
  { type: '批量权限', count: 1,  pct: 4  },
]
