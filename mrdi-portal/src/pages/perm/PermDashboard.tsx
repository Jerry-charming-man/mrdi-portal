import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDashboard, getRequests, getAllAudits } from '../../services/permApi'
import { TYPE_DISTRIBUTION, PERM_AUDIT_TYPE } from '../../types/cimperm'

function getExpiryHours(expiresAt: string) {
  return Math.max(0, (new Date(expiresAt).getTime() - Date.now()) / 3600000)
}

function getExpiryColor(hours: number) {
  if (hours < 8) return 'border-l-danger'
  if (hours < 16) return 'border-l-warn'
  return 'border-l-ink-3'
}

function getExpiryBg(hours: number) {
  if (hours < 8) return 'bg-danger-soft/30'
  if (hours < 16) return 'bg-warn-soft/30'
  return 'bg-module/50'
}

function formatExpiryTag(hours: number) {
  if (hours < 24) return `${Math.round(hours)}h`
  return `${Math.round(hours / 24)}d`
}

export default function PermDashboard() {
  const [showRenew, setShowRenew] = useState<string | null>(null)

  const { data: dash } = useQuery({
    queryKey: ['perm', 'dashboard'],
    queryFn: getDashboard,
    refetchInterval: 30000,
  })

  const { data: expiringData } = useQuery({
    queryKey: ['perm', 'requests', 'expiring'],
    queryFn: () => getRequests({ view: 'expiring' }),
  })

  const { data: auditData } = useQuery({
    queryKey: ['perm', 'audits', 'recent'],
    queryFn: () => getAllAudits({ pageSize: 5 }),
  })

  const { data: requestsData } = useQuery({
    queryKey: ['perm', 'requests', 'mine'],
    queryFn: () => getRequests({ view: 'mine', pageSize: 100 }),
  })

  const grantedCount = dash?.granted ?? 0
  const openTodos = (dash?.pending_it ?? 0) + (dash?.pending_owner ?? 0) + (dash?.expiring_soon ?? 0)
  const weekGranted = dash?.week_granted ?? 0
  const weekRevoked = dash?.week_revoked ?? 0

  const expiringItems = expiringData?.data ?? []
  const recentAudits = auditData?.data ?? []
  const allRequests = requestsData?.data ?? []

  const myAppsCount = allRequests.length
  const myExpiring = expiringItems.length

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-[24px] font-semibold tracking-tight text-ink">权限概览</h2>
        <p className="text-[13px] text-ink-3 mt-1">
          你申请了 {myAppsCount} 项 · {myExpiring} 项即将过期 · {grantedCount} 项已授予
        </p>
      </div>

      {/* 4 KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* My todos */}
        <div className="bg-pure border border-progress rounded-2xl p-5 shadow-card kpi-card">
          <div className="text-[12px] text-ink-3 mb-2 font-medium">我的待办</div>
          <div className="text-[28px] font-semibold font-mono text-ink">{openTodos}</div>
          <div className="text-[11.5px] text-danger mt-1.5 flex items-center gap-1">
            {myExpiring > 0 && (
              <span className="tag-red px-1.5 py-0.5 rounded text-[10px] font-medium">{myExpiring} 项即将过期</span>
            )}
          </div>
        </div>
        {/* Granted */}
        <div className="bg-pure border border-progress rounded-2xl p-5 shadow-card kpi-card">
          <div className="text-[12px] text-ink-3 mb-2 font-medium">已授予（生效中）</div>
          <div className="text-[28px] font-semibold font-mono text-ink">{grantedCount}</div>
          <div className="text-[11.5px] text-ignite mt-1.5">↑ {weekGranted} 本周</div>
        </div>
        {/* Expiring soon */}
        <div className="bg-pure border border-progress rounded-2xl p-5 shadow-card kpi-card">
          <div className="text-[12px] text-ink-3 mb-2 font-medium">即将过期（24h）</div>
          <div className="text-[28px] font-semibold font-mono text-ink">{myExpiring}</div>
          <div className="text-[11.5px] text-danger mt-1.5">{myExpiring > 0 ? '需续期' : '—'}</div>
        </div>
        {/* Week grant/revoke */}
        <div className="bg-pure border border-progress rounded-2xl p-5 shadow-card kpi-card">
          <div className="text-[12px] text-ink-3 mb-2 font-medium">本周授予 / 回收</div>
          <div className="text-[28px] font-semibold font-mono text-ink">{weekGranted}<span className="text-[14px] text-ink-3">/</span>{weekRevoked}</div>
          <div className="text-[11.5px] text-ink-3 mt-1.5">
            {weekGranted + weekRevoked > 0
              ? `回收率 ${Math.round((weekRevoked / (weekGranted + weekRevoked)) * 100)}%`
              : '—'}
          </div>
        </div>
      </div>

      {/* Expiring soon + Type distribution */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left 7/12 — expiring items */}
        <div className="col-span-7 bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-ink">即将过期（24h 内）</h3>
            <Link to="/perm/expiring-soon" className="text-[12px] text-research font-medium hover:underline">查看全部 →</Link>
          </div>
          {expiringItems.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-ink-3">暂无即将过期的权限</div>
          ) : (
            <div className="space-y-2">
              {expiringItems.map(r => {
                const hours = getExpiryHours(r.expiresAt)
                return (
                  <div
                    key={r.id}
                    className={`p-3 rounded-lg border-l-4 ${getExpiryBg(hours)} ${getExpiryColor(hours)} flex items-center gap-3`}
                  >
                    <span className="tag-red px-1.5 py-0.5 rounded text-[10px] font-bold">🔴 {formatExpiryTag(hours)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-ink font-medium">{r.targetSystem} {r.resourceId.split(':').pop()}</div>
                      <div className="text-[11px] text-ink-3 mt-0.5">
                        {r.applicantName} · {r.requestedDuration} · {Math.round(hours)}h 后到期
                      </div>
                    </div>
                    <Link
                      to={`/perm/perm/${r.id}`}
                      className="px-3 py-1.5 rounded-lg border border-progress text-[12px] hover:bg-pure transition-colors"
                    >
                      续期
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right 5/12 — type distribution */}
        <div className="col-span-5 bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
          <h3 className="text-[14px] font-semibold text-ink mb-4">权限类型分布</h3>
          <div className="space-y-3">
            {TYPE_DISTRIBUTION.map(t => {
              const colorMap: Record<string, string> = {
                '系统访问': 'bg-research',
                '功能权限': 'bg-ignite',
                '数据导出': 'bg-pink',
                '临时权限': 'bg-warn',
                '批量权限': 'bg-indigo',
              }
              return (
                <div key={t.type}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="text-ink-2 font-medium">{t.type}</span>
                    <span className="font-mono text-ink-2">{t.pct}%</span>
                  </div>
                  <div className="h-2 bg-module rounded-full overflow-hidden">
                    <div className={`h-full ${colorMap[t.type] || 'bg-research'} rounded-full`} style={{ width: `${t.pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold text-ink">最近活动</h3>
          <Link to="/perm/audit" className="text-[12px] text-research hover:underline">审计日志 →</Link>
        </div>
        <div className="space-y-2">
          {recentAudits.length === 0 && (
            <div className="py-6 text-center text-[13px] text-ink-3">暂无最近活动</div>
          )}
          {recentAudits.map(a => {
            const evtCfg = PERM_AUDIT_TYPE[a.eventType] || PERM_AUDIT_TYPE.comment
            const req = allRequests.find(r => r.id === a.requestId)
            return (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-module/30">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-pure flex-shrink-0 ${(evtCfg.bg as string).replace('/10', '')}`}>
                  {evtCfg.label[0]}
                </div>
                <span className="text-[13px] text-ink flex-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] mr-1.5 ${evtCfg.bg} ${evtCfg.text}`}>{evtCfg.label}</span>
                  {a.actorName} · {req?.requestNo || a.requestId}
                </span>
                <span className="text-[11px] text-ink-3 font-mono">
                  {new Date(a.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Renew modal */}
      {showRenew && (
        <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50">
          <div className="bg-pure rounded-2xl p-6 w-[420px] shadow-xl border border-progress">
            <h3 className="text-[16px] font-bold text-ink mb-4">续期权限</h3>
            <p className="text-[13px] text-ink-3 mb-4">选择新的有效期：</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['7d', '30d', '90d'].map(d => (
                <button key={d}
                  onClick={() => setShowRenew(null)}
                  className="py-2.5 bg-module border border-progress rounded-lg text-[13px] text-ink hover:border-research hover:text-research transition-colors">
                  {d}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRenew(null)} className="flex-1 py-2.5 border border-progress rounded-lg text-[13px] hover:bg-module transition-colors">
                取消
              </button>
              <button onClick={() => setShowRenew(null)} className="flex-1 py-2.5 bg-research text-pure rounded-lg text-[13px] font-medium hover:bg-research/90 transition-colors">
                确认续期
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
