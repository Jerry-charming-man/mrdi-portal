-- ============================================================
-- CIM-PERM V1.0 — PostgreSQL Schema
-- Run: docker exec cim-perm-db psql -U postgres -d cim_perm -f /schema.sql
-- ============================================================

-- 1. ENUMs (guard via pg_type check to be idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'perm_status') THEN
    CREATE TYPE perm_status AS ENUM (
      'pending_it_review','pending_owner_review','pending_grant',
      'granted','expiring_soon','expired','revoked','rejected'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'perm_type') THEN
    CREATE TYPE perm_type AS ENUM (
      'system_access','functional','data_export','temporary','batch'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'perm_level') THEN
    CREATE TYPE perm_level AS ENUM ('read','write','admin');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'perm_urgency') THEN
    CREATE TYPE perm_urgency AS ENUM ('normal','urgent','critical');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_event') THEN
    CREATE TYPE audit_event AS ENUM (
      'submit','it_review','owner_review','grant',
      'revoke','expire','extend','comment','withdraw','expire_warning'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_actor_role') THEN
    CREATE TYPE audit_actor_role AS ENUM ('applicant','it','owner','system','admin');
  END IF;
END$$;

-- 2. permission_request
CREATE TABLE IF NOT EXISTS permission_request (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_no      VARCHAR(20) UNIQUE NOT NULL,
  applicant_email VARCHAR(255) NOT NULL,
  applicant_name  VARCHAR(100),
  applicant_dept  VARCHAR(100) NOT NULL DEFAULT '未知部门',

  target_system    VARCHAR(50) NOT NULL,
  permission_type  perm_type NOT NULL,
  permission_level perm_level NOT NULL,
  resource_id      VARCHAR(255) NOT NULL,
  reason           TEXT NOT NULL,

  attachment_ids     JSONB DEFAULT '[]'::jsonb,
  related_incident_id VARCHAR(50),
  related_request_id  VARCHAR(50),

  requested_duration VARCHAR(20) NOT NULL,
  expires_at         TIMESTAMPTZ NOT NULL,

  status   perm_status NOT NULL DEFAULT 'pending_it_review',
  urgency  perm_urgency NOT NULL DEFAULT 'normal',

  it_reviewer_email VARCHAR(255),
  it_reviewer_name   VARCHAR(100),
  it_reviewed_at     TIMESTAMPTZ,

  owner_reviewer_email VARCHAR(255),
  owner_reviewer_name   VARCHAR(100),
  owner_reviewed_at     TIMESTAMPTZ,

  grant_id     VARCHAR(100),
  revoke_reason TEXT,
  reject_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at  TIMESTAMPTZ
);

-- 3. permission_audit
CREATE TABLE IF NOT EXISTS permission_audit (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES permission_request(id) ON DELETE CASCADE,
  event_type audit_event NOT NULL,
  from_status perm_status,
  to_status   perm_status,
  actor_email VARCHAR(255) NOT NULL,
  actor_name  VARCHAR(100),
  actor_role  audit_actor_role NOT NULL,
  comment     TEXT,
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. perm_type_config
CREATE TABLE IF NOT EXISTS perm_type_config (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             VARCHAR(50) UNIQUE NOT NULL,
  label            VARCHAR(100) NOT NULL,
  description      TEXT,
  default_duration VARCHAR(20) NOT NULL,
  min_duration     VARCHAR(20) NOT NULL,
  max_duration     VARCHAR(20) NOT NULL,
  enabled          BOOLEAN NOT NULL DEFAULT true,
  updated_by       VARCHAR(255),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. system_owner_mapping
CREATE TABLE IF NOT EXISTS system_owner_mapping (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_code VARCHAR(50) UNIQUE NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  owner_name  VARCHAR(100),
  updated_by  VARCHAR(255),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. notification_settings
CREATE TABLE IF NOT EXISTS notification_settings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email              VARCHAR(255) UNIQUE NOT NULL,
  in_app                  BOOLEAN NOT NULL DEFAULT true,
  email                   BOOLEAN NOT NULL DEFAULT true,
  bb06                    BOOLEAN NOT NULL DEFAULT false,
  expiring_reminder_hours INT     NOT NULL DEFAULT 24,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_req_applicant   ON permission_request(applicant_email);
CREATE INDEX IF NOT EXISTS idx_req_status     ON permission_request(status);
CREATE INDEX IF NOT EXISTS idx_req_target_sys ON permission_request(target_system);
CREATE INDEX IF NOT EXISTS idx_req_expires    ON permission_request(expires_at)
  WHERE status IN ('granted','expiring_soon');
CREATE INDEX IF NOT EXISTS idx_req_created    ON permission_request(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_request  ON permission_audit(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor    ON permission_audit(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_created  ON permission_audit(created_at DESC);

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_req_updated_at ON permission_request;
CREATE TRIGGER trg_req_updated_at
  BEFORE UPDATE ON permission_request
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_config_updated_at ON perm_type_config;
CREATE TRIGGER trg_config_updated_at
  BEFORE UPDATE ON perm_type_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_owner_updated_at ON system_owner_mapping;
CREATE TRIGGER trg_owner_updated_at
  BEFORE UPDATE ON system_owner_mapping
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_notif_updated_at ON notification_settings;
CREATE TRIGGER trg_notif_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED: perm_type_config (5 rows)
-- ============================================================
INSERT INTO perm_type_config (code, label, description, default_duration, min_duration, max_duration)
VALUES
  ('system_access', '系统访问', '开通某系统的账号（如 MES、SPC、ERP 系统的登录权限）', '365d', '30d', '730d'),
  ('functional',     '功能权限', '系统内特定功能模块的读写权限（如 SPC 漂移查询）', '30d',  '1d',  '90d'),
  ('data_export',    '数据导出', '特定报表/数据的导出权限（高敏感，最长 30 天）', '7d',   '1d',  '30d'),
  ('temporary',      '临时权限', '紧急一次性需求，严格 ≤ 48h 自动回收',              '48h',  '1h',  '48h'),
  ('batch',         '批量权限', '批量开通同组用户权限（行政类）',                      '30d',  '1d',  '365d')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- SEED: system_owner_mapping
-- ============================================================
INSERT INTO system_owner_mapping (system_code, owner_email, owner_name)
VALUES
  ('MES',    'wang.mrdi@mrdi.example',  '王经理'),
  ('SPC',    'wang.mrdi@mrdi.example',  '王经理'),
  ('ERP',    'li.mrdi@mrdi.example',    '李总'),
  ('MDM',    'zhang.mrdi@mrdi.example', '张志豪'),
  ('CIM-IMS','zhang.mrdi@mrdi.example', '张志豪'),
  ('CIM-RMS','zhang.mrdi@mrdi.example', '张志豪')
ON CONFLICT (system_code) DO NOTHING;
