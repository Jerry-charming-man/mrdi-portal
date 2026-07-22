/**
 * auth helpers — role-based UI gate utilities
 * 供 portal 各页面使用（不依赖后端 API）
 */
import { useAuthStore } from '../store/authStore'

export type GlobalRole = 'admin' | 'auditor' | 'editor' | 'viewer'

export function useRole() {
  const role = useAuthStore(s => s.user?.role ?? 'viewer')
  return {
    role,
    isAdmin:   role === 'admin',
    isAuditor: role === 'auditor' || role === 'admin',
    isEditor:  role === 'editor'  || role === 'auditor' || role === 'admin',
    isViewer:  true,   // everyone is at least viewer
  }
}

export const ROLE_LABELS: Record<GlobalRole, string> = {
  admin:   '管理员',
  auditor: '审计员',
  editor:  '编辑',
  viewer:  '访客',
}
