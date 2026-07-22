/**
 * MdmLoginAudit — S3-10 登录审计页面
 * 显示今日登录摘要 / 7天失败登录聚合 / 完整审计日志
 */
import { useState, useEffect, useCallback } from 'react'
import { listLoginAudit, getFailedLogins, getAuditSummary } from '../../services/mdm'
import type { AuditPage, FailedLoginSummary, AuditSummary } from '../../services/mdm'
import { useAuthStore } from '../../store/authStore'

const ACTION_LABELS: Record<string, string> = {
  'auth.login.success': '登录成功',
  'auth.login.fail': '登录失败',
  'auth.login.locked': '账号锁定',
  'auth.login.lock': '账号锁定',
  'auth.login.m365_mock': 'M365 模拟登录',
  'auth.password.changed': '密码修改',
  'auth.password.change.fail': '改密失败',
  'auth.password.reset': '管理员重置密码',
  'auth.user.unlocked': '账号解锁',
}

function actionColor(action: string): string {
  if (action.includes('fail') || action.includes('lock')) return 'text-danger'
  if (action.includes('success')) return 'text-success'
  if (action.includes('m365')) return 'text-indigo'
  return 'text-ink'
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m}m 前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h 前`
  return `${Math.floor(h / 24)}d 前`
}

export default function MdmLoginAudit() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const [summary, setSummary] = useState<AuditSummary | null>(null)
  const [failed, setFailed] = useState<FailedLoginSummary | null>(null)
  const [audit, setAudit] = useState<AuditPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchEmail, setSearchEmail] = useState('')
  const [page, setPage] = useState(1)

  const fetchAll = useCallback(async () => {
    if (!isAdmin) { setLoading(false); return }
    try {
      setError(null)
      const [s, f, a] = await Promise.all([
        getAuditSummary().catch(() => null),
        getFailedLogins().catch(() => null),
        listLoginAudit({ email: searchEmail || undefined, page, pageSize: 20 }).catch(() => null),
      ])
      setSummary(s)
      setFailed(f)
      setAudit(a)
    } catch {
      setError('加载失败，请刷新重试')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, searchEmail, page])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (!isAdmin) {
    return (
      <div className="px-8 py-16 text-center">
        <p className="text-ink-3">需要 admin 权限访问登录审计</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="px-8 py-16 text-center text-ink-3">
        <span className="pulse-dot text-ignite mr-2">●</span>加载中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-8 py-16 text-center">
        <p className="text-danger">{error}</p>
        <button onClick={fetchAll} className="mt-4 text-sm text-ignite underline">重试</button>
      </div>
    )
  }

  return (
    <div className="px-8 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">登录审计</h1>
          <p className="text-[13px] text-ink-3 mt-1">账号安全 · 实时监控</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-1.5 text-[12px] text-ink-3 px-3 py-1.5 bg-module rounded-lg hover:bg-progress/50 transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-ignite"></span>
          刷新
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '今日登录成功', value: summary?.successLogins ?? '—', color: 'text-success' },
          { label: '今日登录失败', value: summary?.failedLogins ?? '—', color: summary && (summary.failedLogins > 0) ? 'text-danger' : 'text-ink' },
          { label: '今日账号锁定', value: summary?.lockedAccounts ?? '—', color: summary && (summary.lockedAccounts > 0) ? 'text-danger' : 'text-ink' },
          { label: '活跃用户总数', value: summary?.totalActiveUsers ?? '—', color: 'text-ink' },
        ].map((k) => (
          <div key={k.label} className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5 text-center">
            <div className={`text-[28px] font-semibold font-mono ${k.color}`}>{k.value}</div>
            <div className="text-[11.5px] text-ink-3 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Failed logins warning */}
      {failed && failed.totalFailed > 0 && (
        <div className="bg-danger/5 border border-danger/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-danger font-semibold text-sm">⚠ 近期失败登录（{failed.period}）</span>
            <span className="text-xs bg-danger/10 text-danger px-2 py-0.5 rounded-full">{failed.totalFailed} 次</span>
          </div>
          <div className="space-y-2">
            {failed.byEmail.slice(0, 5).map((row) => (
              <div key={row.email} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-ink font-mono text-xs">{row.email}</span>
                  <span className="text-xs text-ink-3">{row.lastReason ?? '—'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-danger font-mono text-xs">{row.count} 次</span>
                  <span className="text-[11px] text-ink-3">{timeAgo(row.lastAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit log */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-progress/60">
          <span className="font-semibold text-sm text-ink">登录日志</span>
          <div className="flex items-center gap-2">
            <input
              value={searchEmail}
              onChange={e => { setSearchEmail(e.target.value); setPage(1) }}
              placeholder="搜索邮箱..."
              className="text-xs px-3 py-1.5 rounded-lg border border-progress bg-module focus:border-ignite outline-none transition-colors"
            />
          </div>
        </div>

        <div className="divide-y divide-progress/40">
          {audit?.items.length === 0 && (
            <div className="py-10 text-center text-[13px] text-ink-3">暂无记录</div>
          )}
          {audit?.items.map((r) => (
            <div key={r.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-module/50 transition-colors">
              {/* Action badge */}
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                actionColor(r.action).includes('danger') ? 'bg-danger/10 text-danger' :
                actionColor(r.action).includes('success') ? 'bg-success/10 text-success' :
                'bg-module text-ink-3'
              }`}>
                {ACTION_LABELS[r.action] ?? r.action}
              </span>
              {/* Email */}
              <span className="text-[13px] text-ink font-mono flex-1 min-w-0 truncate">{r.actorEmail}</span>
              {/* Detail */}
              {r.metadata && (
                <span className="text-[11px] text-ink-3 hidden md:block flex-1 min-w-0 truncate">
                  {JSON.stringify(r.metadata)}
                </span>
              )}
              {/* Time */}
              <span className="text-[11px] text-ink-3 shrink-0">{timeAgo(r.createdAt)}</span>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {audit && audit.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-progress/60">
            <span className="text-[12px] text-ink-3">
              共 {audit.pagination.total} 条 · 第 {audit.pagination.page} / {audit.pagination.totalPages} 页
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-xs px-3 py-1 rounded-lg border border-progress disabled:opacity-40 hover:bg-module transition-colors"
              >上一页</button>
              <button
                onClick={() => setPage(p => Math.min(audit.pagination.totalPages, p + 1))}
                disabled={page === audit.pagination.totalPages}
                className="text-xs px-3 py-1 rounded-lg border border-progress disabled:opacity-40 hover:bg-module transition-colors"
              >下一页</button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
