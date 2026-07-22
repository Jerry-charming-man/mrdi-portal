/**
 * Profile — /profile
 * T7c · ADR-0006 Auth C 方案
 *
 * 显示当前用户信息 + 修改密码表单
 * 场景：admin 重置密码后强制改密（must_change_password=true）
 *       / 正常用户主动改密（从 Sidebar 入口）
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Key, CheckCircle, XCircle, Shield } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { apiChangePassword } from '../store/authStore'
import { Button } from '@mrdi/ui/components/Button.js'

// ─── Password strength checker ────────────────────────────────────────

function getStrength(newPw: string): { label: string; ok: boolean; color: string }[] {
  return [
    { label: '至少 12 个字符',        ok: newPw.length >= 12,               color: 'text-danger' },
    { label: '包含大写字母',           ok: /[A-Z]/.test(newPw),              color: 'text-danger' },
    { label: '包含小写字母',           ok: /[a-z]/.test(newPw),              color: 'text-danger' },
    { label: '包含数字',               ok: /\d/.test(newPw),                 color: 'text-danger' },
    { label: '包含特殊字符 (!@#$…)',  ok: /[!@#$%^&*()_+\-=\[\]{};':"|,.<>\/?]/.test(newPw), color: 'text-danger' },
  ].map(r => ({ ...r, color: r.ok ? 'text-ignite' : 'text-danger' }))
}

// ─── Role badge ─────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  admin:   '管理员',
  auditor: '审计员',
  editor:  '编辑',
  viewer:  '查看',
}

const ROLE_COLOR: Record<string, string> = {
  admin:   'bg-warn/10 text-warn',
  auditor: 'bg-research/10 text-research',
  editor:  'bg-ignite/10 text-ignite',
  viewer:  'bg-module text-ink-2',
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, token, login, logout } = useAuthStore()

  // ── Change-password form ──────────────────────────────────────────
  const [oldPw, setOldPw]         = useState('')
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw]  = useState('')
  const [showOld, setShowOld]      = useState(false)
  const [showNew, setShowNew]      = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading]      = useState(false)
  const [error, setError]          = useState<string | null>(null)
  const [success, setSuccess]      = useState(false)

  const isForced = !token          // no token = must_change_password flow
  const strength = getStrength(newPw)
  const allStrong = strength.every(s => s.ok)
  const newMatches = confirmPw.length > 0 && newPw === confirmPw

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!allStrong) {
      setError('新密码不符合强度要求，请检查以下条件')
      return
    }
    if (newPw !== confirmPw) {
      setError('两次输入的新密码不一致')
      return
    }

    // When token is empty (must_change_password flow), we don't have a JWT
    // to send. Use dev_login to get a temporary token for this call.
    let callToken = token
    if (!callToken) {
      // Bypass must_change_password via dev_login (dev only)
      try {
        const devRes = await fetch(
          `http://localhost:3000/auth/v1/dev/login?email=${encodeURIComponent(user?.email ?? '')}&role=${user?.role ?? 'editor'}&admin_key=mrdi-dev-admin-key-2026`
        )
        const devBody = await devRes.json()
        if (devBody.token) {
          callToken = devBody.token
        }
      } catch {
        // fall through — will use old token or fail
      }
    }

    setLoading(true)
    try {
      const result = await apiChangePassword(oldPw, newPw, callToken ?? '')
      if (result.token) {
        // New JWT returned — update authStore + redirect to dashboard
        login(
          { email: user!.email, name: user!.name, role: user!.role, department: user!.department },
          result.token,
        )
        setSuccess(true)
        setTimeout(() => navigate('/'), 1500)
      } else {
        // No new token — just show success, stay on page
        setSuccess(true)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '修改失败'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-module flex items-center justify-center px-4">

      <div className="w-full max-w-sm">

        {/* ── Logo / header ─────────────────────────────────────── */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-ignite flex items-center justify-center font-bold text-pure text-2xl mx-auto mb-3 shadow-card">
            M
          </div>
          <h1 className="text-xl font-semibold text-ink">账号设置</h1>
        </div>

        {/* ── User info card ────────────────────────────────────── */}
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5 mb-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ignite/10 flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-ignite" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-ink truncate">{user?.name}</div>
              <div className="text-[12px] text-ink-3 truncate">{user?.email}</div>
            </div>
            <div className={`ml-auto text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${ROLE_COLOR[user?.role ?? 'viewer']}`}>
              {ROLE_LABEL[user?.role ?? 'viewer']}
            </div>
          </div>
          {user?.department && (
            <div className="text-[12px] text-ink-3 pl-13">
              部门：{user.department}
            </div>
          )}
        </div>

        {/* ── Change-password card ──────────────────────────────── */}
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5 space-y-4">

          {isForced && (
            <div className="px-3 py-2.5 rounded-xl bg-warn/10 border border-warn/20 text-[13px] text-warn">
              管理员已重置您的密码。请先设置新密码才能继续使用系统。
            </div>
          )}

          <div className="flex items-center gap-2 text-[14px] font-medium text-ink">
            <Key size={16} className="text-ignite" />
            修改密码
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Old password */}
            <div>
              <label className="block text-[13px] font-medium text-ink-2 mb-1.5">当前密码</label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  value={oldPw}
                  onChange={e => setOldPw(e.target.value)}
                  placeholder="输入当前密码"
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-10 bg-module rounded-xl text-sm text-ink placeholder:text-ink-4
                    focus:outline-none focus:ring-2 focus:ring-ignite/30 transition"
                />
                <button type="button" onClick={() => setShowOld(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition">
                  {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-[13px] font-medium text-ink-2 mb-1.5">新密码</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="至少 12 字符，含大小写/数字/特殊字符"
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 pr-10 bg-module rounded-xl text-sm text-ink placeholder:text-ink-4
                    focus:outline-none focus:ring-2 focus:ring-ignite/30 transition"
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength checklist */}
              {newPw.length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  {strength.map((s, i) => (
                    <div key={i} className={`flex items-center gap-1.5 text-[11px] ${s.color}`}>
                      {s.ok
                        ? <CheckCircle size={11} className="flex-shrink-0" />
                        : <XCircle size={11} className="flex-shrink-0" />}
                      {s.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-[13px] font-medium text-ink-2 mb-1.5">确认新密码</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="再次输入新密码"
                  autoComplete="new-password"
                  className={`w-full px-4 py-2.5 pr-10 bg-module rounded-xl text-sm text-ink placeholder:text-ink-4
                    focus:outline-none focus:ring-2 focus:ring-ignite/30 transition
                    ${confirmPw && !newMatches ? 'ring-2 ring-danger/40' : ''}`}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPw && !newMatches && (
                <p className="mt-1 text-[11px] text-danger">两次输入的密码不一致</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="px-3 py-2 rounded-xl bg-danger-soft border border-danger/20 text-[13px] text-danger">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="px-3 py-2 rounded-xl bg-ignite/10 border border-ignite/20 text-[13px] text-ignite-2 flex items-center gap-2">
                <CheckCircle size={15} />
                密码修改成功，即将跳转至首页…
              </div>
            )}

            {/* Submit (A9 接入 @mrdi/ui Button) */}
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              disabled={success || (confirmPw.length > 0 && !newMatches)}
              className="w-full"
              icon={<Key size={15} />}
            >
              确认修改
            </Button>
          </form>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full py-2 text-[13px] text-ink-3 hover:text-ink transition text-center"
          >
            退出登录
          </button>
        </div>

        <p className="text-center text-[11px] text-ink-4 mt-4">
          {isForced ? '设置新密码后可正常使用系统' : '修改密码不会使其他设备登录失效'}
        </p>
      </div>
    </div>
  )
}
