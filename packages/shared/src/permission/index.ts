/**
 * @mrdi/shared — permission guard + resource-level RBAC
 *
 * 功能：
 * - 角色守卫（requireAdmin / requireEditor / requireAuditor / requireViewer / requireAnyRole）
 * - 资源级权限检查（requirePermission / hasPermission）
 * - 资源级权限查询（checkResourcePermission — 调 MDM /permissions/check）
 * - 4 API 通用 auth user 接口
 *
 * 用法：
 *   import { requireAdmin, requireRole, hasPermission, checkResourcePermission, type AuthUser } from '@mrdi/shared/permission'
 *   requireAdmin(req.currentUser)
 *   requireRole(req.currentUser, 'editor')
 *   hasPermission(req.currentUser, 'cimrms:request:write')
 *   await checkResourcePermission(mdmClient, user, 'cimrms', 'request', 'write', 'NC-2026-0001')
 */
import { ForbiddenError, UnauthorizedError } from '../errors/index.js'
import type { PermissionCheckResult } from '../mdm-client/index.js'

export { ForbiddenError, UnauthorizedError }
export type { GlobalRole } from '../enums/index.js'

// ─── Auth user interface ────────────────────────────────────────────────────────

export interface AuthUser {
  email: string
  name: string
  role: string
  department: string
}

// ─── Role hierarchy ─────────────────────────────────────────────────────────────

// viewer ⊂ editor ⊂ admin
// auditor is independent (cross-system read + audit)
const ROLE_LEVEL: Record<string, number> = {
  viewer:  1,
  editor:  2,
  auditor: 3,
  admin:   4,
}

function roleLevel(role: string): number {
  return ROLE_LEVEL[role] ?? 0
}

// ─── Role guards ────────────────────────────────────────────────────────────────

/**
 * 要求用户已登录（未登录则抛 UnauthorizedError）
 */
export function requireAuth(user: AuthUser | null | undefined): asserts user is AuthUser {
  if (!user) throw new UnauthorizedError()
}

/**
 * 要求用户必须是 exactRole（精确匹配）
 */
export function requireRole(user: AuthUser | null | undefined, exactRole: string): asserts user is AuthUser {
  if (!user) throw new UnauthorizedError()
  if (user.role !== exactRole) {
    throw new ForbiddenError(`需要 ${exactRole} 角色，当前为 ${user.role}`)
  }
}

/**
 * 要求用户具有 admin 角色
 */
export function requireAdmin(user: AuthUser | null | undefined): asserts user is AuthUser {
  if (!user) throw new UnauthorizedError()
  if (user.role !== 'admin') {
    throw new ForbiddenError(`需要 admin 角色，当前为 ${user.role}`)
  }
}

/**
 * 要求用户具有 editor 或更高角色（editor / admin）
 */
export function requireEditor(user: AuthUser | null | undefined): asserts user is AuthUser {
  if (!user) throw new UnauthorizedError()
  if (!['admin', 'editor'].includes(user.role)) {
    throw new ForbiddenError(`需要 editor+ 角色，当前为 ${user.role}`)
  }
}

/**
 * 要求用户具有 auditor 或更高角色（auditor / admin）
 */
export function requireAuditor(user: AuthUser | null | undefined): asserts user is AuthUser {
  if (!user) throw new UnauthorizedError()
  if (!['admin', 'auditor'].includes(user.role)) {
    throw new ForbiddenError(`需要 auditor+ 角色，当前为 ${user.role}`)
  }
}

/**
 * 要求用户具有 viewer 或更高角色（viewer / editor / admin）
 */
export function requireViewer(user: AuthUser | null | undefined): asserts user is AuthUser {
  if (!user) throw new UnauthorizedError()
  if (!['admin', 'editor', 'viewer'].includes(user.role)) {
    throw new ForbiddenError(`需要 viewer+ 角色，当前为 ${user.role}`)
  }
}

