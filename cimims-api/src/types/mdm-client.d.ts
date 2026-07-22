// Type stub for @mrdi/shared/mdm-client
// NOTE: Keep in sync with packages/shared/src/mdm-client/index.ts
declare module '@mrdi/shared/mdm-client' {
  export interface MdmUser {
    email: string;
    name: string;
    department: string;
    global_role: string;
    status: 'active' | 'suspended';
  }

  export interface MdmClientConfig {
    baseUrl: string;
    serviceToken: string;
    sourceSystem: string;
    timeoutMs?: number;
    cacheTtlSeconds?: number;
  }

  export interface PermissionCheckResult {
    allowed: boolean;
    role: string;
    permissions: string[];
    reason?: string;
  }

  export class MdmClient {
    constructor(config: MdmClientConfig);

    sendNotification(params: {
      toEmails: string[];
      notificationType: string;
      title: string;
      body?: string;
      metadata?: Record<string, unknown>;
    }): Promise<void>;

    getUserByEmail(email: string): Promise<MdmUser | null>;

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
    }): Promise<{ grant_id: string }>;

    revokePermission(grantId: string): Promise<void>;

    auditEvent(params: {
      action: string;
      actorEmail: string;
      actorName: string;
      targetEmail?: string;
      targetType?: string;
      targetId?: string;
      metadata?: Record<string, unknown>;
      ipAddress?: string;
      timestamp?: string;
    }): Promise<void>;
  }
}
