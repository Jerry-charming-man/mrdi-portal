/**
 * MDM Client — 业务系统统一通过此 client 调 MDM API
 * 4 个 API 服务（cimrms / cimims / perm / portal）都通过它获取用户/权限/通知
 *
 * 部署时：
 *   - MDM 不可用 → fail-fast（写操作） 或 用最后一次缓存（读操作）
 *   - 通过 MDM_API_KEY 鉴权（X-API-Key header）
 */
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
export interface MdmNotification {
    to_emails: string[];
    cc_emails?: string[];
    channels: Array<'inapp' | 'email' | 'sms' | 'bb06'>;
    template_key: string;
    template_vars: Record<string, string | number | boolean>;
    source_system: string;
    related_id?: string;
}
export interface MdmClientConfig {
    baseUrl: string;
    apiKey: string;
    sourceSystem: string;
    timeoutMs?: number;
    cacheTtlSeconds?: number;
}
export declare class MdmClient {
    private readonly baseUrl;
    private readonly apiKey;
    private readonly sourceSystem;
    private readonly timeoutMs;
    private readonly cacheTtlSeconds;
    private readonly cache;
    constructor(config: MdmClientConfig);
    getUserByEmail(email: string): Promise<MdmUser | null>;
    getManager(email: string): Promise<MdmUser | null>;
    checkPermission(params: {
        userEmail: string;
        resourceId: string;
        action: string;
    }): Promise<PermissionCheckResult>;
    grantPermission(params: {
        userEmail: string;
        resourceId: string;
        permissionId: string;
        expiresAt: string;
        grantedByEmail: string;
    }): Promise<{
        grant_id: string;
    }>;
    revokePermission(grantId: string): Promise<void>;
    sendNotification(notification: Omit<MdmNotification, 'source_system'>): Promise<void>;
    createTodo(params: {
        owner_email: string;
        source: string;
        related_id: string;
        title: string;
        label: 'red' | 'green' | 'blue';
        due_at?: string;
    }): Promise<{
        todo_id: string;
    }>;
    private fetch;
    private cacheGet;
    private cacheSet;
}
//# sourceMappingURL=index.d.ts.map