import { useState, useEffect } from 'react'
import { getUsers, type ListUsersResult, adminUnlock, adminResetPassword, adminChangePassword, type MdmUser } from '../../services/mdm'
import { useAuthStore, showToast } from '../../store/authStore'
import { Button } from '@mrdi/ui'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(isoStr: string): string {
  if (!isoStr) return '—'
  try {
    const diff = Date.now() - new Date(isoStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '刚刚'
    if (mins < 60) return `${mins}min 前`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h 前`
    const days = Math.floor(hrs / 24)
    if (days < 30) return `${days}d 前`
    return `${Math.floor(days / 30)}mo 前`
  } catch {
    return '—'
  }
}

// ── Role display ──────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  'mdm-admin':    'bg-ink text-pure',
  'mdm-editor':   'bg-ignite/10 text-ignite-2',
  'mdm-viewer':   'bg-module text-ink-3',
  'mdm-auditor':  'bg-research/10 text-research',
}

const ROLE_LABELS: Record<string, string> = {
  'mdm-admin':    'admin',
  'mdm-editor':   'editor',
  'mdm-viewer':   'viewer',
  'mdm-auditor':  'auditor',
}

const SYS_COLORS: Record<string, string> = {
  'RMS':  'bg-research/10 text-research',
  'IMS':  'bg-indigo/10 text-indigo',
  'MDM':  'bg-ignite/10 text-ignite',
}

function Avatar({ name }: { name: string }) {
  const grads: Record<string, string> = {
    '张': 'from-ignite to-ignite-deep', '陈': 'from-research to-indigo', '李': 'from-warn to-pink',
    '林': 'from-ink-3 to-ink-4', '赵': 'from-indigo to-research', '孙': 'from-success to-ignite',
    '周': 'from-ignite-dim to-flash', '吴': 'from-danger to-pink',
  }
  const g = Object.entries(grads).find(([k]) => name.includes(k))?.[1] || 'from-ink-3 to-ink-4'
  return (
    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${g} flex items-center justify-center text-[11px] font-semibold text-pure`}>
      {name.slice(0, 1)}
    </div>
  )
}

