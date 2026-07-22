/**
 * 跨服务枚举 — 4 个业务 API 共享的状态、类型、角色
 * 跟数据库 ENUM 一一对应，修改需同步 DB migration
 */
// ====== 通用角色 ======
export const GLOBAL_ROLES = ['admin', 'auditor', 'editor', 'viewer'];
// ====== MRDI MDM 专用角色 ======
export const MDM_ROLES = [
    'mdm-admin',
    'mdm-editor',
    'mdm-viewer',
    'mdm-auditor',
];
// ====== CIM-RMS 需求状态（13 个状态，详见 V1.0-状态机实现规范）======
export const REQUEST_STATUS = [
    'draft', // 草稿
    'submitted', // 已提交
    'pending_manager', // 待主管审批
    'pending_cim', // 待 CIM 审核
    'pending_owner', // 待 Owner 评估
    'pending_it', // 待 IT 评估
    'pending_solution', // 待方案制定
    'pending_uat', // 待用户验收
    'in_progress', // 实施中
    'pending_close', // 待关闭确认
    'closed', // 已关闭
    'rejected', // 已拒绝
    'cancelled', // 已取消
];
export const REQUEST_TYPE = [
    'system',
    'data',
    'integration',
    'security',
    'other',
];
export const URGENCY = ['P1', 'P2', 'P3'];
// ====== CIM-IMS 工单状态 ======
export const INCIDENT_STATUS = [
    'pending_takeover',
    'processing',
    'transferred',
    'pending_confirm',
    'closed',
];
export const INCIDENT_TYPE = [
    'system',
    'network',
    'account',
    'equipment',
    'other',
];
export const IMPACT = ['user', 'team', 'dept', 'fab'];
export const ENGINEER_TYPE = ['network', 'dba', 'system', 'security'];
export const IMS_USER_ROLES = [
    'admin',
    'auditor',
    'engineer',
    'duty',
    'viewer',
];
// ====== CIM-PERM 申请状态 ======
export const PERMISSION_STATUS = [
    'pending_it_review',
    'pending_owner_review',
    'pending_grant',
    'granted',
    'expiring_soon',
    'expired',
    'revoked',
    'rejected',
];
export const PERMISSION_TYPE = [
    'system_access',
    'functional',
    'data_export',
    'temporary',
    'batch',
];
export const PERMISSION_LEVEL = ['read', 'write', 'admin'];
export const PERMISSION_URGENCY = ['normal', 'urgent', 'critical'];
export const AUDIT_EVENT_TYPE = [
    'submit',
    'it_review',
    'owner_review',
    'grant',
    'revoke',
    'expire',
    'expire_warning',
    'withdraw',
    'extend',
    'comment',
    'config_change',
    'force_close',
    'reopen',
    'link_request',
    'state_change',
    'sla_warning',
    'escalation',
];
// ====== 工具：枚举校验 ======
export function isValidEnum(value, enumArr) {
    return typeof value === 'string' && enumArr.includes(value);
}
//# sourceMappingURL=index.js.map