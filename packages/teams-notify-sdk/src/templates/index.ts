/**
 * Adaptive Card Templates — CIM-RMS 通知卡片库
 *
 * 所有卡片统一风格：
 * - 主色 #00B388（MRDI 凝绿）
 * - 圆角 8px / 柔和阴影
 * - 清晰的状态色彩编码
 */

import type { AdaptiveCard } from '../client.js';

// ─── 配色 ────────────────────────────────────────────────────────────────

const COLORS = {
  primary:    '#00B388',  // 凝绿（主色）
  danger:     '#E53935',  // 危险红
  warning:    '#FB8C00',  // 警告橙
  success:    '#43A047',  // 成功绿
  info:       '#1E88E5',  // 信息蓝
  textDark:   '#212121',  // 主要文字
  textMuted:  '#757575',  // 次要文字
  bgGray:     '#F5F5F5',  // 浅灰背景
  border:     '#D9D9D6',  // 边框
};

// ─── 状态颜色映射 ────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  pending_manager:    '#FB8C00',
  pool:               '#1E88E5',
  scheduled:          '#8E24AA',
  in_development:     '#1565C0',
  pending_deploy:     '#0D47A1',
  pending_uat:        '#E65100',
  pending_acceptance: '#2E7D32',
  deployed:           '#00B388',
  closed:             '#424242',
  manager_rejected:   '#C62828',
};

// ─── 状态标签 ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending_manager:    '待经理审批',
  pool:               '需求池',
  scheduled:          '已排期',
  in_development:     '开发中',
  pending_deploy:     '待部署',
  pending_uat:        '待UAT',
  pending_acceptance: '待验收',
  deployed:           '已部署',
  closed:             '已关闭',
  manager_rejected:   '已驳回',
};

// ─── 工具函数 ────────────────────────────────────────────────────────────

function statusBadge(status: string): object {
  const color = STATUS_COLOR[status] ?? '#757575';
  const label = STATUS_LABELS[status] ?? status;
  return {
    type: 'TextBlock',
    text: `**${label}**`,
    color: 'Accent',
    size: 'Small',
    weight: 'Bolder',
  };
}

function factRow(title: string, value: string): object {
  return {
    type: 'FactSet',
    facts: [
      { title, value },
    ],
  };
}

function section(title: string, value: string): object {
  return {
    type: 'FactSet',
    facts: [{ title, value }],
  };
}

// ─── 通用 Action.Submit 按钮 ────────────────────────────────────────────

function approveAction(eventId: string, callbackUrl: string, commentRequired = false): object {
  return {
    type: 'Action.Submit',
    title: '✅ 通过',
    style: 'positive',
    data: {
      action: 'approve',
      eventId,
      callback: {
        method: 'POST',
        url: callbackUrl,
        headers: { 'X-Idempotency-Key': eventId },
      },
      ...(commentRequired ? { requireInput: 'comment' } : {}),
    },
  };
}

function rejectAction(eventId: string, callbackUrl: string): object {
  return {
    type: 'Action.Submit',
    title: '❌ 驳回',
    style: 'destructive',
    data: {
      action: 'reject',
      eventId,
      callback: {
        method: 'POST',
        url: callbackUrl,
        requireInput: 'reason',
      },
    },
  };
}

function actionGroup(actions: object[]): object {
  return {
    type: 'ActionSet',
    actions,
  };
}

// ─── 模板 1：经理审批 ────────────────────────────────────────────────────

export interface ApprovalTemplateParams {
  requestNo: string;
  title: string;
  urgency: 'P1' | 'P2' | 'P3';
  type: string;
  submitterEmail: string;
  submitterName?: string;
  description: string;
  currentStatus: string;
  callbackUrl: string;
  eventId: string;
  /** 卡片过期时间 */
  expiresAt?: string;
  priority?: 'high' | 'normal' | 'low';
}