// ── Password strength checker ────────────────────────────────────────────────
const PWD_RULES = [
  { id: 'len',    label: '≥ 12 字符',      test: (p: string) => p.length >= 12 },
  { id: 'upper', label: '包含大写字母',     test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower', label: '包含小写字母',     test: (p: string) => /[a-z]/.test(p) },
  { id: 'digit', label: '包含数字',         test: (p: string) => /\d/.test(p) },
  { id: 'spec',  label: '包含特殊字符',     test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};': "\\|,.<>\/?]/.test(p) },
]

function genTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function MdmUsers() {
  const { user: currentUser } = useAuthStore()
  const isAdmin = currentUser?.role === 'admin'

  const [users, setUsers] = useState<MdmUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [grantModal, setGrantModal] = useState(false)
  const [grantUser, setGrantUser] = useState<MdmUser | null>(null)
  const [grantRole, setGrantRole] = useState<string>('mdm-editor')

  // ── Admin dialogs ─────────────────────────────────────────────────────────
  const [unlockTarget,  setUnlockTarget]  = useState<MdmUser | null>(null)
  const [resetTarget,    setResetTarget]  = useState<MdmUser | null>(null)
  const [changeTarget,   setChangeTarget] = useState<MdmUser | null>(null)
  const [unlockLoading,  setUnlockLoading]  = useState(false)
  const [resetLoading,   setResetLoading]  = useState(false)
  const [changeLoading,  setChangeLoading] = useState(false)

  // Reset password form
  const [resetPwd,     setResetPwd]     = useState('')
  const [resetPwdShow,  setResetPwdShow]  = useState(false)
  const resetRules = PWD_RULES.map(r => ({ ...r, ok: r.test(resetPwd) }))

  // Change password form
  const [changePwd,    setChangePwd]    = useState('')
  const [changePwdShow, setChangePwdShow] = useState(false)
  const changeRules = PWD_RULES.map(r => ({ ...r, ok: r.test(changePwd) }))

  // ── Load users from API ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getUsers({ search: search || undefined, pageSize: 100 })
      .then((result: ListUsersResult) => {
        if (!cancelled) {
          setUsers(result.data)
          setTotal(result.total)
          setLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message ?? '加载失败')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [search])

  // ── Client-side search filter ─────────────────────────────────────────────
  const filtered = search
    ? users.filter(u =>
        u.name.includes(search) ||
        u.email.includes(search) ||
        u.department.includes(search)
      )
    : users

  const openGrant = (user: MdmUser) => {
    setGrantUser(user)
    setGrantRole('mdm-editor')
    setGrantModal(true)
  }

  const confirmGrant = () => {
    showToast(`已赋予 ${grantUser?.name} [${ROLE_LABELS[grantRole] ?? grantRole}] 角色`, 'success')
    setGrantModal(false)
  }

  // ── Admin action handlers ─────────────────────────────────────────────────

  const handleUnlock = async () => {
    if (!unlockTarget) return
    setUnlockLoading(true)
    try {
      const { message } = await adminUnlock(unlockTarget.email)
      showToast(message, 'success')
      // Refresh list
      setLoading(true)
      const result = await getUsers({ pageSize: 100 })
      setUsers(result.data); setTotal(result.total); setLoading(false)
    } catch (e: unknown) {
      showToast((e as Error).message ?? '解锁失败', 'error')
    } finally {
      setUnlockLoading(false)
      setUnlockTarget(null)
    }
  }

  const handleResetPassword = async () => {
    if (!resetTarget || !resetRules.every(r => r.ok)) return
    setResetLoading(true)
    try {
      const { message } = await adminResetPassword(resetTarget.email, resetPwd)
      showToast(message, 'success')
      setResetPwd(''); setResetTarget(null)
    } catch (e: unknown) {
      showToast((e as Error).message ?? '重置密码失败', 'error')
    } finally {
      setResetLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!changeTarget || !changeRules.every(r => r.ok)) return
    setChangeLoading(true)
    try {
      const { message } = await adminChangePassword(changeTarget.id, changePwd)
      showToast(message, 'success')
      setChangePwd(''); setChangeTarget(null)
    } catch (e: unknown) {
      showToast((e as Error).message ?? '修改密码失败', 'error')
    } finally {
      setChangeLoading(false)
    }
  }

  return (
    <div className="px-8 py-6 space-y-5">

      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">用户管理</h1>
          <p className="text-[13px] text-ink-3 mt-1">
            {loading ? '加载中…' : `${total.toLocaleString()} 个用户 · 通过 MDM 管理`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSearch('')
              setLoading(true)
              getUsers({ pageSize: 100 }).then(r => { setUsers(r.data); setTotal(r.total); setLoading(false) }).catch(() => setLoading(false))
            }}
            className="px-3.5 py-2 rounded-lg border border-progress text-[13px] hover:bg-module flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            刷新
          </button>
          <button className="px-3.5 py-2 rounded-lg border border-progress text-[13px] hover:bg-module flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            导出 CSV
          </button>
        </div>
      </div>

      {/* Error notice */}
      {error && (
        <div className="px-4 py-3 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3 text-[13px]">
          <svg className="w-4 h-4 text-danger flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span className="text-ink-2">加载失败：{error}</span>
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-pure rounded-xl border border-progress/60 px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="搜邮箱 / 姓名 / 部门…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 bg-module rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30"
          />
        </div>
        {['角色 ▾', '部门 ▾', '系统 ▾', '状态 ▾'].map((label) => (
          <button key={label} className="px-3 py-1.5 bg-module rounded-lg text-[12.5px] flex items-center gap-1.5 hover:bg-progress transition-colors">
            {label}
          </button>
        ))}
        {search && (
          <button onClick={() => setSearch('')} className="ml-auto text-[12px] text-ignite font-medium hover:underline">
            清空筛选
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
        {loading && !users.length ? (
          <div className="text-center py-16 text-ink-3 text-[13px]">
            <svg className="w-6 h-6 mx-auto mb-2 animate-spin text-ignite" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            加载中…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-ink-3 text-[13px]">未找到匹配的用户</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-module text-ink-3 text-[11.5px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left font-medium w-8"><input type="checkbox" className="accent-ignite" /></th>
                <th className="px-4 py-3 text-left font-medium">姓名</th>
                <th className="px-4 py-3 text-left font-medium">邮箱</th>
                <th className="px-4 py-3 text-left font-medium">部门</th>
                <th className="px-4 py-3 text-left font-medium">全局角色</th>
                <th className="px-4 py-3 text-left font-medium">系统访问</th>
                <th className="px-4 py-3 text-left font-medium">状态</th>
                <th className="px-4 py-3 text-left font-medium">最后活跃</th>
                <th className="px-4 py-3 text-left font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-progress">
              {filtered.map((user) => (
                <tr key={user.email} className="row-hover cursor-pointer">
                  <td className="px-4 py-3"><input type="checkbox" className="accent-ignite" onClick={(e) => e.stopPropagation()} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={user.name} />
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-ink-2">{user.email}</td>
                  <td className="px-4 py-3 text-ink-2">{user.department || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.length > 0 ? user.roles.map((role) => (
                        <span key={role} className={`px-2 py-0.5 rounded text-[10.5px] font-medium ${ROLE_COLORS[role] ?? 'bg-module text-ink-3'}`}>
                          {ROLE_LABELS[role] ?? role}
                        </span>
                      )) : (
                        <span className="px-2 py-0.5 rounded text-[10.5px] bg-module text-ink-3">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {user.systemAccess.length > 0 ? user.systemAccess.map((s) => (
                        <span key={s} className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${SYS_COLORS[s] ?? 'bg-module text-ink-3'}`}>{s}</span>
                      )) : (
                        <span className="text-[12px] text-ink-3">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        user.status === 'Active' ? 'bg-success' : user.status === 'Idle' ? 'bg-warn' : 'bg-danger'
                      }`}></span>
                      <span className="text-ink-2">
                        {user.status === 'Idle' && user.idleDays ? `Idle ${user.idleDays}d` : user.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-3 font-mono text-[12px]">
                    {user.lastActive ? formatRelativeTime(user.lastActive) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <>
                          {/* Unlock */}
                          <button
                            onClick={(e) => { e.stopPropagation(); setUnlockTarget(user) }}
                            className="text-[12px] hover:underline disabled:opacity-40 disabled:cursor-default"
                            style={{ color: user.status === 'Suspended' ? '#EF60A3' : '#9CA3AF' }}
                            disabled={user.status !== 'Suspended'}
                            title={user.status === 'Suspended' ? '解锁账号' : ''}
                          >
                            解锁
                          </button>
                          {/* Reset password */}
                          <button
                            onClick={(e) => { e.stopPropagation(); setResetTarget(user) }}
                            className="text-[12px] text-warn hover:underline"
                            title="重置密码（强制改密）"
                          >
                            重置密码
                          </button>
                          {/* Change password */}
                          <button
                            onClick={(e) => { e.stopPropagation(); setChangeTarget(user) }}
                            className="text-ignite font-medium hover:underline text-[12.5px]"
                          >
                            改密
                          </button>
                        </>
                      )}
                      {!isAdmin && (
                        <button
                          onClick={(e) => { e.stopPropagation(); openGrant(user) }}
                          className="text-ignite font-medium hover:underline text-[12.5px]"
                        >
                          赋予角色
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length > 0 && total > filtered.length && (
          <div className="px-4 py-3 text-center text-[12px] text-ink-3 border-t border-progress">
            显示 {filtered.length} / {total.toLocaleString()} 个用户（输入关键字可进一步筛选）
          </div>
        )}
      </div>

      {/* ── Unlock Modal ────────────────────────────────────────────── */}
      {unlockTarget && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center" onClick={() => setUnlockTarget(null)}>
          <div className="bg-pure rounded-2xl shadow-card-hover w-[420px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-danger" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-8V6a2 2 0 10-4 0v2m-2 4h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-ink">解锁账号</h3>
                <p className="text-[12px] text-ink-3 mt-0.5">清除锁定状态，用户可立即重新登录</p>
              </div>
            </div>

            <div className="mb-5 px-4 py-3 bg-danger/5 border border-danger/15 rounded-xl">
              <div className="text-[13px] font-medium text-ink mb-1">{unlockTarget.name}</div>
              <div className="text-[12px] font-mono text-ink-3">{unlockTarget.email}</div>
            </div>

            <div className="mb-5 text-[13px] text-ink-2">
              解锁后，该账号将立即恢复正常，可以尝试登录。
              连续 <strong className="text-ink">5 次</strong> 密码错误仍会触发新的 15 分钟锁定。
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setUnlockTarget(null)}>取消</Button>
              <Button variant="primary" size="sm" loading={unlockLoading} onClick={handleUnlock}>
                确认解锁
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ───────────────────────────────────── */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center" onClick={() => { setResetTarget(null); setResetPwd('') }}>
          <div className="bg-pure rounded-2xl shadow-card-hover w-[460px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-warn/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-warn" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-ink">重置密码</h3>
                <p className="text-[12px] text-ink-3 mt-0.5">强制改密 · 用户下次登录必须设置新密码</p>
              </div>
            </div>

            <div className="mb-4 px-3 py-2 bg-module rounded-lg text-[13px]">
              <span className="text-ink-3">目标用户：</span>
              <span className="font-mono text-ink ml-1">{resetTarget.email}</span>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12px] text-ink-3">新密码（由管理员设置）</label>
                <button onClick={() => setResetPwdShow(v => !v)} className="text-[11px] text-ignite hover:underline">
                  {resetPwdShow ? '隐藏' : '显示'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={resetPwdShow ? 'text' : 'password'}
                  value={resetPwd}
                  onChange={(e) => setResetPwd(e.target.value)}
                  placeholder="输入管理员设定的新密码"
                  className="w-full px-3 py-2.5 bg-module rounded-lg text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-ignite/30 pr-20"
                />
                <button
                  onClick={() => { const p = genTempPassword(); setResetPwd(p); setResetPwdShow(true) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-ignite hover:underline whitespace-nowrap"
                >
                  生成随机
                </button>
              </div>
            </div>

            {/* Password strength rules */}
            <div className="mb-5 space-y-1">
              {resetRules.map(rule => (
                <div key={rule.id} className="flex items-center gap-2 text-[12px]">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${rule.ok ? 'bg-success text-pure' : 'bg-progress text-ink-4'}`}>
                    {rule.ok ? '✓' : '·'}
                  </span>
                  <span className={rule.ok ? 'text-success' : 'text-ink-4'}>{rule.label}</span>
                </div>
              ))}
            </div>

            <div className="mb-5 text-[12px] text-warn/80 bg-warn/5 border border-warn/15 rounded-lg px-3 py-2">
              ⚠️ 重置后，用户下次登录时<strong>强制要求改密</strong>，旧密码立即失效。
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setResetTarget(null); setResetPwd('') }}>取消</Button>
              <Button
                variant="primary"
                size="sm"
                loading={resetLoading}
                disabled={!resetRules.every(r => r.ok)}
                onClick={handleResetPassword}
              >
                确认重置
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ───────────────────────────────────── */}
      {changeTarget && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center" onClick={() => { setChangeTarget(null); setChangePwd('') }}>
          <div className="bg-pure rounded-2xl shadow-card-hover w-[460px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-ignite/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-ignite" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-ink">修改密码</h3>
                <p className="text-[12px] text-ink-3 mt-0.5">直接设置新密码（不清除改密标记）</p>
              </div>
            </div>

            <div className="mb-4 px-3 py-2 bg-module rounded-lg text-[13px]">
              <span className="text-ink-3">目标用户：</span>
              <span className="font-mono text-ink ml-1">{changeTarget.email}</span>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12px] text-ink-3">新密码</label>
                <button onClick={() => setChangePwdShow(v => !v)} className="text-[11px] text-ignite hover:underline">
                  {changePwdShow ? '隐藏' : '显示'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={changePwdShow ? 'text' : 'password'}
                  value={changePwd}
                  onChange={(e) => setChangePwd(e.target.value)}
                  placeholder="输入新密码"
                  className="w-full px-3 py-2.5 bg-module rounded-lg text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-ignite/30 pr-20"
                />
                <button
                  onClick={() => { const p = genTempPassword(); setChangePwd(p); setChangePwdShow(true) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-ignite hover:underline whitespace-nowrap"
                >
                  生成随机
                </button>
              </div>
            </div>

            {/* Password strength rules */}
            <div className="mb-5 space-y-1">
              {changeRules.map(rule => (
                <div key={rule.id} className="flex items-center gap-2 text-[12px]">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${rule.ok ? 'bg-success text-pure' : 'bg-progress text-ink-4'}`}>
                    {rule.ok ? '✓' : '·'}
                  </span>
                  <span className={rule.ok ? 'text-success' : 'text-ink-4'}>{rule.label}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setChangeTarget(null); setChangePwd('') }}>取消</Button>
              <Button
                variant="primary"
                size="sm"
                loading={changeLoading}
                disabled={!changeRules.every(r => r.ok)}
                onClick={handleChangePassword}
              >
                确认修改
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Grant Role Modal */}
      {grantModal && grantUser && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center" onClick={() => setGrantModal(false)}>
          <div className="bg-pure rounded-2xl shadow-card-hover w-[480px] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-ink mb-5">赋予角色</h3>

            <div className="mb-4">
              <label className="text-[12px] text-ink-3 mb-1 block">目标用户</label>
              <div className="px-3 py-2 bg-module rounded-lg text-[13px] text-ink-2 font-mono">{grantUser.email}</div>
            </div>

            <div className="mb-4">
              <label className="text-[12px] text-ink-3 mb-2 block">角色 *</label>
              <div className="space-y-2">
                {(['mdm-admin', 'mdm-editor', 'mdm-viewer', 'mdm-auditor'] as string[]).map((role) => {
                  const roleLabels: Record<string, string> = {
                    'mdm-admin':   'mdm-admin · MDM 系统管理员',
                    'mdm-editor':  'mdm-editor · 读写用户/资源',
                    'mdm-viewer':  'mdm-viewer · 只读',
                    'mdm-auditor': 'mdm-auditor · 审计',
                  }
                  return (
                    <label key={role} className="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer hover:bg-module transition-colors"
                      onClick={() => setGrantRole(role)}>
                      <input type="radio" name="grantRole" checked={grantRole === role} onChange={() => setGrantRole(role)} className="accent-ignite" />
                      <div>
                        <div className="text-[13px] font-medium text-ink">{roleLabels[role] ?? role}</div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="mb-5">
              <label className="text-[12px] text-ink-3 mb-1 block">备注（可选）</label>
              <textarea className="w-full px-3 py-2 bg-module rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 resize-none h-20" placeholder="可选备注…" />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setGrantModal(false)} className="px-4 py-2 rounded-lg border border-progress text-[13px] hover:bg-module">取消</button>
              <button onClick={confirmGrant} className="px-5 py-2 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2">确认赋予</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-4 py-4 border-t border-progress text-[11.5px] text-ink-3 flex items-center justify-between">
        <div>MRDI · MDM · 主数据管理子系统 v2.2</div>
        <div className="flex items-center gap-4"><span>Build 2026.07.16</span></div>
      </footer>
    </div>
  )
}
