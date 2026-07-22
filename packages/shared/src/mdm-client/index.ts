/**
 * MDM Client — 业务系统统一通过此 client 调 MDM API
 * 4 个 API 服务（cimrms / cimims / perm / portal）都通过它获取用户/权限/通知
 *
 * 部署时：
 *   - MDM 不可用 → fail-fast（写操作） 或 用最后一次缓存（读操作）
 *   - 通知发送通过 SERVICE_TOKEN（X-Service-Token header）
 *   - 用户/权限查询通过 JWT Bearer token
 */

import { ExternalServiceError, ForbiddenError } from '../errors/index.js';

export interface MdmUser {
  email: string;
  name: string;
  department: string;
  global_role: string;
  status: 'active' | 'suspended';
}

export interface PermissionCheckResult {
  allowed: boolean;
  role: string;
  permissions: string[];
  reason?: string;
}

export interface MdmClientConfig {
  baseUrl: string;       // e.g. 'http://mdm-api:3000/v1'
  serviceToken: string;  // SERVICE_TOKEN from mdm-api env
  sourceSystem: string;  // 'cimrms-api' / 'cimims-api' / 'cim-perm-api'
  timeoutMs?: number;
  cacheTtlSeconds?: number;
}

export class MdmClient {
  private readonly baseUrl: string;
  private readonly serviceToken: string;
  private readonly sourceSystem: string;
  private readonly timeoutMs: number;
  private readonly cacheTtlSeconds: number;

  // 简单内存缓存（生产环境换成 Redis 共享）
  private readonly cache = new Map<string, { value: unknown; expiresAt: number }>();

  constructor(config: MdmClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.serviceToken = config.serviceToken;
    this.sourceSystem = config.sourceSystem;
    this.timeoutMs = config.timeoutMs ?? 3000;
    this.cacheTtlSeconds = config.cacheTtlSeconds ?? 300;
  }

  // ====== 用户 ======

  async getUserByEmail(email: string): Promise<MdmUser | null> {
    const cacheKey = `user:${email}`;
    const cached = this.cacheGet<MdmUser | null>(cacheKey);
    if (cached !== undefined) return cached;

    try {
      const res = await this.fetch(`/users/by-email/${encodeURIComponent(email)}`);
      const user = res.ok ? ((await res.json()) as MdmUser) : null;
      this.cacheSet(cacheKey, user);
      return user;
    } catch (err) {
      throw new ExternalServiceError('MDM', `getUserByEmail(${email}) failed: ${(err as Error).message}`);
    }
  }

  async getManager(email: string): Promise<MdmUser | null> {
    try {
      const res = await this.fetch(`/users/by-email/${encodeURIComponent(email)}/manager`);
      return res.ok ? ((await res.json()) as MdmUser) : null;
    } catch (err) {
      throw new ExternalServiceError('MDM', `getManager(${email}) failed: ${(err as Error).message}`);
    }
  }

  // ====== 权限（★ 核心）======

  async checkPermission(params: {
    userEmail: string;
    resourceId: string;
    action: string;
  }): Promise<PermissionCheckResult> {
    const cacheKey = `perm:${params.userEmail}:${params.resourceId}:${params.action}`;
    const cached = this.cacheGet<PermissionCheckResult>(cacheKey);
    if (cached !== undefined) return cached;

    try {
      const res = await this.fetch('/permissions/check', {
        method: 'POST',
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        throw new ForbiddenError(`MDM 权限校验失败: ${res.status}`);
      }

      const result = (await res.json()) as PermissionCheckResult;
      this.cacheSet(cacheKey, result);
      return result;
    } catch (err) {
      if (err instanceof ForbiddenError) throw err;
      throw new ExternalServiceError('MDM', `checkPermission failed: ${(err as Error).message}`);
    }
  }

  // ====== 资源临时授权（CIM-PERM 用）======

  async grantPermission(params: {
    userEmail: string;
    resourceId: string;
    permissionId: string;
    expiresAt: string;
    grantedByEmail: string;
  }): Promise<{ grant_id: string }> {
    try {
      const res = await this.fetch('/permissions/grant', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        throw new Error(`grant failed: ${res.status}`);
      }
      return (await res.json()) as { grant_id: string };
    } catch (err) {
      throw new ExternalServiceError('MDM', `grantPermission failed: ${(err as Error).message}`);
    }
  }

  async revokePermission(grantId: string): Promise<void> {
    try {
      const res = await this.fetch(`/permissions/grant/${encodeURIComponent(grantId)}/revoke`, {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error(`revoke failed: ${res.status}`);
      }
    } catch (err) {
      throw new ExternalServiceError('MDM', `revokePermission failed: ${(err as Error).message}`);
    }
  }

  // ====== 通知（S3-2: 简化为直接写 DB，channels/templating 后续加）======

  async sendNotification(params: {
    toEmails: string[];
    notificationType: string;
    title: string;
    body?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const res = await this.fetch('/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          to_emails: params.toEmails,
          notification_type: params.notificationType,
          title: params.title,
          body: params.body ?? undefined,
          metadata: params.metadata ?? undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(`sendNotification failed: ${res.status}`);
      }
    } catch (err) {
      throw new ExternalServiceError('MDM', `sendNotification failed: ${(err as Error).message}`);
    }
  }

  // ====== Audit Event (S4-3: 跨系统审计) ======

  /**
   * 将操作事件写入 MDM 统一审计日志
   * 非关键路径：失败不抛错，console.warn 降级
   */
  async auditEvent(params: {
    action: string;        // e.g. 'request.approve', 'incident.takeover', 'perm.grant'
    actorEmail: string;
    actorName: string;
    targetEmail?: string;
    targetType?: string;  // 'user' | 'request' | 'incident' | 'permission'
    targetId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    timestamp?: string;    // ISO 8601，若不填则用 MDM 服务器时间
  }): Promise<void> {
    try {
      const res = await this.fetch('/audit/events', {
        method: 'POST',
        body: JSON.stringify({
          sourceSystem: this.sourceSystem,
          ...params,
        }),
      });
      if (!res.ok) {
        // non-critical: log and degrade
        console.warn(`[AuditClient] auditEvent failed: ${res.status} for ${params.action}`);
      }
    } catch (err) {
      // non-critical path — don't throw
      console.warn(`[AuditClient] auditEvent error: ${(err as Error).message}`);
    }
  }

  // ====== 待办 BB-06 ======

  async createTodo(params: {
    owner_email: string;
    source: string;
    related_id: string;
    title: string;
    label: 'red' | 'green' | 'blue';
    due_at?: string;
  }): Promise<{ todo_id: string }> {
    try {
      const res = await this.fetch('/todos', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        throw new Error(`createTodo failed: ${res.status}`);
      }
      return (await res.json()) as { todo_id: string };
    } catch (err) {
      throw new ExternalServiceError('MDM', `createTodo failed: ${(err as Error).message}`);
    }
  }

  // ====== 内部 ======

  private async fetch(path: string, init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Token': this.serviceToken,
          'X-Source-System': this.sourceSystem,
          ...(init?.headers ?? {}),
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private cacheGet<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  private cacheSet<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.cacheTtlSeconds * 1000,
    });
  }
}