/**
 * 要求用户具有列表中的任一角色
 */
export function requireAnyRole(user: AuthUser | null | undefined, roles: string[]): asserts user is AuthUser {
  if (!user) throw new UnauthorizedError()
  if (!roles.includes(user.role)) {
    throw new ForbiddenError(`需要 [${roles.join(' / ')}] 角色之一，当前为 ${user.role}`)
  }
}

/**
 * 要求用户角色级别 >= minRole（支持自定义级别映射）
 */
export function requireRoleLevel(
  user: AuthUser | null | undefined,
  minRole: string,
  levels?: Record<string, number>,
): asserts user is AuthUser {
  if (!user) throw new UnauthorizedError()
  const lvlMap = levels ?? ROLE_LEVEL
  const minLvl = lvlMap[minRole] ?? 0
  if ((lvlMap[user.role] ?? 0) < minLvl) {
    throw new ForbiddenError(`需要 ${minRole}+ 级别，当前为 ${user.role}`)
  }
}

// ─── Boolean helpers ────────────────────────────────────────────────────────────

export function hasRoleLevel(user: AuthUser | null | undefined, minRole: string): boolean {
  if (!user) return false
  return roleLevel(user.role) >= roleLevel(minRole)
}

export function isAdmin(user: AuthUser | null | undefined): boolean {
  return user?.role === 'admin'
}

export function isEditorOrAbove(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  return ['admin', 'editor'].includes(user.role)
}

export function isAuditorOrAbove(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  return ['admin', 'auditor'].includes(user.role)
}

// ─── Resource-level permission ─────────────────────────────────────────────────

/**
 * 解析资源动作字符串，支持通配符
 *
 *   'cimrms:request:write'  → { resource: 'cimrms:request', action: 'write' }
 *   'cimrms:*'              → { resource: 'cimrms', action: '*' }
 *   '*:read'                → { resource: '*', action: 'read' }
 */
export function parsePermission(perm: string): { resource: string; action: string } {
  const colon = perm.indexOf(':')
  if (colon === -1) return { resource: '*', action: perm }
  return { resource: perm.slice(0, colon), action: perm.slice(colon + 1) }
}

/**
 * 检查用户是否具有某个资源级权限
 *
 * 算法（优先级从高到低）：
 *   1. `resource:action` 精确匹配
 *   2. `resource:*` 该资源所有动作
 *   3. `*:action` 该动作跨所有资源
 *   4. `*:*` 超级用户
 *
 * 用法：
 *   const grants = [{ permission_id: 'cimrms:request:write' }, ...]  // from DB
 *   const base = ['*:read']  // from ROLE_PERMISSIONS[user.global_role]
 *   const ok = hasPermission(user.role, grants, 'cimrms', 'request', 'write')
 *
 * @param grants 用户拥有的权限列表（来自 ROLE_PERMISSIONS 或 DB permission_grants）
 * @param resourceGroup 资源组（如 'cimrms'）
 * @param resourceName 资源名（如 'request'）
 * @param action 动作（如 'write'）
 */
export function hasPermission(
  grants: string[],
  resourceGroup: string,
  resourceName: string,
  action: string,
): boolean {
  const full = `${resourceGroup}:${resourceName}:${action}`
  const groupWildcard = `${resourceGroup}:*`
  const actionWildcard = `*:${action}`
  return (
    grants.includes(full) ||
    grants.includes(groupWildcard) ||
    grants.includes(actionWildcard) ||
    grants.includes('*:*') ||
    grants.includes(`${resourceGroup}:*:*`) // super-user for a namespace
  )
}

/**
 * 同 hasPermission，但无权限时抛 ForbiddenError
 */