export function approvalCard(params: ApprovalTemplateParams): AdaptiveCard {
  const {
    requestNo, title, urgency, type, submitterEmail, submitterName,
    description, currentStatus, callbackUrl, eventId,
    expiresAt, priority = 'normal',
  } = params;

  const urgencyColor = urgency === 'P1' ? COLORS.danger : urgency === 'P2' ? COLORS.warning : COLORS.textMuted;
  const urgencyLabel = urgency === 'P1' ? '🔴 P1' : urgency === 'P2' ? '🟡 P2' : '⚪ P3';

  return {
    type: 'AdaptiveCard',
    version: '1.5',
    body: [
      // Header
      {
        type: 'Container',
        style: 'emphasis',
        items: [
          {
            type: 'ColumnSet',
            columns: [
              {
                type: 'Column',
                width: 'stretch',
                items: [
                  {
                    type: 'TextBlock',
                    text: '📋 需求审批',
                    weight: 'Bolder',
                    size: 'Medium',
                    color: 'Light',
                  },
                  {
                    type: 'TextBlock',
                    text: requestNo,
                    size: 'Small',
                    color: 'Light',
                    isSubtle: true,
                  },
                ],
              },
              {
                type: 'Column',
                width: 'auto',
                items: [
                  {
                    type: 'TextBlock',
                    text: urgencyLabel,
                    weight: 'Bolder',
                    color: 'Light',
                  },
                ],
              },
            ],
          },
        ],
      },
      // Body
      {
        type: 'Container',
        spacing: 'Medium',
        items: [
          // 标题
          {
            type: 'TextBlock',
            text: title,
            weight: 'Bolder',
            size: 'Medium',
            wrap: true,
          },
          // 信息行
          {
            type: 'FactSet',
            facts: [
              { title: '类型', value: type },
              { title: '提交人', value: submitterName ?? submitterEmail },
              { title: '状态', value: STATUS_LABELS[currentStatus] ?? currentStatus },
            ],
          },
          // 描述
          {
            type: 'TextBlock',
            text: description.length > 200 ? description.slice(0, 200) + '…' : description,
            wrap: true,
            color: 'Default',
            isSubtle: false,
          },
        ],
      },
    ],
    actions: [
      approveAction(eventId, callbackUrl, false),
      rejectAction(eventId, callbackUrl),
    ],
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    minHeight: '80px',
  };
}

// ─── 模板 2：任务分配 ────────────────────────────────────────────────────

export interface ScheduleTemplateParams {
  requestNo: string;
  title: string;
  urgency: 'P1' | 'P2' | 'P3';
  assigneeName?: string;
  assigneeEmail: string;
  team: string;
  estimatedDeployAt: string;
  scheduledByEmail: string;
  scheduledByName?: string;
  eventId: string;
  priority?: 'high' | 'normal' | 'low';
}

export function scheduleCard(params: ScheduleTemplateParams): AdaptiveCard {
  const {
    requestNo, title, urgency, assigneeName, assigneeEmail,
    team, estimatedDeployAt, scheduledByEmail, scheduledByName, eventId,
    priority = 'normal',
  } = params;

  const urgencyLabel = urgency === 'P1' ? '🔴 P1' : urgency === 'P2' ? '🟡 P2' : '⚪ P3';
  const deployDate = new Date(estimatedDeployAt).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });

  return {
    type: 'AdaptiveCard',
    version: '1.5',
    body: [
      {
        type: 'Container',
        style: 'emphasis',
        items: [
          {
            type: 'ColumnSet',
            columns: [
              {
                type: 'Column',
                width: 'stretch',
                items: [
                  {
                    type: 'TextBlock',
                    text: '📌 任务分配',
                    weight: 'Bolder',
                    size: 'Medium',
                    color: 'Light',
                  },
                  {
                    type: 'TextBlock',
                    text: requestNo,
                    size: 'Small',
                    color: 'Light',
                    isSubtle: true,
                  },
                ],
              },
              {
                type: 'Column',
                width: 'auto',
                items: [{
                  type: 'TextBlock',
                  text: urgencyLabel,
                  weight: 'Bolder',
                  color: 'Light',
                }],
              },
            ],
          },
        ],
      },
      {
        type: 'Container',
        spacing: 'Medium',
        items: [
          {
            type: 'TextBlock',
            text: title,
            weight: 'Bolder',
            size: 'Medium',
            wrap: true,
          },
          {
            type: 'FactSet',
            facts: [
              { title: '负责人', value: assigneeName ?? assigneeEmail },
              { title: '负责团队', value: team },
              { title: '计划部署', value: deployDate },
              { title: '安排人', value: scheduledByName ?? scheduledByEmail },
            ],
          },
        ],
      },
    ],
    actions: [],
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  };
}

