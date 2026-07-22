-- Seed SLA configs for CIM-IMS
INSERT INTO cimims.sla_configs (id, type, urgency, response_minutes, close_minutes, warn_at_percent, is_active)
VALUES
  (gen_random_uuid(), 'system', 'P1', 15, 60, 50, true),
  (gen_random_uuid(), 'system', 'P2', 60, 480, 50, true),
  (gen_random_uuid(), 'system', 'P3', 240, 1440, 50, true),
  (gen_random_uuid(), 'network', 'P1', 15, 60, 50, true),
  (gen_random_uuid(), 'network', 'P2', 60, 480, 50, true),
  (gen_random_uuid(), 'network', 'P3', 240, 1440, 50, true),
  (gen_random_uuid(), 'account', 'P1', 30, 120, 50, true),
  (gen_random_uuid(), 'account', 'P2', 120, 480, 50, true),
  (gen_random_uuid(), 'account', 'P3', 480, 2880, 50, true),
  (gen_random_uuid(), 'equipment', 'P1', 30, 180, 50, true),
  (gen_random_uuid(), 'equipment', 'P2', 120, 720, 50, true),
  (gen_random_uuid(), 'equipment', 'P3', 480, 4320, 50, true),
  (gen_random_uuid(), 'other', 'P1', 60, 240, 50, true),
  (gen_random_uuid(), 'other', 'P2', 240, 960, 50, true),
  (gen_random_uuid(), 'other', 'P3', 960, 4320, 50, true)
ON CONFLICT (type, urgency) DO UPDATE SET
  response_minutes = EXCLUDED.response_minutes,
  close_minutes = EXCLUDED.close_minutes;
