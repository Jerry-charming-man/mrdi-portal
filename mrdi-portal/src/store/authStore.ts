/**
 * authStore — 全局认证状态
 * JWT 登录 → 存 email / name / role / department + token + unread notification count
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getUnreadCount } from '../services/mdm'

export interface AuthUser {
  email: string
  name: string
  role: 'admin' | 'auditor' | 'editor' | 'viewer'
  department: string
}

interface AuthStore {
  user: AuthUser | null
  token: string | null
  unreadCount: number
  login: (user: AuthUser, token: string) => void
  logout: () => void
  refreshUnreadCount: () => Promise<void>
  decrementUnread: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      unreadCount: 0,

      login: async (user, token) => {
        set({ user, token, unreadCount: 0 })
        // Fetch unread count after login
        try {
          const count = await getUnreadCount()
          set({ unreadCount: count })
        } catch {
          // non-blocking — notification API might fail silently
        }
      },

      logout: () => set({ user: null, token: null, unreadCount: 0 }),

      refreshUnreadCount: async () => {
        try {
          const count = await getUnreadCount()
          set({ unreadCount: count })
        } catch {
          // non-blocking
        }
      },

      decrementUnread: () => set(s => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
    }),
    {
      name: 'mrdi-auth',        // localStorage key
      partialize: (s) => ({ user: s.user, token: s.token, unreadCount: s.unreadCount }),
    },
  ),
)

// ─── API helpers ───────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string): Promise<AuthUser & { token: string }> {
  const res = await fetch('http://localhost:3000/auth/v1/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = await res.json()
  if (!res.ok) {
    const msg = body?.error?.message ?? body?.message ?? `HTTP ${res.status}`
    throw new Error(msg)
  }
  if (body.requirePasswordChange) {
    // must_change_password=true: token=null, user is valid, redirect to change-password
    const payload = JSON.parse(atob(body.token ?? 'eyJhbGciOiJIUzI1NiJ9').split('.')[1] ?? '{}')
    return {
      email: payload.email ?? body.user?.email ?? email,
      name: payload.name ?? body.user?.name ?? '',
      role: payload.role ?? body.user?.role ?? 'editor',
      department: payload.department ?? body.user?.department ?? '',
      token: '', // null — no JWT until password changed
    }
  }
  if (!body.token) throw new Error('服务器未返回 token')
  // Decode JWT payload (no signature check — dev only)
  const payload = JSON.parse(atob(body.token.split('.')[1]))
  return {
    email: payload.email,
    name: payload.name,
    role: payload.role,
    department: payload.department,
    token: body.token,
  }
}

/**
 * M365 OAuth mock callback — T4 · ADR-0006
 * 1. GET /auth/v1/m365/authorize?email=xxx → { code }
 * 2. POST /auth/v1/m365/callback { code } → { token, user }
 */

/**
 * Change password — T7c · ADR-0006
 * POST /auth/v1/change-password
 * Sends current JWT in Authorization header.
 * On success: returns new JWT → update authStore.
 */
export async function apiChangePassword(
  oldPassword: string,
  newPassword: string,
  token: string,
): Promise<{ message: string; token?: string }> {
  const res = await fetch('http://localhost:3000/auth/v1/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  })
  const body = await res.json()
  if (!res.ok) {
    const msg = body?.error?.message ?? body?.message ?? `HTTP ${res.status}`
    throw new Error(msg)
  }
  // Backend returns { message, token } on success
  return body
}
export async function apiM365Callback(code: string): Promise<AuthUser & { token: string }> {
  const res = await fetch('http://localhost:3000/auth/v1/m365/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  const body = await res.json()
  if (!res.ok) {
    const msg = body?.error?.message ?? body?.message ?? `HTTP ${res.status}`
    throw new Error(msg)
  }
  if (!body.token) throw new Error('服务器未返回 token')
  const payload = JSON.parse(atob(body.token.split('.')[1]))
  return {
    email: payload.email,
    name: payload.name,
    role: payload.role,
    department: payload.department,
    token: body.token,
  }
}

// ─── Global toast helper ─────────────────────────────────────────────────

export function showToast(msg: string, type: 'info' | 'success' | 'error' = 'info') {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type } }))
}

// ─── API error handler (403 → toast, 401 → redirect to login) ─────────────

export async function handleApiError(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }))
  const msg = body?.error?.message ?? `HTTP ${res.status}`

  if (res.status === 401) {
    showToast('登录已过期，请重新登录', 'error')
    // Redirect to login after short delay
    setTimeout(() => { window.location.href = '/login' }, 1000)
    throw new Error(msg)
  }
  if (res.status === 403) {
    showToast(`权限不足：${msg}`, 'error')
    throw new Error(msg)
  }
  showToast(msg, 'error')
  throw new Error(msg)
}