// ─── 模板 3：UAT 结果 ───────────────────────────────────────────────────

export interface UatResultTemplateParams {
  requestNo: string;
  title: string;
  result: 'pass' | 'fail';
  /** 仅 fail 时有 */
  failReason?: string;
  submittedByEmail: string;
  submittedByName?: string;
  callbackUrl?: string;
  eventId: string;
}

export function uatResultCard(params: UatResultTemplateParams): AdaptiveCard {
  const {
    requestNo, title, result, failReason,
    submittedByEmail, submittedByName, callbackUrl, eventId,
  } = params;

  if (result === 'pass') {
    return {
      type: 'AdaptiveCard',
      version: '1.5',
      body: [
        {
          type: 'Container',
          style: 'good',
          items: [{
            type: 'TextBlock',
            text: '✅ UAT 测试通过',
            weight: 'Bolder',
            size: 'Medium',
            color: 'Light',
          }],
        },
        {
          type: 'Container',
          spacing: 'Medium',
          items: [
            {
              type: 'TextBlock',
              text: title,
              weight: 'Bolder',
              size: 'Medium',
              wrap: true,
            },
            {
              type: 'FactSet',
              facts: [
                { title: '单号', value: requestNo },
                { title: '提交人', value: submittedByName ?? submittedByEmail },
                { title: '结果', value: '✅ 通过' },
              ],
            },
            {
              type: 'TextBlock',
              text: '系统将自动进入部署流程，请等待进一步通知。',
              wrap: true,
              color: 'Default',
              isSubtle: true,
            },
          ],
        },
      ],
      actions: [],
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    };
  } else {
    return {
      type: 'AdaptiveCard',
      version: '1.5',
      body: [
        {
          type: 'Container',
          style: 'attention',
          items: [{
            type: 'TextBlock',
            text: '⚠️ UAT 测试未通过',
            weight: 'Bolder',
            size: 'Medium',
            color: 'Light',
          }],
        },
        {
          type: 'Container',
          spacing: 'Medium',
          items: [
            {
              type: 'TextBlock',
              text: title,
              weight: 'Bolder',
              size: 'Medium',
              wrap: true,
            },
            {
              type: 'FactSet',
              facts: [
                { title: '单号', value: requestNo },
                { title: '提交人', value: submittedByName ?? submittedByEmail },
                { title: '结果', value: '❌ 未通过' },
              ],
            },
            ...(failReason ? [{
              type: 'TextBlock' as const,
              text: `**未通过原因：** ${failReason}`,
              wrap: true,
              color: 'Attention',
            }] : []),
          ],
        },
      ],
      actions: callbackUrl ? [
        {
          type: 'Action.Submit',
          title: '📝 重新处理',
          data: {
            action: 'uat_fail_ack',
            eventId,
            callback: { method: 'POST', url: callbackUrl },
          },
        },
      ] : [],
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    };
  }
}

// ─── 模板 4：部署就绪 / 待验收 ─────────────────────────────────────────

