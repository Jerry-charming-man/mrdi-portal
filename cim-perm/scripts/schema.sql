-- ============================================================
-- CIM-PERM V1.0 — PostgreSQL Schema (cimperm)
-- ============================================================

CREATE SCHEMA IF NOT EXISTS cimperm;

-- 1. ENUMs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'perm_status' AND n.nspname = 'cimperm') THEN
    CREATE TYPE cimperm.perm_status AS ENUM (
      'pending_it_review','pending_owner_review','pending_grant',
      'granted','expiring_soon','expired','revoked','rejected'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'perm_type' AND n.nspname = 'cimperm') THEN
    CREATE TYPE cimperm.perm_type AS ENUM (
      'system_access','functional','data_export','temporary','batch'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'perm_level' AND n.nspname = 'cimperm') THEN
    CREATE TYPE cimperm.perm_level AS ENUM ('read','write','admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'perm_urgency' AND n.nspname = 'cimperm') THEN
    CREATE TYPE cimperm.perm_urgency AS ENUM ('normal','urgent','critical');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'audit_event' AND n.nspname = 'cimperm') THEN
    CREATE TYPE cimperm.audit_event AS ENUM (
      'submit','it_review','owner_review','grant',
      'revoke','expire','extend','comment','withdraw','expire_warning'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'audit_actor_role' AND n.nspname = 'cimperm') THEN
    CREATE TYPE cimperm.audit_actor_role AS ENUM ('applicant','it','owner','system','admin');
  END IF;
END$$;

-- 2. permission_request
CREATE TABLE IF NOT EXISTS cimperm.permission_request (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_no            VARCHAR(20) UNIQUE NOT NULL,
  applicant_email       VARCHAR(255) NOT NULL,
  applicant_name        VARCHAR(100),
  applicant_dept        VARCHAR(100) NOT NULL DEFAULT 'Unknown',
  target_system         VARCHAR(50) NOT NULL,
  permission_type       cimperm.perm_type NOT NULL,
  permission_level      cimperm.perm_level NOT NULL,
  resource_id           VARCHAR(255) NOT NULL,
  reason                TEXT NOT NULL,
  attachment_ids        JSONB DEFAULT '[]'::jsonb,
  related_incident_id   VARCHAR(50),
  related_request_id    VARCHAR(50),
  requested_duration    VARCHAR(20) NOT NULL,
  expires_at            TIMESTAMPTZ NOT NULL,
  status                cimperm.perm_status NOT NULL DEFAULT 'pending_it_review',
  urgency               cimperm.perm_urgency NOT NULL DEFAULT 'normal',
  it_reviewer_email     VARCHAR(255),
  it_reviewer_name      VARCHAR(100),
  it_reviewed_at        TIMESTAMPTZ,
  owner_reviewer_email  VARCHAR(255),
  owner_reviewer_name   VARCHAR(100),
  owner_reviewed_at     TIMESTAMPTZ,
  grant_id              VARCHAR(100),
  revoke_reason         TEXT,
  reject_reason         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at             TIMESTAMPTZ
);

