/**
 * 跨服务枚举 — 4 个业务 API 共享的状态、类型、角色
 * 跟数据库 ENUM 一一对应，修改需同步 DB migration
 */
export declare const GLOBAL_ROLES: readonly ["admin", "auditor", "editor", "viewer"];
export type GlobalRole = (typeof GLOBAL_ROLES)[number];
export declare const MDM_ROLES: readonly ["mdm-admin", "mdm-editor", "mdm-viewer", "mdm-auditor"];
export type MdmRole = (typeof MDM_ROLES)[number];
export declare const REQUEST_STATUS: readonly ["draft", "submitted", "pending_manager", "pending_cim", "pending_owner", "pending_it", "pending_solution", "pending_uat", "in_progress", "pending_close", "closed", "rejected", "cancelled"];
export type RequestStatus = (typeof REQUEST_STATUS)[number];
export declare const REQUEST_TYPE: readonly ["system", "data", "integration", "security", "other"];
export type RequestType = (typeof REQUEST_TYPE)[number];
export declare const URGENCY: readonly ["P1", "P2", "P3"];
export type Urgency = (typeof URGENCY)[number];
export declare const INCIDENT_STATUS: readonly ["pending_takeover", "processing", "transferred", "pending_confirm", "closed"];
export type IncidentStatus = (typeof INCIDENT_STATUS)[number];
export declare const INCIDENT_TYPE: readonly ["system", "network", "account", "equipment", "other"];
export type IncidentType = (typeof INCIDENT_TYPE)[number];
export declare const IMPACT: readonly ["user", "team", "dept", "fab"];
export type Impact = (typeof IMPACT)[number];
export declare const ENGINEER_TYPE: readonly ["network", "dba", "system", "security"];
export type EngineerType = (typeof ENGINEER_TYPE)[number];
export declare const IMS_USER_ROLES: readonly ["admin", "auditor", "engineer", "duty", "viewer"];
export type ImsUserRole = (typeof IMS_USER_ROLES)[number];
export declare const PERMISSION_STATUS: readonly ["pending_it_review", "pending_owner_review", "pending_grant", "granted", "expiring_soon", "expired", "revoked", "rejected"];
export type PermissionStatus = (typeof PERMISSION_STATUS)[number];
export declare const PERMISSION_TYPE: readonly ["system_access", "functional", "data_export", "temporary", "batch"];
export type PermissionTypeCode = (typeof PERMISSION_TYPE)[number];
export declare const PERMISSION_LEVEL: readonly ["read", "write", "admin"];
export type PermissionLevel = (typeof PERMISSION_LEVEL)[number];
export declare const PERMISSION_URGENCY: readonly ["normal", "urgent", "critical"];
export type PermissionUrgency = (typeof PERMISSION_URGENCY)[number];
export declare const AUDIT_EVENT_TYPE: readonly ["submit", "it_review", "owner_review", "grant", "revoke", "expire", "expire_warning", "withdraw", "extend", "comment", "config_change", "force_close", "reopen", "link_request", "state_change", "sla_warning", "escalation"];
export type AuditEventType = (typeof AUDIT_EVENT_TYPE)[number];
export declare function isValidEnum<T extends readonly string[]>(value: unknown, enumArr: T): value is T[number];
//# sourceMappingURL=index.d.ts.map