export function requirePermission(
  grants: string[],
  resourceGroup: string,
  resourceName: string,
  action: string,
  user?: AuthUser | null,
): void {
  if (!hasPermission(grants, resourceGroup, resourceName, action)) {
    const msg = user
      ? `用户 ${user.email} 缺少 [${resourceGroup}:${resourceName}:${action}] 权限`
      : `缺少 [${resourceGroup}:${resourceName}:${action}] 权限`
    throw new ForbiddenError(msg)
  }
}

// ─── MDM 资源级权限查询 ─────────────────────────────────────────────────────────

/**
 * 查询 MDM permission_grants 表，检查用户是否有特定资源实例的操作权限
 *
 * permission_id 格式：`{group}:{resource}:{action}`
 *   例：cimrms:request:write、cimims:incident:admin、cim-perm:request:read
 *
 * resource_id 格式：资源实例 ID
 *   例：NC-2026-0001（cimrms）、IM-2026-0001（cimims）
 *
 * 用法（Fastify handler 内）：
 *   const grants = await checkResourcePermission(
 *     app.mdm,           // MdmClient 实例
 *     req.currentUser!, // AuthUser
 *     'cimrms',         // resourceGroup
 *     'request',        // resourceName
 *     'write',          // action
 *     requestNo,        // resourceId（实例 ID，如 NC-2026-0001）
 *   )
 *   if (!grants) throw new ForbiddenError('无资源操作权限')
 *
 * @param mdmClient 任何含 checkPermission() 方法的 MDM client 实例
 * @param user 当前用户（来自 req.currentUser）
 * @param resourceGroup 资源组（cimrms / cimims / cim-perm）
 * @param resourceName 资源类型（request / incident / permission）
 * @param action 操作（read / write / approve / admin / ...）
 * @param resourceId 资源实例 ID（用于查 DB grants；null 时只查资源类型级 grant）
 * @param logFn 可选日志函数
 * @returns 用户的 permission_id 列表；若 MDM 不可用则 fail-open（返回空数组，角色检查兜底）
 */
export async function checkResourcePermission(
  mdmClient: { checkPermission(params: { userEmail: string; resourceId: string; action: string }): Promise<PermissionCheckResult> },
  user: AuthUser,
  resourceGroup: string,
  resourceName: string,
  action: string,
  resourceId?: string | null,
  logFn?: (msg: string, meta?: Record<string, unknown>) => void,
): Promise<string[]> {
  const permissionId = `${resourceGroup}:${resourceName}:${action}`;

  try {
    const result = await mdmClient.checkPermission({
      userEmail: user.email,
      resourceId: resourceId ?? permissionId,
      action,
    });

    if (result.allowed) {
      logFn?.(`[checkResourcePermission] ${user.email} allowed for ${permissionId}`, {
        resourceId,
        permissions: result.permissions,
      });
    } else {
      logFn?.(`[checkResourcePermission] ${user.email} denied for ${permissionId}`, {
        resourceId,
        reason: result.reason,
      });
    }

    return result.allowed ? result.permissions : [];
  } catch (err) {
    // MDM 不可用时：fail open（角色检查已兜底）；warn 并降级
    logFn?.(`[checkResourcePermission] MDM unavailable, skipping resource-level check: ${(err as Error).message}`, {
      email: user.email,
      permissionId,
    });
    return [];
  }
}

// ─── 系统级角色权限表 ───────────────────────────────────────────────────────────

/**
 * 全局角色 → 系统级权限列表（不含资源特定权限）
 * 资源特定权限由 permission_grants 表管理
 */
export const GLOBAL_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin:   ['*:read', '*:write', '*:admin', 'audit:read', 'user:read', 'user:write'],
  auditor:  ['audit:read', '*:read'],
  editor:   ['*:read', '*:write'],
  viewer:   ['*:read'],
}

/**
 * 合并全局角色权限 + 用户个人 grant 列表
 */
export function mergePermissions(globalRole: string, grants: string[]): string[] {
  const base = GLOBAL_ROLE_PERMISSIONS[globalRole] ?? []
  return [...new Set([...base, ...grants])]
}
