/**
 * Teams Notify Gateway — Client SDK
 *
 * 业务系统用它把通知发到 Teams Notify Gateway，再由 Gateway 投递到 Teams。
 *
 * 使用示例：
 * ```ts
 * import { TeamsNotifyClient } from '@mrdi/teams-notify';
 * import { templates } from '@mrdi/teams-notify/templates';
 *
 * const notify = new TeamsNotifyClient({
 *   gatewayBaseUrl: 'http://localhost:3010',
 *   sourceSystem:   'cimrms',
 *   serviceToken:   process.env.TEAMS_NOTIFY_SERVICE_TOKEN!,
 * });
 *
 * await notify.send({
 *   eventId:     `cimrms-${requestId}-approve`,
 *   recipients:  { users: ['mgr@mrdi.com'] },
 *   card:        templates.approvalCard({ ... }),
 *   options:     { priority: 'high', fallbackEmail: true },
 * });
 * ```
 */

import { z } from 'zod';

// ─── Adaptive Card 基本结构 ────────────────────────────────────────────────

export interface AdaptiveCard {
  type: 'AdaptiveCard';
  version: string;
  body?: unknown[];
  actions?: unknown[];
  [key: string]: unknown;
}

export interface CallbackConfig {
  method: 'POST' | 'PUT';
  url: string;
  headers?: Record<string, string>;
  /** 弹输入框收用户输入（如驳回理由） */
  requireInput?: string;
}

// ─── Send options ─────────────────────────────────────────────────────────

export const NotifyOptionsSchema = z.object({
  priority: z.enum(['high', 'normal', 'low']).default('normal'),
  expiresAt: z.string().datetime().optional(),
  fallbackEmail: z.boolean().default(true),
});
export type NotifyOptions = z.infer<typeof NotifyOptionsSchema>;

// ─── Send request ─────────────────────────────────────────────────────────

export interface Recipients {
  users?: string[];
  channels?: string[];
}

export interface SendParams {
  eventId: string;
  recipients: Recipients;
  card: AdaptiveCard;
  options?: Partial<NotifyOptions>;
  /** 超时 ms（默认 8000） */
  timeoutMs?: number;
}

export interface QueuedResult {
  notificationId: string;
  status: 'queued';
  deliveredTo: Recipients;
  queuedAt: string;
}

export interface IdempotentResult {
  notificationId: string;
  status: string;
  deliveredTo: Recipients;
  message: 'already_processed (idempotent)';
}

// ─── Client ──────────────────────────────────────────────────────────────

export interface TeamsNotifyClientOptions {
  /** Gateway base URL，如 http://localhost:3010 */
  gatewayBaseUrl: string;
  /** 业务系统标识（如 "cimrms"），必须与 gateway 注册的一致 */
  sourceSystem: string;
  /** Service token（从 gateway 的 /admin/service-token 或 Entra ID client_credentials 获取） */
  serviceToken: string;
  /** 默认超时（ms），默认 8000 */
  defaultTimeoutMs?: number;
}

export class TeamsNotifyClient {
  private readonly baseUrl: string;
  private readonly source: string;
  private readonly token: string;
  private readonly defaultTimeout: number;

  constructor(opts: TeamsNotifyClientOptions) {
    this.baseUrl = opts.gatewayBaseUrl.replace(/\/$/, '');
    this.source = opts.sourceSystem;
    this.token = opts.serviceToken;
    this.defaultTimeout = opts.defaultTimeoutMs ?? 8000;
  }

  /**
   * 发送通知到 Teams
   *
   * @returns queued result (notificationId + status=queued)
   *          或幂等结果（已处理过同一 eventId）
   * @throws  GatewayError（HTTP 4xx/5xx）
   */
  async send(params: SendParams): Promise<QueuedResult | IdempotentResult> {
    const { eventId, recipients, card, options = {}, timeoutMs = this.defaultTimeout } = params;

    // 参数校验
    if (!eventId?.trim()) throw new Error('eventId is required');
    if (!recipients.users?.length && !recipients.channels?.length) {
      throw new Error('At least one of users or channels is required');
    }

    const body = {
      eventId,
      recipients,
      card,
      options: {
        priority: 'normal',
        fallbackEmail: true,
        ...options,
      },
    };

    const resp = await fetch(`${this.baseUrl}/api/v1/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        'X-Source-System': this.source,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!resp.ok) {
      const detail = await resp.text().catch(() => '');
      throw new GatewayError(
        `Gateway returned ${resp.status}: ${detail}`,
        resp.status,
        detail,
      );
    }

    return resp.json() as Promise<QueuedResult | IdempotentResult>;
  }

  /**
   * 查询通知投递状态
   */
  async getStatus(notificationId: string, timeoutMs = this.defaultTimeout): Promise<NotificationStatus> {
    const resp = await fetch(`${this.baseUrl}/api/v1/notifications/${notificationId}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!resp.ok) {
      const detail = await resp.text().catch(() => '');
      throw new GatewayError(`Status check failed: ${resp.status}`, resp.status, detail);
    }
    return resp.json() as Promise<NotificationStatus>;
  }
}

// ─── Gateway Error ────────────────────────────────────────────────────────

export class GatewayError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly detail: string,
  ) {
    super(message);
    this.name = 'GatewayError';
  }
}

// ─── Status response ──────────────────────────────────────────────────────

export interface NotificationStatus {
  notificationId: string;
  eventId: string;
  sourceSystem: string;
  status: 'queued' | 'processing' | 'delivered' | 'failed' | 'expired';
  deliveryAttempts: number;
  lastError: string | null;
  deliveredAt: string | null;
  deliveredTo: {
    users: Array<{ recipient: string; status: string; error?: string }>;
    channels: Array<{ recipient: string; status: string; error?: string }>;
  };
  callback: {
    received: boolean;
    receivedAt: string | null;
    responseCode: number | null;
  };
  createdAt: string;
  updatedAt: string;
}
