// ============================================================
// Shared types for CIM-PERM API
// ============================================================

export type PermStatus =
  | 'pending_it_review' | 'pending_owner_review' | 'pending_grant'
  | 'granted' | 'expiring_soon' | 'expired' | 'revoked' | 'rejected'

export type PermType =
  | 'system_access' | 'functional' | 'data_export' | 'temporary' | 'batch'

export type PermLevel = 'read' | 'write' | 'admin'

export type Urgency = 'normal' | 'urgent' | 'critical'

export type AuditEvent =
  | 'submit' | 'it_review' | 'owner_review' | 'grant'
  | 'revoke' | 'expire' | 'extend' | 'comment' | 'withdraw' | 'expire_warning'

export type ActorRole = 'applicant' | 'it' | 'owner' | 'system' | 'admin'

// --- DB Row types ---
export interface PermRequestRow {
  id:                  string
  request_no:          string
  applicant_email:     string
  applicant_name:      string | null
  applicant_dept:      string
  target_system:       string
  permission_type:    PermType
  permission_level:    PermLevel
  resource_id:         string
  reason:              string
  attachment_ids:      string[]
  related_incident_id: string | null
  related_request_id:  string | null
  requested_duration:  string
  expires_at:          Date
  status:             PermStatus
  urgency:            Urgency
  it_reviewer_email:  string | null
  it_reviewer_name:   string | null
  it_reviewed_at:     Date | null
  owner_reviewer_email: string | null
  owner_reviewer_name:  string | null
  owner_reviewed_at:    Date | null
  grant_id:           string | null
  revoke_reason:      string | null
  reject_reason:      string | null
  created_at:         Date
  updated_at:         Date
  closed_at:          Date | null
}

export interface PermAuditRow {
  id:          string
  request_id:  string
  event_type:  AuditEvent
  from_status: PermStatus | null
  to_status:   PermStatus | null
  actor_email: string
  actor_name:  string | null
  actor_role:  ActorRole
  comment:     string | null
  metadata:    Record<string, unknown>
  created_at:  Date
}

export interface PermTypeConfigRow {
  id:               string
  code:             string
  label:            string
  description:      string | null
  default_duration:  string
  min_duration:     string
  max_duration:     string
  enabled:          boolean
  updated_by:       string | null
  updated_at:       Date
}

export interface SystemOwnerRow {
  id:          string
  system_code: string
  owner_email: string
  owner_name:  string | null
  updated_by:  string | null
  updated_at:  Date
}

// --- API request/response types ---
export interface CreateRequestBody {
  target_system:       string
  permission_type:     PermType
  permission_level:    PermLevel
  resource_id:         string
  reason:              string
  requested_duration: string
  urgency?:            Urgency
  related_incident_id?: string
  related_request_id?:  string
  attachment_ids?:      string[]
}

export interface ReviewBody {
  action:  'approve' | 'reject'
  comment?: string
}

export interface RevokeBody {
  reason: string
}

export interface ExtendBody {
  new_duration: string
}

export interface CommentBody {
  comment: string
}

// --- Auth context (populated by JWT middleware) ---
export interface AuthUser {
  email:  string
  name:   string
  dept:   string
  role:   'viewer' | 'editor' | 'auditor' | 'admin'
}
