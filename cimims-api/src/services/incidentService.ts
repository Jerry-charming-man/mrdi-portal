/**
 * incidentService — 业务逻辑层
 */
import { Prisma, PrismaClient } from '../../node_modules/.prisma/cimims-client/index.js';
import type { IncidentStatus, IncidentUrgency, IncidentType, IncidentImpact, EngineerType } from '../../node_modules/.prisma/cimims-client/index.js';

// ============================================================
// 业务编号 INC-YYYY-NNNN
// ============================================================
export async function nextIncidentNo(prisma: Prisma.TransactionClient | PrismaClient, prefix = 'INC'): Promise<string> {
  const year = new Date().getFullYear();
  // Use UPSERT to atomically increment
  await prisma.$executeRaw`
    INSERT INTO cimims.incident_no_seq ("year", "prefix", "current_value")
    VALUES (${year}, ${prefix}, 1)
    ON CONFLICT ("year") DO UPDATE SET current_value = cimims.incident_no_seq.current_value + 1
  `;
  const seqRows = await prisma.$queryRaw<{ current_value: number }[]>`
    SELECT current_value FROM cimims.incident_no_seq WHERE year = ${year} AND prefix = ${prefix}
  `;
  const seq = seqRows[0]?.current_value ?? 1;
  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
}

// ============================================================
// SLA 计算
// ============================================================
export async function computeSla(prisma: PrismaClient, type: string, urgency: string): Promise<{ closeMinutes: number; responseMinutes: number | null; warnAtPercent: number } | null> {
  const cfg = await prisma.slaConfig.findUnique({ where: { type_urgency: { type, urgency } } });
  if (!cfg) return null;
  return {
    closeMinutes: cfg.closeMinutes,
    responseMinutes: cfg.responseMinutes,
    warnAtPercent: cfg.warnAtPercent,
  };
}

// ============================================================
// 状态转换（用 map 简化）
// ============================================================
const VALID_TRANSITIONS: Record<string, { from: IncidentStatus[]; to: IncidentStatus; action: string }> = {
  take_over:        { from: ['pending_takeover'],     to: 'processing',      action: 'take_over' },
  transfer:         { from: ['processing', 'transferred'], to: 'transferred', action: 'transfer' },
  transfer_back:    { from: ['transferred'],          to: 'processing',      action: 'transfer_back' },
  mark_resolved:    { from: ['processing', 'transferred'], to: 'pending_confirm', action: 'mark_resolved' },
  user_confirm:     { from: ['pending_confirm'],      to: 'closed',          action: 'user_confirm' },
  user_reject:      { from: ['pending_confirm'],      to: 'processing',      action: 'user_reject' },
  force_close:      { from: ['pending_confirm'],      to: 'closed',          action: 'force_close' },
  reopen:           { from: ['closed'],               to: 'processing',      action: 'reopen' },
};

export function isValidTransition(event: string, currentStatus: IncidentStatus): boolean {
  const t = VALID_TRANSITIONS[event];
  return t ? t.from.includes(currentStatus) : false;
}

export function getTransition(event: string): { to: IncidentStatus; action: string } | null {
  const t = VALID_TRANSITIONS[event];
  return t ? { to: t.to, action: t.action } : null;
}
