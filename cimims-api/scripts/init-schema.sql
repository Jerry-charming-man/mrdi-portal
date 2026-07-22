-- ============================================================
-- CIM-IMS V1.0 — PostgreSQL Schema (cimims)
-- Run order: after postgres container init
-- ============================================================

CREATE SCHEMA IF NOT EXISTS cimims;

-- ===== Enums =====
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_status') THEN
    CREATE TYPE cimims.incident_status AS ENUM (
      'pending_takeover', 'processing', 'transferred', 'pending_confirm', 'closed'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_urgency') THEN
    CREATE TYPE cimims.incident_urgency AS ENUM ('P1', 'P2', 'P3');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_type') THEN
    CREATE TYPE cimims.incident_type AS ENUM ('system', 'network', 'account', 'equipment', 'other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_impact') THEN
    CREATE TYPE cimims.incident_impact AS ENUM ('user', 'team', 'dept', 'fab');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'engineer_type') THEN
    CREATE TYPE cimims.engineer_type AS ENUM ('network', 'dba', 'system', 'security');
  END IF;
END$$;

-- ===== incident_no_seq (业务编号计数器) =====
CREATE TABLE IF NOT EXISTS cimims.incident_no_seq (
  year          INT  PRIMARY KEY,
  prefix        VARCHAR(8) NOT NULL,
  current_value INT  NOT NULL DEFAULT 0
);

INSERT INTO cimims.incident_no_seq (year, prefix, current_value)
VALUES (EXTRACT(YEAR FROM NOW())::INT, 'INC', 0)
ON CONFLICT (year) DO NOTHING;

-- ===== incidents (主表) =====
CREATE TABLE IF NOT EXISTS cimims.incidents (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_no                 VARCHAR(32) UNIQUE NOT NULL,
  title                       VARCHAR(200) NOT NULL,
  description                 TEXT NOT NULL,
  type                        VARCHAR(20) NOT NULL,
  urgency                     VARCHAR(4) NOT NULL,
  impact_scope                VARCHAR(10) NOT NULL,
  related_system              VARCHAR(100),
  attachment_ids              UUID[] DEFAULT '{}',

  status                      VARCHAR(30) NOT NULL DEFAULT 'pending_takeover',

  submitter_email             VARCHAR(255) NOT NULL,
  submitter_dept              VARCHAR(100) NOT NULL,
  submitter_name              VARCHAR(100),
  duty_engineer_email         VARCHAR(255),
  duty_engineer_name          VARCHAR(100),
  assigned_engineer_email     VARCHAR(255),
  assigned_engineer_name      VARCHAR(100),
  assigned_engineer_type      VARCHAR(20),

  sla_response_at             TIMESTAMPTZ,
  sla_close_at                TIMESTAMPTZ NOT NULL,
  sla_response_breached       BOOLEAN NOT NULL DEFAULT FALSE,
  sla_close_breached          BOOLEAN NOT NULL DEFAULT FALSE,
  sla_warned_at               TIMESTAMPTZ,
  sla_breached_at             TIMESTAMPTZ,

  closed_at                   TIMESTAMPTZ,
  closed_by_email             VARCHAR(255),
  close_reason                TEXT,

  related_request_id          VARCHAR(32),
  resolution                  TEXT,

  reject_count                INT NOT NULL DEFAULT 0,

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_closed_consistency CHECK ((status = 'closed') = (closed_at IS NOT NULL)),
  CONSTRAINT chk_fab_to_p1 CHECK (impact_scope <> 'fab' OR urgency = 'P1')
);

CREATE INDEX IF NOT EXISTS idx_incidents_status         ON cimims.incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_type_urgency   ON cimims.incidents (type, urgency);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at     ON cimims.incidents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_sla_close_at   ON cimims.incidents (sla_close_at) WHERE status NOT IN ('closed');
CREATE INDEX IF NOT EXISTS idx_incidents_submitter      ON cimims.incidents (submitter_email);
CREATE INDEX IF NOT EXISTS idx_incidents_duty           ON cimims.incidents (duty_engineer_email) WHERE duty_engineer_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_incidents_assigned       ON cimims.incidents (assigned_engineer_email) WHERE assigned_engineer_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_incidents_no             ON cimims.incidents (incident_no);

