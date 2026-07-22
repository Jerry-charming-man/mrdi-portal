/**
 * requestService — 业务逻辑层
 */
import { Prisma, PrismaClient } from '@prisma/client';
import type { RequestStatus, Urgency, EventType, ActorRole } from '@prisma/client';

// ============================================================
// 业务编号：NC-YYYY-NNNN
// ============================================================
export async function nextRequestNo(prisma: Prisma.TransactionClient | PrismaClient, prefix = 'NC'): Promise<string> {
  const year = new Date().getFullYear();
  // Use upsert via Prisma to atomically increment
  // The model uses year as @id (PK), so we treat each year as one counter
  const updated = await prisma.requestNoSeq.upsert({
    where: { year },
    update: { currentValue: { increment: 1 } },
    create: { year, prefix, currentValue: 1 },
  });
  const seq = updated.currentValue;
  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
}

// ============================================================
// SLA 配置批量加载（避免 N+1）
// ============================================================
export async function loadSlaConfigs(prisma: PrismaClient): Promise<Map<Urgency, {
  managerReviewHours: number;
  poolEvaluationHours: number;
  developmentHours: number;
  deployHours: number;
  acceptanceHours: number;
}>> {
  const rows = await prisma.slaConfig.findMany();
  const map = new Map<Urgency, { managerReviewHours: number; poolEvaluationHours: number; developmentHours: number; deployHours: number; acceptanceHours: number }>();
  for (const row of rows) {
    map.set(row.urgency as Urgency, {
      managerReviewHours: row.managerReviewHours,
      poolEvaluationHours: row.poolEvaluationHours,
      developmentHours: row.developmentHours,
      deployHours: row.deployHours,
      acceptanceHours: row.acceptanceHours,
    });
  }
  return map;
}

// ============================================================
// SLA 计算（可选 slaMap 避免 N+1，单条时自动查）
// ============================================================
export async function computeSlaPercent(
  prisma: PrismaClient,
  status: RequestStatus,
  statusEnteredAt: Date,
  urgency: Urgency,
  slaMap?: Map<Urgency, { managerReviewHours: number; poolEvaluationHours: number; developmentHours: number; deployHours: number; acceptanceHours: number }>,
): Promise<number> {
  let slaEntry: { managerReviewHours: number; poolEvaluationHours: number; developmentHours: number; deployHours: number; acceptanceHours: number } | undefined;

  if (slaMap) {
    slaEntry = slaMap.get(urgency);
  } else {
    const sla = await prisma.slaConfig.findUnique({ where: { urgency } });
    if (!sla) return 0;
    slaEntry = {
      managerReviewHours: sla.managerReviewHours,
      poolEvaluationHours: sla.poolEvaluationHours,
      developmentHours: sla.developmentHours,
      deployHours: sla.deployHours,
      acceptanceHours: sla.acceptanceHours,
    };
  }

  if (!slaEntry) return 0;

  const statusHourMap: Record<RequestStatus, number> = {
    submitted: 1,
    pending_manager: slaEntry.managerReviewHours,
    manager_rejected: 1,
    pool: slaEntry.poolEvaluationHours,
    scheduled: 1,
    in_development: slaEntry.developmentHours,
    pending_uat: 24,
    pending_deploy: slaEntry.deployHours,
    deployed: 1,
    pending_acceptance: slaEntry.acceptanceHours,
    closed: 0,
  };
  const allowedHours = statusHourMap[status] || 1;
  const elapsedHours = (Date.now() - statusEnteredAt.getTime()) / 1000 / 3600;
  return allowedHours > 0 ? Math.round((elapsedHours / allowedHours) * 100) : 0;
}

// ============================================================
// availableActions 计算
// ============================================================
export function computeAvailableActions(
  status: RequestStatus,
  actor: { email: string; role: string },
  request: { submitterEmail: string; assigneeEmail: string | null },
): string[] {
  const actions: string[] = [];
  const isSubmitter = actor.email === request.submitterEmail;
  const isAssignee = request.assigneeEmail === actor.email;
  const isAdmin = actor.role === 'admin';
  const isAuditor = actor.role === 'auditor' || isAdmin;
  const isEditor = actor.role === 'editor' || isAuditor;
  const isViewer = actor.role === 'viewer' || isEditor;

  switch (status) {
    case 'pending_manager':
      if (isAuditor) actions.push('approve', 'reject');
      break;
    case 'manager_rejected':
      if (isSubmitter) actions.push('resubmit');
      break;
    case 'pool':
      if (isEditor) actions.push('schedule');
      break;
    case 'scheduled':
      if (isAssignee || isAdmin) actions.push('dev_start');
      break;
    case 'in_development':
      if (isAssignee || isAdmin) actions.push('dev_complete');
      break;
    case 'pending_uat':
      if (isSubmitter) actions.push('uat_pass', 'uat_fail');
      break;
    case 'pending_deploy':
      if (isAssignee || isAdmin) actions.push('deploy');
      break;
    case 'pending_acceptance':
      if (isSubmitter) actions.push('accept', 'reject_acceptance');
      break;
  }

  // Anyone can comment + escalate (within role constraints)
  if (isViewer) actions.push('comment');
  if (isEditor) actions.push('escalate');

  return actions;
}

// ============================================================
// 状态转换矩阵
// ============================================================
const TRANSITIONS: Record<string, { to: RequestStatus; eventType: EventType; requireComment?: boolean }> = {
  approve:            { to: 'pool',                eventType: 'approval' },
  reject:             { to: 'manager_rejected',    eventType: 'rejection',  requireComment: true },
  resubmit:           { to: 'pending_manager',     eventType: 'state_change' },
  schedule:           { to: 'scheduled',           eventType: 'state_change' },
  dev_start:          { to: 'in_development',      eventType: 'state_change' },
  dev_complete:       { to: 'pending_uat',         eventType: 'state_change' },
  uat_pass:           { to: 'pending_deploy',      eventType: 'uat_result' },
  uat_fail:           { to: 'in_development',      eventType: 'uat_result',  requireComment: true },
  deploy:             { to: 'deployed',            eventType: 'deployment' },
  accept:             { to: 'closed',              eventType: 'state_change' },
  reject_acceptance:  { to: 'deployed',            eventType: 'rejection',  requireComment: true },
};

export function isTransitionAllowed(action: string, currentStatus: RequestStatus): boolean {
  const t = TRANSITIONS[action];
  if (!t) return false;
  if (action === 'escalate') return currentStatus !== 'closed';
  return t.to !== currentStatus && (action === 'resubmit' || true);
}

export function getTransition(action: string): { to: RequestStatus; eventType: EventType; requireComment?: boolean } | null {
  return TRANSITIONS[action] ?? null;
}
