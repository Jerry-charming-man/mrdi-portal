-- Seed 8 permission requests covering all 8 statuses
-- applicant: zhang@mrdi.example (张志豪)
-- it_reviewer: wang.it@mrdi.example (王工 IT)
-- owner_reviewer: wang.mrdi@mrdi.example (王经理)

-- 1. pending_it_review (等待IT审核)
INSERT INTO permission_request (id, request_no, applicant_email, applicant_name, applicant_dept,
  target_system, permission_type, permission_level, resource_id, reason,
  requested_duration, expires_at, status, urgency, created_at)
VALUES (
  '8193b9ce-af7b-49ee-b552-9ee57c8edd68', 'PRM-2026-0001',
  'zhang@mrdi.example', '张志豪', 'IT部',
  'MDM', 'system_access', 'write', 'usr-2026-001',
  '需要访问主数据管理系统进行数据维护操作，包含客户主数据、供应商主数据的增删改权限',
  '30d', NOW() + INTERVAL '30 days', 'pending_it_review', 'normal', NOW() - INTERVAL '2 hours'
) ON CONFLICT (id) DO NOTHING;

-- 2. pending_owner_review (IT已审，等待Owner审核)
INSERT INTO permission_request (id, request_no, applicant_email, applicant_name, applicant_dept,
  target_system, permission_type, permission_level, resource_id, reason,
  requested_duration, expires_at, status, urgency,
  it_reviewer_email, it_reviewer_name, it_reviewed_at, created_at)