export interface DeployReadyTemplateParams {
  requestNo: string;
  title: string;
  deployAt: string;
  deployedByEmail: string;
  deployedByName?: string;
  callbackUrl: string;
  eventId: string;
  priority?: 'high' | 'normal' | 'low';
}

export function deployReadyCard(params: DeployReadyTemplateParams): AdaptiveCard {
  const {
    requestNo, title, deployAt, deployedByEmail, deployedByName,
    callbackUrl, eventId, priority = 'normal',
  } = params;

  const deployDate = new Date(deployAt).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });

  return {
    type: 'AdaptiveCard',
    version: '1.5',
    body: [
      {
        type: 'Container',
        style: 'emphasis',
        items: [{
          type: 'TextBlock',
          text: '🚀 待验收',
          weight: 'Bolder',
          size: 'Medium',
          color: 'Light',
        }],
      },
      {
        type: 'Container',
        spacing: 'Medium',
        items: [
          {
            type: 'TextBlock',
            text: title,
            weight: 'Bolder',
            size: 'Medium',
            wrap: true,
          },
          {
            type: 'FactSet',
            facts: [
              { title: '单号', value: requestNo },
              { title: '部署时间', value: deployDate },
              { title: '部署人', value: deployedByName ?? deployedByEmail },
            ],
          },
          {
            type: 'TextBlock',
            text: '请确认功能是否正常，如有问题请及时反馈。',
            wrap: true,
            color: 'Default',
            isSubtle: true,
          },
        ],
      },
    ],
    actions: [
      {
        type: 'Action.Submit',
        title: '✅ 验收通过',
        style: 'positive',
        data: {
          action: 'accept',
          eventId,
          callback: { method: 'POST', url: callbackUrl },
        },
      },
      {
        type: 'Action.Submit',
        title: '❌ 验收不通过',
        style: 'destructive',
        data: {
          action: 'reject_acceptance',
          eventId,
          callback: {
            method: 'POST',
            url: callbackUrl,
            requireInput: 'reason',
          },
        },
      },
    ],
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  };
}

// ─── 模板 5：FYI 状态更新 ───────────────────────────────────────────────

export interface StatusUpdateTemplateParams {
  requestNo: string;
  title: string;
  fromStatus: string;
  toStatus: string;
  updatedByEmail: string;
  updatedByName?: string;
  comment?: string;
  eventId: string;
}

export function statusUpdateCard(params: StatusUpdateTemplateParams): AdaptiveCard {
  const {
    requestNo, title, fromStatus, toStatus,
    updatedByEmail, updatedByName, comment, eventId,
  } = params;

  return {
    type: 'AdaptiveCard',
    version: '1.5',
    body: [
      {
        type: 'Container',
        style: 'accent',
        items: [{
          type: 'TextBlock',
          text: '🔔 需求状态更新',
          weight: 'Bolder',
          size: 'Medium',
          color: 'Light',
        }],
      },
      {
        type: 'Container',
        spacing: 'Medium',
        items: [
          {
            type: 'TextBlock',
            text: title,
            weight: 'Bolder',
            size: 'Medium',
            wrap: true,
          },
          {
            type: 'FactSet',
            facts: [
              { title: '单号', value: requestNo },
              { title: '变更', value: `${STATUS_LABELS[fromStatus] ?? fromStatus} → ${STATUS_LABELS[toStatus] ?? toStatus}` },
              { title: '操作人', value: updatedByName ?? updatedByEmail },
            ],
          },
          ...(comment ? [{
            type: 'TextBlock' as const,
            text: comment,
            wrap: true,
            color: 'Default',
            isSubtle: false,
          }] : []),
        ],
      },
    ],
    actions: [],
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  };
}

// ─── 导出所有模板 ────────────────────────────────────────────────────────

export const templates = {
  approvalCard,
  scheduleCard,
  uatResultCard,
  deployReadyCard,
  statusUpdateCard,
};

export default templates;
