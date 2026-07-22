-- ============================================================
-- CIM-RMS V1.0 — PostgreSQL Schema (cimrms)
-- Run order: after postgres container init
-- ============================================================

CREATE SCHEMA IF NOT EXISTS cimrms;

-- ===== request_no_seq (业务编号计数器) =====
CREATE TABLE IF NOT EXISTS cimrms.request_no_seq (
  year          INT  PRIMARY KEY,
  prefix        VARCHAR(8) NOT NULL,
  current_value INT  NOT NULL DEFAULT 0
);

INSERT INTO cimrms.request_no_seq (year, prefix, current_value)
VALUES (EXTRACT(YEAR FROM NOW())::INT, 'NC', 0)
ON CONFLICT (year) DO NOTHING;

-- ===== sla_config (SLA 配置) =====
CREATE TABLE IF NOT EXISTS cimrms.sla_config (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  urgency                  VARCHAR(4) UNIQUE NOT NULL,
  manager_review_hours     INT NOT NULL,
  pool_evaluation_hours    INT NOT NULL,
  development_hours        INT NOT NULL,
  deploy_hours             INT NOT NULL,
  acceptance_hours         INT NOT NULL,
  total_hours              INT NOT NULL,
  updated_by               VARCHAR(255) NOT NULL,
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO cimrms.sla_config (urgency, manager_review_hours, pool_evaluation_hours,
  development_hours, deploy_hours, acceptance_hours, total_hours, updated_by)
VALUES
  ('P1', 4,  2,  48,  24,  8,   72,  'system@init'),
  ('P2', 24, 24, 120, 72,  24,  240, 'system@init'),
  ('P3', 72, 72, 336, 168, 72,  720, 'system@init')
ON CONFLICT (urgency) DO NOTHING;

-- ===== request (需求主表) =====
CREATE TABLE IF NOT EXISTS cimrms.request (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_no             VARCHAR(32) UNIQUE NOT NULL,
  title                  VARCHAR(200) NOT NULL,
  type                   VARCHAR(50) NOT NULL,
  urgency                VARCHAR(4) NOT NULL,
  related_system         VARCHAR(50),
  description            TEXT NOT NULL,
  attachment_ids         UUID[] DEFAULT '{}',
  related_incident_id    VARCHAR(32),
  expected_completion    DATE,
  status                 VARCHAR(50) NOT NULL DEFAULT 'submitted',
  submitter_email        VARCHAR(255) NOT NULL,
  submitter_dept         VARCHAR(100),
  assignee_email         VARCHAR(255),
  team                   VARCHAR(50),
  estimated_deploy_at    DATE,
  status_entered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sla_breach_at          TIMESTAMPTZ,
  closed_at              TIMESTAMPTZ,
  deleted_at             TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_status        ON cimrms.request (status);
CREATE INDEX IF NOT EXISTS idx_request_urgency       ON cimrms.request (urgency);
CREATE INDEX IF NOT EXISTS idx_request_submitter     ON cimrms.request (submitter_email);
CREATE INDEX IF NOT EXISTS idx_request_assignee      ON cimrms.request (assignee_email);
CREATE INDEX IF NOT EXISTS idx_request_team          ON cimrms.request (team);
CREATE INDEX IF NOT EXISTS idx_request_created_at    ON cimrms.request (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_status_entered ON cimrms.request (status, status_entered_at);
CREATE INDEX IF NOT EXISTS idx_request_type_urgency  ON cimrms.request (type, urgency, status);

-- ===== request_event (流转历史) =====
CREATE TABLE IF NOT EXISTS cimrms.request_event (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID NOT NULL REFERENCES cimrms.request(id) ON DELETE CASCADE,
  event_type      VARCHAR(30) NOT NULL,
  from_status     VARCHAR(50),
  to_status       VARCHAR(50),
  actor_email     VARCHAR(255) NOT NULL,
  actor_role      VARCHAR(20) NOT NULL,
  comment         TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_request   ON cimrms.request_event (request_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_type      ON cimrms.request_event (event_type);
CREATE INDEX IF NOT EXISTS idx_event_actor     ON cimrms.request_event (actor_email);
CREATE INDEX IF NOT EXISTS idx_event_created   ON cimrms.request_event (created_at DESC);

-- ===== request_attachment =====
CREATE TABLE IF NOT EXISTS cimrms.request_attachment (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID NOT NULL REFERENCES cimrms.request(id) ON DELETE CASCADE,
  filename        VARCHAR(255) NOT NULL,
  mime_type       VARCHAR(100) NOT NULL,
  size_bytes      INT NOT NULL,
  storage_path    VARCHAR(500) NOT NULL,
  uploaded_by     VARCHAR(255) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachment_request ON cimrms.request_attachment (request_id);

-- ===== request_escalation =====
CREATE TABLE IF NOT EXISTS cimrms.request_escalation (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id                UUID NOT NULL REFERENCES cimrms.request(id) ON DELETE CASCADE,
  from_status               VARCHAR(50) NOT NULL,
  reason                    VARCHAR(20) NOT NULL,
  escalated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  escalated_to_email        VARCHAR(255) NOT NULL,
  original_assignee_email   VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_escalation_request ON cimrms.request_escalation (request_id);
CREATE INDEX IF NOT EXISTS idx_escalation_to      ON cimrms.request_escalation (escalated_to_email);
CREATE INDEX IF NOT EXISTS idx_escalation_at      ON cimrms.request_escalation (escalated_at DESC);

-- ===== todo_item =====
CREATE TABLE IF NOT EXISTS cimrms.todo_item (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_email           VARCHAR(255) NOT NULL,
  title                 VARCHAR(200) NOT NULL,
  description           TEXT,
  label                 VARCHAR(10) NOT NULL,
  status                VARCHAR(20) NOT NULL DEFAULT 'open',
  related_request_id    UUID REFERENCES cimrms.request(id) ON DELETE SET NULL,
  due_at                TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_todo_owner_status  ON cimrms.todo_item (owner_email, status);
CREATE INDEX IF NOT EXISTS idx_todo_owner_label   ON cimrms.todo_item (owner_email, label, status);
CREATE INDEX IF NOT EXISTS idx_todo_status_due    ON cimrms.todo_item (status, due_at);

-- ===== notification_outbox =====
CREATE TABLE IF NOT EXISTS cimrms.notification_outbox (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email       VARCHAR(255) NOT NULL,
  channel               VARCHAR(20) NOT NULL,
  subject               VARCHAR(200) NOT NULL,
  body                  TEXT NOT NULL,
  status                VARCHAR(20) NOT NULL DEFAULT 'pending',
  attempts              INT NOT NULL DEFAULT 0,
  last_error            TEXT,
  sent_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  related_request_id    UUID
);

CREATE INDEX IF NOT EXISTS idx_outbox_status      ON cimrms.notification_outbox (status, created_at);
CREATE INDEX IF NOT EXISTS idx_outbox_recipient   ON cimrms.notification_outbox (recipient_email);
CREATE INDEX IF NOT EXISTS idx_outbox_request     ON cimrms.notification_outbox (related_request_id);

-- ===== notification_rule =====
CREATE TABLE IF NOT EXISTS cimrms.notification_rule (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email      VARCHAR(255) NOT NULL,
  event_type      VARCHAR(50) NOT NULL,
  in_app_enabled  BOOLEAN NOT NULL DEFAULT true,
  email_enabled   BOOLEAN NOT NULL DEFAULT false,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_email, event_type)
);

CREATE INDEX IF NOT EXISTS idx_rule_user ON cimrms.notification_rule (user_email);

-- ===== audit_log =====
CREATE TABLE IF NOT EXISTS cimrms.audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_email     VARCHAR(255) NOT NULL,
  actor_role      VARCHAR(20) NOT NULL,
  action          VARCHAR(100) NOT NULL,
  resource_type   VARCHAR(50) NOT NULL,
  resource_id     VARCHAR(100),
  request_id      UUID,
  ip_address      VARCHAR(45),
  user_agent      VARCHAR(500),
  payload         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor     ON cimrms.audit_log (actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_action    ON cimrms.audit_log (action);
CREATE INDEX IF NOT EXISTS idx_audit_resource  ON cimrms.audit_log (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_request   ON cimrms.audit_log (request_id);
CREATE INDEX IF NOT EXISTS idx_audit_created   ON cimrms.audit_log (created_at DESC);

-- ===== updated_at triggers =====
CREATE OR REPLACE FUNCTION cimrms.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_request_updated_at ON cimrms.request;
CREATE TRIGGER trg_request_updated_at
  BEFORE UPDATE ON cimrms.request
  FOR EACH ROW EXECUTE FUNCTION cimrms.set_updated_at();

DROP TRIGGER IF EXISTS trg_rule_updated_at ON cimrms.notification_rule;
CREATE TRIGGER trg_rule_updated_at
  BEFORE UPDATE ON cimrms.notification_rule
  FOR EACH ROW EXECUTE FUNCTION cimrms.set_updated_at();

DROP TRIGGER IF EXISTS trg_sla_updated_at ON cimrms.sla_config;
CREATE TRIGGER trg_sla_updated_at
  BEFORE UPDATE ON cimrms.sla_config
  FOR EACH ROW EXECUTE FUNCTION cimrms.set_updated_at();
