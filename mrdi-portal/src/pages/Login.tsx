/**
 * Login — MRDI Portal 登录页
 *
 * T4 · ADR-0006 Auth C 方案
 * ┌─────────────────────────────────────────┐
 * │  M365 SSO 按钮（主入口 · prod 行为）     │
 * │  ── or ─────────────────────────────── │
 * │  [展开] 账号密码登录（dev 应急）         │
 * └─────────────────────────────────────────┘
 *
 * M365 OAuth mock flow（dev）：
 *   点击按钮 → GET /auth/v1/m365/authorize → { code }
 *           → POST /auth/v1/m365/callback { code }
 *           → { token, user } → authStore → navigate('/')
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { apiLogin, apiM365Callback, useAuthStore } from '../store/authStore'
import { Button } from '@mrdi/ui/components/Button.js'

// Microsoft logo SVG (official brand)
const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.5" y="9.5" width="9.5" height="9.5" fill="#F25022"/>
    <rect x="10.5" y="9.5" width="9.5" height="9.5" fill="#7FBA00"/>
    <rect x="0.5" y="0.5" width="9.5" height="9.5" fill="#00A4EF"/>
    <rect x="10.5" y="0.5" width="9.5" height="9.5" fill="#FFB900"/>
  </svg>
)

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)

  // ── Credentials form state ───────────────────────────────────────────
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [showCreds, setShowCreds] = useState(false)   // collapsed by default
  const [loadingCreds, setLoadingCreds] = useState(false)
  const [loadingM365, setLoadingM365]   = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── M365 OAuth mock flow（T4 · ADR-0006）─────────────────────────────
  const handleM365Login = async () => {
    setLoadingM365(true)
    setError(null)
    try {
      // Step 1: GET /auth/v1/m365/authorize → get code
      const authRes = await fetch('http://localhost:3000/auth/v1/m365/authorize', {
        method: 'GET',
        credentials: 'include',
      })
      const authBody = await authRes.json()
      if (!authRes.ok || !authBody.code) {
        throw new Error(authBody?.error?.message ?? t('login.m365AuthFailed'))
      }

      // Step 2: POST /auth/v1/m365/callback { code } → JWT + user
      const cbResult = await apiM365Callback(authBody.code)

      // Step 3: Store JWT → redirect
      login(
        { email: cbResult.email, name: cbResult.name, role: cbResult.role, department: cbResult.department },
        cbResult.token,
      )
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.m365Failed'))
    } finally {
      setLoadingM365(false)
    }
  }

  // ── Credentials login ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError(t('login.enterCredentials')); return }
    setLoadingCreds(true)
    setError(null)
    try {
      const user = await apiLogin(email, password)
      if (user.token) {
        login(user, user.token)
        navigate('/')
      } else {
        // must_change_password=true → redirect to profile/change-password
        login(user, '')
        navigate('/profile')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('login.loginFailed')
      setError(msg)
    } finally {
      setLoadingCreds(false)
    }
  }

  return (
    <div className="min-h-screen bg-module flex items-center justify-center px-4">

      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-ignite flex items-center justify-center font-bold text-pure text-2xl mx-auto mb-3 shadow-card">
            M
          </div>
          <h1 className="text-xl font-semibold text-ink">{t('login.title')}</h1>
          <p className="text-sm text-ink-3 mt-1">{t('login.subtitle')}</p>
        </div>

        {/* Card */}
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6 space-y-4">

          {/* ── M365 SSO Button（主入口 · A9 接入 @mrdi/ui Button）──── */}
          <Button
            variant="primary"
            onClick={handleM365Login}
            loading={loadingM365}
            disabled={loadingCreds}
            className="w-full"
            icon={!loadingM365 ? <MicrosoftIcon /> : undefined}
          >
            {t('login.m365Login')}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-progress/40" />
            </div>
            <div className="relative flex justify-center">
              <button
                onClick={() => setShowCreds(v => !v)}
                className="px-3 bg-pure text-[12px] text-ink-3 hover:text-ink transition flex items-center gap-1"
              >
                {showCreds ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {showCreds ? t('login.hidePasswordLogin') : t('login.showPasswordLogin')}
              </button>
            </div>
          </div>

          {/* ── Credentials Form（可折叠）───────────────────────────── */}
          {showCreds && (
            <form onSubmit={handleSubmit} className="space-y-3 animate-in slide-in-from-top-1 duration-200">

              {/* Email */}
              <div>
                <label className="block text-[13px] font-medium text-ink-2 mb-1.5">{t('login.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                  className="w-full px-4 py-2.5 bg-module rounded-xl text-sm text-ink placeholder:text-ink-4
                    focus:outline-none focus:ring-2 focus:ring-ignite/30 transition"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[13px] font-medium text-ink-2 mb-1.5">{t('login.password')}</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full px-4 py-2.5 pr-10 bg-module rounded-xl text-sm text-ink placeholder:text-ink-4
                      focus:outline-none focus:ring-2 focus:ring-ignite/30 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="px-3 py-2 rounded-xl bg-danger-soft border border-danger/20 text-[13px] text-danger">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loadingCreds || loadingM365}
                className="w-full py-2.5 bg-ignite text-pure rounded-xl font-medium text-sm
                  hover:bg-ignite-2 active:bg-ignite-deep transition flex items-center justify-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingCreds ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    <LogIn size={15} />
                    {t('login.login')}
                  </>
                )}
              </button>
            </form>
          )}

          {/* Error (M365 errors show here too) */}
          {error && !showCreds && (
            <div className="px-3 py-2 rounded-xl bg-danger-soft border border-danger/20 text-[13px] text-danger">
              {error}
            </div>
          )}
        </div>

        {/* Dev hint */}
        <p className="text-center text-[11px] text-ink-4 mt-4">
          {t('login.devHint')}
        </p>
      </div>
    </div>
  )
}