-- ===== incident_timeline =====
CREATE TABLE IF NOT EXISTS cimims.incident_timeline (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id                 UUID NOT NULL REFERENCES cimims.incidents(id) ON DELETE CASCADE,
  entry_type                  VARCHAR(20) NOT NULL,
  action                      VARCHAR(30) NOT NULL,
  actor_email                 VARCHAR(255) NOT NULL,
  actor_name                  VARCHAR(100),
  actor_role                  VARCHAR(20) NOT NULL,
  content                     TEXT,
  is_internal                 BOOLEAN NOT NULL DEFAULT FALSE,
  transfer_to_type            VARCHAR(20),
  transfer_to_email           VARCHAR(255),
  transfer_to_name            VARCHAR(100),
  from_status                 VARCHAR(30),
  to_status                   VARCHAR(30),
  attachment_ids              UUID[],
  metadata                    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_incident        ON cimims.incident_timeline (incident_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_action          ON cimims.incident_timeline (action);
CREATE INDEX IF NOT EXISTS idx_timeline_actor           ON cimims.incident_timeline (actor_email);
CREATE INDEX IF NOT EXISTS idx_timeline_created         ON cimims.incident_timeline (created_at DESC);

-- ===== incident_escalations =====
CREATE TABLE IF NOT EXISTS cimims.incident_escalations (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id                 UUID NOT NULL REFERENCES cimims.incidents(id) ON DELETE CASCADE,
  reason                      VARCHAR(20) NOT NULL,
  from_status                 VARCHAR(30) NOT NULL,
  original_handler_email      VARCHAR(255),
  original_handler_role       VARCHAR(20),
  escalated_to_email          VARCHAR(255) NOT NULL,
  escalated_to_name           VARCHAR(100),
  escalated_to_role           VARCHAR(20) NOT NULL,
  notified_emails             VARCHAR(255)[] NOT NULL DEFAULT '{}',
  sla_snapshot                JSONB NOT NULL DEFAULT '{}'::jsonb,
  escalated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escalations_incident     ON cimims.incident_escalations (incident_id, escalated_at DESC);
CREATE INDEX IF NOT EXISTS idx_escalations_to           ON cimims.incident_escalations (escalated_to_email);

-- ===== audit_logs =====
CREATE TABLE IF NOT EXISTS cimims.audit_logs (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id                 UUID,
  event_type                  VARCHAR(30) NOT NULL,
  actor_email                 VARCHAR(255) NOT NULL,
  actor_name                  VARCHAR(100),
  actor_role                  VARCHAR(20),
  before_snapshot             JSONB,
  after_snapshot              JSONB,
  metadata                    JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address                  VARCHAR(45),
  user_agent                  TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_incident           ON cimims.audit_logs (incident_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor              ON cimims.audit_logs (actor_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_type         ON cimims.audit_logs (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created            ON cimims.audit_logs (created_at DESC);

-- ===== sla_configs =====
CREATE TABLE IF NOT EXISTS cimims.sla_configs (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                        VARCHAR(20) NOT NULL,
  urgency                     VARCHAR(4) NOT NULL,
  response_minutes            INT,
  close_minutes               INT NOT NULL,
  warn_at_percent             INT NOT NULL DEFAULT 50,
  is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by_email            VARCHAR(255),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (type, urgency)
);

INSERT INTO cimims.sla_configs (type, urgency, response_minutes, close_minutes, warn_at_percent) VALUES
  ('system',    'P1', 120, 480,  50),
  ('system',    'P2', NULL, 480, 50),
  ('system',    'P3', NULL, 1440,50),
  ('network',   'P1', 60,  240, 50),
  ('network',   'P2', NULL, 240, 50),
  ('network',   'P3', NULL, 480, 50),
  ('account',   'P1', NULL, NULL,50),
  ('account',   'P2', NULL, 240, 50),
  ('account',   'P3', NULL, 480, 50),
  ('equipment', 'P1', NULL, NULL,50),
  ('equipment', 'P2', NULL, 480, 50),
  ('equipment', 'P3', NULL, 1440,50),
  ('other',     'P1', NULL, NULL,50),
  ('other',     'P2', NULL, 480, 50),
  ('other',     'P3', NULL, 1440,50)
ON CONFLICT (type, urgency) DO NOTHING;

-- ===== escalation_rules =====
CREATE TABLE IF NOT EXISTS cimims.escalation_rules (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type                VARCHAR(20) NOT NULL,
  trigger_urgency             VARCHAR(4),
  trigger_impact              VARCHAR(10),
  escalate_to_role            VARCHAR(20) NOT NULL,
  escalate_to_email           VARCHAR(255),
  notify_channels             VARCHAR(20)[] NOT NULL DEFAULT '{inapp}',
  notify_submitter            BOOLEAN NOT NULL DEFAULT TRUE,
  cc_emails                   VARCHAR(255)[] NOT NULL DEFAULT '{}',
  template_key                VARCHAR(100) NOT NULL,
  is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
  priority                    INT NOT NULL DEFAULT 100,
  updated_by_email            VARCHAR(255),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== duty_roster =====
CREATE TABLE IF NOT EXISTS cimims.duty_roster (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duty_email                  VARCHAR(255) NOT NULL,
  duty_name                   VARCHAR(100),
  duty_role                   VARCHAR(20) NOT NULL DEFAULT 'duty',
  shift                       VARCHAR(10) NOT NULL,
  shift_start                 VARCHAR(8) NOT NULL,
  shift_end                   VARCHAR(8) NOT NULL,
  effective_date              DATE NOT NULL,
  effective_until             DATE,
  backup_email                VARCHAR(255),
  backup_name                 VARCHAR(100),
  is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
  note                        TEXT,
  created_by_email            VARCHAR(255),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_duty_roster_email         ON cimims.duty_roster (duty_email);

-- ===== engineer_members =====
CREATE TABLE IF NOT EXISTS cimims.engineer_members (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engineer_email              VARCHAR(255) UNIQUE NOT NULL,
  engineer_name               VARCHAR(100),
  engineer_type               VARCHAR(20) NOT NULL,
  team                        VARCHAR(100) NOT NULL,
  phone                       VARCHAR(20),
  slack_id                    VARCHAR(50),
  is_available                BOOLEAN NOT NULL DEFAULT TRUE,
  current_load                INT NOT NULL DEFAULT 0,
  skill_level                 VARCHAR(20) DEFAULT 'L2',
  specializations             TEXT[],
  joined_at                   DATE NOT NULL DEFAULT CURRENT_DATE,
  left_at                     DATE,
  is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed engineers (12 entries)
INSERT INTO cimims.engineer_members (engineer_email, engineer_name, engineer_type, team) VALUES
  ('net.li@mrdi.local',   '李工-网络', 'network',  'IT 基础设施组'),
  ('net.wang@mrdi.local', '王工-网络', 'network',  'IT 基础设施组'),
  ('net.zhang@mrdi.local','张工-网络', 'network',  'IT 基础设施组'),
  ('dba.chen@mrdi.local', '陈工-DBA',  'dba',      'IT 数据组'),
  ('dba.liu@mrdi.local',  '刘工-DBA',  'dba',      'IT 数据组'),
  ('dba.yang@mrdi.local', '杨工-DBA',  'dba',      'IT 数据组'),
  ('sys.zhao@mrdi.local', '赵工-系统', 'system',   'IT 应用组'),
  ('sys.sun@mrdi.local',  '孙工-系统', 'system',   'IT 应用组'),
  ('sys.zhou@mrdi.local', '周工-系统', 'system',   'IT 应用组'),
  ('sec.wu@mrdi.local',   '吴工-安全', 'security', 'IT 安全组'),
  ('sec.xu@mrdi.local',   '徐工-安全', 'security', 'IT 安全组'),
  ('sec.hu@mrdi.local',   '胡工-安全', 'security', 'IT 安全组')
ON CONFLICT (engineer_email) DO NOTHING;

-- Seed duty roster (this week)
INSERT INTO cimims.duty_roster (duty_email, duty_name, shift, shift_start, shift_end, effective_date, effective_until) VALUES
  ('duty.morning@mrdi.local',   '早班-张三', 'early', '08:00', '16:00', CURRENT_DATE, CURRENT_DATE + 6),
  ('duty.afternoon@mrdi.local', '中班-李四', 'mid',   '16:00', '00:00', CURRENT_DATE, CURRENT_DATE + 6),
  ('duty.night@mrdi.local',     '夜班-王五', 'night', '00:00', '08:00', CURRENT_DATE, CURRENT_DATE + 6)
ON CONFLICT DO NOTHING;

-- ===== updated_at triggers =====
CREATE OR REPLACE FUNCTION cimims.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_incidents_updated_at ON cimims.incidents;
CREATE TRIGGER trg_incidents_updated_at
  BEFORE UPDATE ON cimims.incidents
  FOR EACH ROW EXECUTE FUNCTION cimims.set_updated_at();

DROP TRIGGER IF EXISTS trg_sla_configs_updated_at ON cimims.sla_configs;
CREATE TRIGGER trg_sla_configs_updated_at
  BEFORE UPDATE ON cimims.sla_configs
  FOR EACH ROW EXECUTE FUNCTION cimims.set_updated_at();

DROP TRIGGER IF EXISTS trg_duty_roster_updated_at ON cimims.duty_roster;
CREATE TRIGGER trg_duty_roster_updated_at
  BEFORE UPDATE ON cimims.duty_roster
  FOR EACH ROW EXECUTE FUNCTION cimims.set_updated_at();

DROP TRIGGER IF EXISTS trg_engineer_members_updated_at ON cimims.engineer_members;
CREATE TRIGGER trg_engineer_members_updated_at
  BEFORE UPDATE ON cimims.engineer_members
  FOR EACH ROW EXECUTE FUNCTION cimims.set_updated_at();
