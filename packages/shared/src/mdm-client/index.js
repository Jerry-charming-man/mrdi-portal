/**
 * MDM Client — 业务系统统一通过此 client 调 MDM API
 * 4 个 API 服务（cimrms / cimims / perm / portal）都通过它获取用户/权限/通知
 *
 * 部署时：
 *   - MDM 不可用 → fail-fast（写操作） 或 用最后一次缓存（读操作）
 *   - 通过 MDM_API_KEY 鉴权（X-API-Key header）
 */
import { ExternalServiceError, ForbiddenError } from '../errors/index.js';
export class MdmClient {
    baseUrl;
    apiKey;
    sourceSystem;
    timeoutMs;
    cacheTtlSeconds;
    // 简单内存缓存（生产环境换成 Redis 共享）
    cache = new Map();
    constructor(config) {
        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        this.apiKey = config.apiKey;
        this.sourceSystem = config.sourceSystem;
        this.timeoutMs = config.timeoutMs ?? 3000;
        this.cacheTtlSeconds = config.cacheTtlSeconds ?? 300;
    }
    // ====== 用户 ======
    async getUserByEmail(email) {
        const cacheKey = `user:${email}`;
        const cached = this.cacheGet(cacheKey);
        if (cached !== undefined)
            return cached;
        try {
            const res = await this.fetch(`/users/by-email/${encodeURIComponent(email)}`);
            const user = res.ok ? (await res.json()) : null;
            this.cacheSet(cacheKey, user);
            return user;
        }
        catch (err) {
            throw new ExternalServiceError('MDM', `getUserByEmail(${email}) failed: ${err.message}`);
        }
    }
    async getManager(email) {
        try {
            const res = await this.fetch(`/users/by-email/${encodeURIComponent(email)}/manager`);
            return res.ok ? (await res.json()) : null;
        }
        catch (err) {
            throw new ExternalServiceError('MDM', `getManager(${email}) failed: ${err.message}`);
        }
    }
    // ====== 权限（★ 核心）======
    async checkPermission(params) {
        const cacheKey = `perm:${params.userEmail}:${params.resourceId}:${params.action}`;
        const cached = this.cacheGet(cacheKey);
        if (cached !== undefined)
            return cached;
        try {
            const res = await this.fetch('/permissions/check', {
                method: 'POST',
                body: JSON.stringify(params),
            });
            if (!res.ok) {
                throw new ForbiddenError(`MDM 权限校验失败: ${res.status}`);
            }
            const result = (await res.json());
            this.cacheSet(cacheKey, result);
            return result;
        }
        catch (err) {
            if (err instanceof ForbiddenError)
                throw err;
            throw new ExternalServiceError('MDM', `checkPermission failed: ${err.message}`);
        }
    }
    // ====== 资源临时授权（CIM-PERM 用）======
    async grantPermission(params) {
        try {
            const res = await this.fetch('/permissions/grant', {
                method: 'POST',
                body: JSON.stringify(params),
            });
            if (!res.ok) {
                throw new Error(`grant failed: ${res.status}`);
            }
            return (await res.json());
        }
        catch (err) {
            throw new ExternalServiceError('MDM', `grantPermission failed: ${err.message}`);
        }
    }
    async revokePermission(grantId) {
        try {
            const res = await this.fetch(`/permissions/grant/${encodeURIComponent(grantId)}/revoke`, {
                method: 'POST',
            });
            if (!res.ok) {
                throw new Error(`revoke failed: ${res.status}`);
            }
        }
        catch (err) {
            throw new ExternalServiceError('MDM', `revokePermission failed: ${err.message}`);
        }
    }
    // ====== 通知 ======
    async sendNotification(notification) {
        try {
            const res = await this.fetch('/notifications/send', {
                method: 'POST',
                body: JSON.stringify({ ...notification, source_system: this.sourceSystem }),
            });
            if (!res.ok) {
                throw new Error(`sendNotification failed: ${res.status}`);
            }
        }
        catch (err) {
            throw new ExternalServiceError('MDM', `sendNotification failed: ${err.message}`);
        }
    }
    // ====== 待办 BB-06 ======
    async createTodo(params) {
        try {
            const res = await this.fetch('/todos', {
                method: 'POST',
                body: JSON.stringify(params),
            });
            if (!res.ok) {
                throw new Error(`createTodo failed: ${res.status}`);
            }
            return (await res.json());
        }
        catch (err) {
            throw new ExternalServiceError('MDM', `createTodo failed: ${err.message}`);
        }
    }
    // ====== 内部 ======
    async fetch(path, init) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            return await fetch(`${this.baseUrl}${path}`, {
                ...init,
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey,
                    'X-Source-System': this.sourceSystem,
                    ...(init?.headers ?? {}),
                },
                signal: controller.signal,
            });
        }
        finally {
            clearTimeout(timeout);
        }
    }
    cacheGet(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return undefined;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return undefined;
        }
        return entry.value;
    }
    cacheSet(key, value) {
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + this.cacheTtlSeconds * 1000,
        });
    }
}
//# sourceMappingURL=index.js.map