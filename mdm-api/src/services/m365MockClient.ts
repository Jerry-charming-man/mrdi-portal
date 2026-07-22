/**
 * M365 OAuth Mock Client（dev only）
 *
 * 模拟 M365 OAuth 2.0 flow：
 *   1. authorize() → 返回 mock redirect（含 auth code）
 *   2. exchangeCode() → 用 code 换 mock access_token
 *   3. getMe() → 调用 mock Graph API /me，返回用户信息
 *
 * ADR-0006 · Sprint 3 T3
 * 仅在 NODE_ENV=development 或 M365_MOCK_ENABLED=true 时激活。
 * 生产：此模块不加载，走真实 Entra ID OAuth（future work）。
 */
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';

// ── Types ───────────────────────────────────────────────────────────────────

export interface M365MockUserInfo {
  id: string;         // Entra Object ID
  mail: string;
  displayName: string;
  department: string;
}

export interface M365MockTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface M365MockAuthorizeResult {
  redirectTo: string; // 完整的 mock redirect URL
  code: string;        // mock authorization code（callback 时用）
}

// ── Mock 数据存储（内存，仅 dev）───────────────────────────────────────────────

interface MockUser {
  id: string;
  mail: string;
  displayName: string;
  department: string;
  roles: string[];
}

/** 内置 mock 用户列表（dev 环境快速切换测试角色） */
const MOCK_USERS: MockUser[] = [
  {
    id: 'mock-user-admin-001',
    mail: 'admin@mrdi-dev.onmicrosoft.com',
    displayName: 'Admin Dev User',
    department: 'CIM',
    roles: ['admin'],
  },
  {
    id: 'mock-user-editor-001',
    mail: 'editor@mrdi-dev.onmicrosoft.com',
    displayName: 'Editor Dev User',
    department: 'Manufacturing',
    roles: ['editor'],
  },
  {
    id: 'mock-user-viewer-001',
    mail: 'viewer@mrdi-dev.onmicrosoft.com',
    displayName: 'Viewer Dev User',
    department: 'Quality',
    roles: ['viewer'],
  },
];

// code → user 映射（in-memory，5 分钟过期）
const mockCodeStore = new Map<string, { user: MockUser; expiresAt: number; token: string }>();

// ── 工具函数 ─────────────────────────────────────────────────────────────────

function generateCode(userId: string): string {
  return `mock_auth_code_${randomUUID().replace(/-/g, '')}_${userId}`;
}

function isMockEnabled(env: { NODE_ENV: string; M365_MOCK_ENABLED?: boolean }): boolean {
  return env.NODE_ENV === 'development' || env.M365_MOCK_ENABLED === true;
}

/**
 * 清理过期 code（每次调用时惰性清理）
 */
function cleanupExpiredCodes(): void {
  const now = Date.now();
  for (const [code, entry] of mockCodeStore.entries()) {
    if (entry.expiresAt < now) {
      mockCodeStore.delete(code);
    }
  }
}

/**
 * 从 access token 提取 code 对应的 user（用于 getMe）
 * 简化：直接通过 codeStore 的 token→user 反查
 */
function getUserByToken(token: string): MockUser | null {
  for (const entry of mockCodeStore.values()) {
    if (entry.token === token) return entry.user;
  }
  // code 已使用（expired）的场景：在外部重新 authorize
  return null;
}

// ── M365MockClient 类 ───────────────────────────────────────────────────────

export class M365MockClient {
  constructor(
    private readonly app: FastifyInstance,
    private readonly redirectUri: string,
  ) {}

  /**
   * Step 1: authorize — 生成 mock redirect URL
   *
   * 前端调用此方法，获取 redirect URL，然后模拟浏览器跳转到该 URL。
   * 实际实现中，前端可以直接调用 exchangeCode()，这里 redirect 仅用于模拟 OAuth 流程。
   */
  authorize(email?: string): M365MockAuthorizeResult {
    if (!isMockEnabled(this.app.env)) {
      throw new Error('M365 OAuth mock is only available in development mode');
    }

    // 找到对应 mock 用户（没传 email 就用 admin）
    // noUncheckedIndexedAccess: use ! to assert array elements exist
    const user = email
      ? MOCK_USERS.find(u => u.mail.toLowerCase() === email.toLowerCase()) ?? MOCK_USERS[0]!
      : MOCK_USERS[0]!

    const code = generateCode(user.id);

    // 存储 code → user（5 分钟过期）
    cleanupExpiredCodes();
    mockCodeStore.set(code, {
      user,
      expiresAt: Date.now() + 5 * 60 * 1000,
      token: '', // filled in exchangeCode
    });

    const params = new URLSearchParams({
      code,
      state: randomUUID(), // 防止 CSRF（mock 简化）
    });

    return {
      redirectTo: `${this.redirectUri}?${params.toString()}`,
      code,
    };
  }

  /**
   * Step 2: exchangeCode — 用 auth code 换 access token
   *
   * 模拟 M365 token endpoint 的响应格式。
   * 将 code 和对应 user 绑定，getMe 时可查。
   */
  exchangeCode(code: string): M365MockTokenResponse {
    if (!isMockEnabled(this.app.env)) {
      throw new Error('M365 OAuth mock is only available in development mode');
    }

    cleanupExpiredCodes();
    const entry = mockCodeStore.get(code);

    if (!entry || entry.expiresAt < Date.now()) {
      throw new Error('invalid_or_expired_code');
    }

    const accessToken = `mock_access_token_${randomUUID().replace(/-/g, '')}`;

    // 用新 token 替换 codeStore 中的旧 token（code 已消耗，保留 token→user 映射）
    const { user } = entry;
    mockCodeStore.delete(code);
    mockCodeStore.set(accessToken, {
      user,
      expiresAt: Date.now() + 3600 * 1000, // token 1 小时有效
      token: accessToken,
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: `mock_refresh_token_${randomUUID().replace(/-/g, '')}`,
    };
  }

  /**
   * Step 3: getMe — 调用 mock Graph API /me
   *
   * 模拟 Microsoft Graph GET /me endpoint。
   * 从 codeStore 查找 token → user 映射，返回对应用户信息。
   */
  getMe(accessToken: string): M365MockUserInfo {
    if (!isMockEnabled(this.app.env)) {
      throw new Error('M365 OAuth mock is only available in development mode');
    }

    cleanupExpiredCodes();

    const entry = mockCodeStore.get(accessToken);
    if (!entry || entry.expiresAt < Date.now()) {
      throw new Error('invalid_or_expired_token');
    }

    const user = entry.user;
    return {
      id: user.id,
      mail: user.mail,
      displayName: user.displayName,
      department: user.department,
    };
  }

  /**
   * 查询可用的 mock 用户列表（供前端选择）
   */
  listMockUsers(): MockUser[] {
    return MOCK_USERS;
  }
}