VALUES (
  '2a0147f7-8514-4791-bae8-742f46a46f2e', 'PRM-2026-0002',
  'zhang@mrdi.example', '张志豪', 'IT部',
  'MES', 'functional', 'write', 'func-spc-query',
  '需要SPC系统漂移告警查询功能，用于产线质量异常时的快速定位',
  '90d', NOW() + INTERVAL '90 days', 'pending_owner_review', 'urgent',
  'wang.it@mrdi.example', '王工', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

-- 3. pending_grant (Owner已审，等待MDM授权)
INSERT INTO permission_request (id, request_no, applicant_email, applicant_name, applicant_dept,
  target_system, permission_type, permission_level, resource_id, reason,
  requested_duration, expires_at, status,
  it_reviewer_email, it_reviewer_name, it_reviewed_at,
  owner_reviewer_email, owner_reviewer_name, owner_reviewed_at, created_at)
VALUES (
  '89321da5-0c27-4325-bdb2-af04f3eccf3d', 'PRM-2026-0003',
  'zhang@mrdi.example', '张志豪', 'IT部',
  'ERP', 'data_export', 'read', 'rpt-monthly-sales',
  '导出月度销售报表用于经营分析，ERP系统集成数据需求',
  '7d', NOW() + INTERVAL '7 days', 'pending_grant',
  'wang.it@mrdi.example', '王工', NOW() - INTERVAL '2 days',
  'li.mrdi@mrdi.example', '李总', NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 days'
) ON CONFLICT (id) DO NOTHING;

-- 4. granted (已授权，正常生效中)
INSERT INTO permission_request (id, request_no, applicant_email, applicant_name, applicant_dept,
  target_system, permission_type, permission_level, resource_id, reason,
  requested_duration, expires_at, status, grant_id,
  it_reviewer_email, it_reviewer_name, it_reviewed_at,
  owner_reviewer_email, owner_reviewer_name, owner_reviewed_at, created_at)
VALUES (
  '5db4fdec-213a-47f4-9c08-7bb82e563077', 'PRM-2026-0004',
  'zhang@mrdi.example', '张志豪', 'IT部',
  'SPC', 'system_access', 'read', 'usr-spc-zhang',
  'SPC系统标准用户权限，用于日常生产数据监控和报表查看',
  '365d', NOW() + INTERVAL '60 days', 'granted', 'GRT-SPC-2026-0042',
  'wang.it@mrdi.example', '王工', NOW() - INTERVAL '35 days',
  'wang.mrdi@mrdi.example', '王经理', NOW() - INTERVAL '34 days', NOW() - INTERVAL '35 days'
) ON CONFLICT (id) DO NOTHING;

-- 5. expiring_soon (即将到期，24小时内)
INSERT INTO permission_request (id, request_no, applicant_email, applicant_name, applicant_dept,
  target_system, permission_type, permission_level, resource_id, reason,
  requested_duration, expires_at, status, grant_id,
  it_reviewer_email, it_reviewer_name, it_reviewed_at,
  owner_reviewer_email, owner_reviewer_name, owner_reviewed_at, created_at)
VALUES (
  '1be1e52c-c2b9-4f37-b2a6-af92a0df83df', 'PRM-2026-0005',
  'zhang@mrdi.example', '张志豪', 'IT部',
  'MES', 'data_export', 'read', 'exp-mes-qa-001',
  'QA数据导出用于外审材料准备，紧急需求',
  '7d', NOW() + INTERVAL '6 hours', 'expiring_soon', 'GRT-MES-2026-0019',
  'wang.it@mrdi.example', '王工', NOW() - INTERVAL '8 days',
  'wang.mrdi@mrdi.example', '王经理', NOW() - INTERVAL '7 days', NOW() - INTERVAL '8 days'
) ON CONFLICT (id) DO NOTHING;

-- 6. expired (已过期)
INSERT INTO permission_request (id, request_no, applicant_email, applicant_name, applicant_dept,
  target_system, permission_type, permission_level, resource_id, reason,
  requested_duration, expires_at, status, grant_id, closed_at,
  it_reviewer_email, it_reviewer_name, it_reviewed_at,
  owner_reviewer_email, owner_reviewer_name, owner_reviewed_at, created_at)
VALUES (
  '29f30952-5ede-4bd8-a225-7dbc302a168d', 'PRM-2026-0006',
  'zhang@mrdi.example', '张志豪', 'IT部',
  'CIM-IMS', 'functional', 'write', 'func-workorder-create',
  '工单创建功能用于测试环境配置验证',
  '30d', NOW() - INTERVAL '25 days', 'expired', 'GRT-IMS-2026-0011', NOW() - INTERVAL '25 days',
  'wang.it@mrdi.example', '王工', NOW() - INTERVAL '55 days',
  'wang.mrdi@mrdi.example', '王经理', NOW() - INTERVAL '54 days', NOW() - INTERVAL '55 days'
) ON CONFLICT (id) DO NOTHING;

-- 7. revoked (已被撤销)
INSERT INTO permission_request (id, request_no, applicant_email, applicant_name, applicant_dept,
  target_system, permission_type, permission_level, resource_id, reason,
  requested_duration, expires_at, status, grant_id, revoke_reason,
  it_reviewer_email, it_reviewer_name, it_reviewed_at,
  owner_reviewer_email, owner_reviewer_name, owner_reviewed_at, created_at)
VALUES (
  '1681cb85-cb5c-4b31-a807-8fde6aee0014', 'PRM-2026-0007',
  'zhang@mrdi.example', '张志豪', 'IT部',
  'ERP', 'functional', 'write', 'func-order-modify',
  'ERP订单修改权限用于紧急插单处理',
  '30d', NOW() - INTERVAL '10 days', 'revoked', 'GRT-ERP-2026-0007', '项目结束，权限回收',
  'wang.it@mrdi.example', '王工', NOW() - INTERVAL '40 days',
  'li.mrdi@mrdi.example', '李总', NOW() - INTERVAL '39 days', NOW() - INTERVAL '40 days'
) ON CONFLICT (id) DO NOTHING;

-- 8. rejected (IT审核已拒绝)
INSERT INTO permission_request (id, request_no, applicant_email, applicant_name, applicant_dept,
  target_system, permission_type, permission_level, resource_id, reason,
  requested_duration, expires_at, status, reject_reason,
  it_reviewer_email, it_reviewer_name, it_reviewed_at, created_at)
VALUES (
  'c5b144aa-c0b9-467f-8c74-a97501e1c290', 'PRM-2026-0008',
  'zhang@mrdi.example', '张志豪', 'IT部',
  'MDM', 'data_export', 'write', 'exp-customer-full',
  '客户主数据全量导出用于第三方系统对接测试',
  '30d', NOW() + INTERVAL '30 days', 'rejected', '数据导出权限申请超出业务需求范围，请提供具体的报表需求说明后再提交',
  'wang.it@mrdi.example', '王工', NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days'
) ON CONFLICT (id) DO NOTHING;

-- Audit trail for granted/closed records
INSERT INTO permission_audit (request_id, event_type, to_status, actor_email, actor_name, actor_role, created_at)
SELECT id, 'grant', 'granted', owner_reviewer_email, owner_reviewer_name, 'owner', owner_reviewed_at
FROM permission_request WHERE status = 'granted'
ON CONFLICT DO NOTHING;

INSERT INTO permission_audit (request_id, event_type, to_status, actor_email, actor_name, actor_role, created_at)
SELECT id, 'grant', 'granted', owner_reviewer_email, owner_reviewer_name, 'owner', owner_reviewed_at
FROM permission_request WHERE status = 'expiring_soon'
ON CONFLICT DO NOTHING;