-- 3. permission_audit
CREATE TABLE IF NOT EXISTS cimperm.permission_audit (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   UUID NOT NULL REFERENCES cimperm.permission_request(id) ON DELETE CASCADE,
  event_type   cimperm.audit_event NOT NULL,
  from_status  cimperm.perm_status,
  to_status    cimperm.perm_status,
  actor_email  VARCHAR(255) NOT NULL,
  actor_name   VARCHAR(100),
  actor_role   cimperm.audit_actor_role NOT NULL,
  comment      TEXT,
  metadata     JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. perm_type_config
CREATE TABLE IF NOT EXISTS cimperm.perm_type_config (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              VARCHAR(50) UNIQUE NOT NULL,
  label             VARCHAR(100) NOT NULL,
  description       TEXT,
  default_duration  VARCHAR(20) NOT NULL,
  min_duration      VARCHAR(20) NOT NULL,
  max_duration      VARCHAR(20) NOT NULL,
  enabled           BOOLEAN NOT NULL DEFAULT true,
  updated_by        VARCHAR(255),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. system_owner_mapping
CREATE TABLE IF NOT EXISTS cimperm.system_owner_mapping (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_code  VARCHAR(50) UNIQUE NOT NULL,
  owner_email  VARCHAR(255) NOT NULL,
  owner_name   VARCHAR(100),
  updated_by   VARCHAR(255),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. notification_settings
CREATE TABLE IF NOT EXISTS cimperm.notification_settings (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email               VARCHAR(255) UNIQUE NOT NULL,
  in_app                   BOOLEAN NOT NULL DEFAULT true,
  email                    BOOLEAN NOT NULL DEFAULT true,
  bb06                     BOOLEAN NOT NULL DEFAULT false,
  expiring_reminder_hours  INT NOT NULL DEFAULT 24,
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_req_applicant   ON cimperm.permission_request(applicant_email);
CREATE INDEX IF NOT EXISTS idx_req_status     ON cimperm.permission_request(status);
CREATE INDEX IF NOT EXISTS idx_req_target_sys ON cimperm.permission_request(target_system);
CREATE INDEX IF NOT EXISTS idx_req_expires    ON cimperm.permission_request(expires_at)
  WHERE status IN ('granted','expiring_soon');
CREATE INDEX IF NOT EXISTS idx_req_created    ON cimperm.permission_request(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_request  ON cimperm.permission_audit(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor    ON cimperm.permission_audit(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_created  ON cimperm.permission_audit(created_at DESC);

-- updated_at trigger function in cimperm schema
CREATE OR REPLACE FUNCTION cimperm.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_req_updated_at ON cimperm.permission_request;
CREATE TRIGGER trg_req_updated_at
  BEFORE UPDATE ON cimperm.permission_request
  FOR EACH ROW EXECUTE FUNCTION cimperm.update_updated_at();

DROP TRIGGER IF EXISTS trg_config_updated_at ON cimperm.perm_type_config;
CREATE TRIGGER trg_config_updated_at
  BEFORE UPDATE ON cimperm.perm_type_config
  FOR EACH ROW EXECUTE FUNCTION cimperm.update_updated_at();

DROP TRIGGER IF EXISTS trg_owner_updated_at ON cimperm.system_owner_mapping;
CREATE TRIGGER trg_owner_updated_at
  BEFORE UPDATE ON cimperm.system_owner_mapping
  FOR EACH ROW EXECUTE FUNCTION cimperm.update_updated_at();

DROP TRIGGER IF EXISTS trg_notif_updated_at ON cimperm.notification_settings;
CREATE TRIGGER trg_notif_updated_at
  BEFORE UPDATE ON cimperm.notification_settings
  FOR EACH ROW EXECUTE FUNCTION cimperm.update_updated_at();

-- Seed: perm_type_config
INSERT INTO cimperm.perm_type_config (code, label, description, default_duration, min_duration, max_duration)
VALUES
  ('system_access', 'System Access', 'Account access (MES/SPC/ERP)', '365d', '30d', '730d'),
  ('functional',     'Functional', 'In-system module permissions (SPC drift query)', '30d',  '1d',  '90d'),
  ('data_export',    'Data Export', 'Report/data export (max 30d, high sensitivity)', '7d',   '1d',  '30d'),
  ('temporary',      'Temporary', 'Emergency one-time (auto-revoke ≤ 48h)',          '48h',  '1h',  '48h'),
  ('batch',          'Batch', 'Bulk user permission grants (admin tasks)',              '30d',  '1d',  '365d')
ON CONFLICT (code) DO NOTHING;

-- Seed: system_owner_mapping
INSERT INTO cimperm.system_owner_mapping (system_code, owner_email, owner_name)
VALUES
  ('MES',     'wang.mrdi@mrdi.local',  '王经理'),
  ('SPC',     'wang.mrdi@mrdi.local',  '王经理'),
  ('ERP',     'li.mrdi@mrdi.local',    '李总'),
  ('MDM',     'zhang.mrdi@mrdi.local', '张志豪'),
  ('CIM-IMS', 'zhang.mrdi@mrdi.local', '张志豪'),
  ('CIM-RMS', 'zhang.mrdi@mrdi.local', '张志豪')
ON CONFLICT (system_code) DO NOTHING;

-- Sequence table: atomic request_no generation (S4-5 fix)
-- Replaces COUNT(*)-based seq generation which caused duplicate key errors
-- under high concurrency (30+ concurrent inserts).
CREATE TABLE IF NOT EXISTS perm_request_seq (
  year      INTEGER PRIMARY KEY,
  last_seq  INTEGER NOT NULL DEFAULT 0
);
