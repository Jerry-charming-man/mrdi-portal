import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getDashboard, getIncidents } from '../../services/cimims'
import { INCIDENT_URGENCY } from '../../types/cimims'
import { useWebSocket } from '../../hooks/useWebSocket'

const IMS_WS_URL = `ws://localhost:3002/v1/ws`

// Color map for type distribution
const TYPE_COLOR: Record<string, string> = {
  system: 'bg-research',
  network: 'bg-ignite',
  account: 'bg-pink',
  equipment: 'bg-indigo',
  other: 'bg-ink-3',
}

const TYPE_LABEL: Record<string, string> = {
  system: '系统故障',
  network: '网络问题',
  account: '账号问题',
  equipment: '设备关联',
  other: '其他',
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const cfg = INCIDENT_URGENCY[urgency as keyof typeof INCIDENT_URGENCY] || INCIDENT_URGENCY.P3
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-pure font-mono ${cfg.bg}`}>{cfg.code}</span>
}

export default function CimimsDashboard() {
  const queryClient = useQueryClient()

  // WebSocket real-time KPI + alarm push（S3-7）
  const { status: wsStatus } = useWebSocket(IMS_WS_URL, {
    events: {
      'kpi:ims:update': () => {
        queryClient.invalidateQueries({ queryKey: ['cimims', 'dashboard'] })
        queryClient.invalidateQueries({ queryKey: ['cimims', 'incidents'] })
      },
      'alarm:ims:new': (data) => {
        const payload = data as { alarms: Array<{ incidentNo: string; urgency: string; title: string }>; count: number }
        queryClient.invalidateQueries({ queryKey: ['cimims', 'incidents'] })
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            msg: `🚨 新增 ${payload.count} 个 P1/P2 告警（${payload.alarms[0]?.incidentNo ?? ''}）`,
            type: 'error',
          },
        }))
      },
    },
  })

  const [now, setNow] = useState(() => {
    const d = new Date()
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return {
      date: `${d.getMonth() + 1}/${d.getDate()} ${dayNames[d.getDay()]}`,
      time: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,
    }
  })
  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date()
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      setNow({
        date: `${d.getMonth() + 1}/${d.getDate()} ${dayNames[d.getDay()]}`,
        time: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,
      })
    }, 60000)
    return () => clearInterval(t)
  }, [])

  const { data: dash, isLoading: dashLoading, isError: dashError, error: dashErr } = useQuery({
    queryKey: ['cimims', 'dashboard'],
    queryFn: getDashboard,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })

  // Fetch pending takeover incidents
  const { data: pendingData } = useQuery({
    queryKey: ['cimims', 'incidents', 'pending_takeover', 1, 5],
    queryFn: () => getIncidents({ view: 'pending_takeover', pageSize: 5 }),
    staleTime: 15_000,
  })

  // Fetch recent incidents
  const { data: recentData } = useQuery({
    queryKey: ['cimims', 'incidents', 'recent', 1, 5],
    queryFn: () => getIncidents({ view: 'all', pageSize: 5 }),
    staleTime: 15_000,
  })

  if (dashError) {
    queueMicrotask(() => {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { msg: `Dashboard 加载失败: ${(dashErr as Error).message || '网络错误'}`, type: 'error' },
      }))
    })
  }

  // Map backend dashboard
  const myOpen = dash?.my_open ?? 0
  const pendingTakeoverCount = dash?.pending_takeover ?? 0
  const slaBreachCount = dash?.sla_breach_count ?? 0
  const todayNew = dash?.today_new ?? 0
  const p1Count = dash?.p1_count ?? 0
  const todayClosed = dash?.today_closed ?? 0
  const avgCloseHours = dash?.avg_close_hours ?? 0
  const resolutionRate = dash?.resolution_rate_30d ?? 0

  const typeDistribution = (dash?.type_distribution ?? []).map(d => ({
    type: TYPE_LABEL[d.type] ?? d.type,
    count: d.count,
    color: TYPE_COLOR[d.type] ?? 'bg-ink-3',
  }))
  const totalTypeCount = typeDistribution.reduce((sum, d) => sum + d.count, 0) || 1
  const typeWithPct = typeDistribution.map(d => ({
    ...d,
    pct: Math.round((d.count / totalTypeCount) * 100),
  }))

  const pendingTakeover = pendingData?.data ?? []
  const recentIncidents = recentData?.data ?? []

  const maxPct = Math.max(1, ...typeWithPct.map(d => d.pct))

  const toast = (msg: string) => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type: 'info' } }))
  }

  return (
    <div className="px-8 py-6">

      {/* Greeting */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[24px] font-semibold tracking-tight">早班概览 · 值班</h1>
            {wsStatus === 'connected' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-success sla-pulse"></span>
                Live
              </span>
            )}
            {wsStatus === 'disconnected' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warn/10 text-warn text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-warn"></span>
                重连中
              </span>
            )}
          </div>
          <p className="text-[13px] text-ink-3">
            {now.date} · {now.time} · {pendingTakeoverCount} 项待接单 · {slaBreachCount > 0 ? `${slaBreachCount} 项即将超时` : '0 项即将超时'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/cimims/incidents/new"
            className="px-4 py-2 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2 flex items-center gap-1.5 shadow-card"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            上报事件
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5 hover:shadow-card-hover transition cursor-pointer">
          <div className="text-[12px] text-ink-3 mb-2 font-medium">未关工单</div>
          <div className="text-[28px] font-semibold font-mono text-ink">
            {dashLoading ? '—' : myOpen}
          </div>
          <div className={`text-[11.5px] mt-1.5 flex items-center gap-1 ${slaBreachCount > 0 ? 'text-danger' : 'text-ink-3'}`}>
            {slaBreachCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-danger sla-pulse"></span>}
            {slaBreachCount > 0 ? `${slaBreachCount} 项即将超时` : '0 项即将超时'}
          </div>
        </div>

        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5 hover:shadow-card-hover transition cursor-pointer">
          <div className="text-[12px] text-ink-3 mb-2 font-medium">今日新增</div>
          <div className="text-[28px] font-semibold font-mono text-ink">
            {dashLoading ? '—' : todayNew}
          </div>
          <div className={`text-[11.5px] mt-1.5 ${p1Count > 0 ? 'text-danger' : 'text-ink-3'}`}>
            {p1Count > 0 ? `${p1Count} 项 P1 阻断` : '0 项 P1 阻断'}
          </div>
        </div>

        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5 hover:shadow-card-hover transition cursor-pointer">
          <div className="text-[12px] text-ink-3 mb-2 font-medium">今日已关闭</div>
          <div className="text-[28px] font-semibold font-mono text-ink">
            {dashLoading ? '—' : todayClosed}
          </div>
          <div className="text-[11.5px] text-success mt-1.5">平均 {avgCloseHours.toFixed(1)}h 闭环</div>
        </div>

        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5 hover:shadow-card-hover transition cursor-pointer">
          <div className="text-[12px] text-ink-3 mb-2 font-medium">解决率 (30d)</div>
          <div className="text-[28px] font-semibold font-mono text-ink">
            {dashLoading ? '—' : resolutionRate.toFixed(1)}
            <span className="text-[14px] text-ink-3">%</span>
          </div>
          <div className="text-[11.5px] text-success mt-1.5">↑ 较上月提升</div>
        </div>
      </div>

      {/* Two-column: Pending + Type Distribution */}
      <div className="grid grid-cols-2 gap-5 mb-6">

        {/* Pending Takeover */}
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-progress flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-ink">待接单事件</h3>
              <p className="text-[11.5px] text-ink-3 mt-0.5">{pendingTakeover.length} 项待接单</p>
            </div>
            <Link to="/cimims/duty-pool" className="text-[12px] text-ignite font-medium hover:underline">值班池 →</Link>
          </div>
          <div className="divide-y divide-progress">
            {pendingTakeover.map((inc) => {
              const elapsed = (Date.now() - new Date(inc.createdAt).getTime()) / 3600000
              const slaRemaining = (inc.slaHours || 4) - elapsed
              const slaColor = slaRemaining < 0 ? 'text-danger' : slaRemaining < (inc.slaHours || 4) * 0.5 ? 'text-warn' : 'text-ignite'
              return (
                <div key={inc.id} className="px-5 py-3 flex items-center gap-3 hover:bg-module transition">
                  <UrgencyBadge urgency={inc.urgency} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-ink truncate">{inc.title}</div>
                    <div className="text-[11.5px] text-ink-3 font-mono">{inc.incidentNo}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-[12px] font-mono font-semibold ${slaColor}`}>
                      {slaRemaining > 0 ? `剩 ${slaRemaining.toFixed(1)}h` : 'SLA 突破'}
                    </div>
                  </div>
                  <button
                    onClick={() => toast('接单成功！')}
                    className="px-3 py-1.5 rounded-lg bg-ignite text-pure text-[12px] font-medium hover:bg-ignite-2 flex-shrink-0"
                  >
                    接单
                  </button>
                </div>
              )
            })}
            {pendingTakeover.length === 0 && (
              <div className="px-5 py-8 text-center text-[13px] text-ink-3">暂无待接单 ✓</div>
            )}
          </div>
        </div>

        {/* Type Distribution */}
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold text-ink">类型分布</h3>
            <p className="text-[11.5px] text-ink-3 mt-0.5">按事件类型统计</p>
          </div>
          {typeWithPct.length === 0 ? (
            <div className="text-[13px] text-ink-3 text-center py-8">暂无数据</div>
          ) : (
            <div className="space-y-3">
              {typeWithPct.map((d) => (
                <div key={d.type} className="flex items-center gap-3">
                  <span className="w-16 text-[12px] text-ink-3">{d.type}</span>
                  <div className="flex-1 h-2 bg-module rounded-full overflow-hidden">
                    <div className={`h-full ${d.color} rounded-full transition-all`} style={{ width: `${(d.pct / maxPct) * 100}%` }}></div>
                  </div>
                  <span className="w-8 text-right text-[12px] font-mono text-ink">{d.pct}%</span>
                  <span className="w-5 text-right text-[11px] text-ink-3 font-mono">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60">
        <div className="px-5 py-4 border-b border-progress flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-ink">最近事件</h3>
            <p className="text-[11.5px] text-ink-3 mt-0.5">最新 5 条事件记录</p>
          </div>
          <Link to="/cimims/incidents" className="text-[12px] text-ignite font-medium hover:underline">事件列表 →</Link>
        </div>
        <div className="divide-y divide-progress">
          {recentIncidents.map((inc) => {
            const elapsed = (Date.now() - new Date(inc.createdAt).getTime()) / 3600000
            const slaRemaining = (inc.slaHours || 4) - elapsed
            const ago = elapsed < 1 ? `${Math.floor(elapsed * 60)}min` : `${elapsed.toFixed(1)}h`
            return (
              <div key={inc.id} className="px-5 py-3 flex items-center gap-3 hover:bg-module transition">
                <UrgencyBadge urgency={inc.urgency} />
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-[12px] text-ink-2 mr-2">{inc.incidentNo}</span>
                  <span className="text-[13px] text-ink">{inc.title}</span>
                  {inc.impactScope === 'fab' && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold text-pure bg-danger sla-pulse">Fab 级</span>
                  )}
                </div>
                {inc.status !== 'closed' && (
                  <div className={`text-[11.5px] font-mono ${
                    slaRemaining < 0 ? 'text-danger sla-pulse' : slaRemaining < (inc.slaHours || 4) * 0.5 ? 'text-warn' : 'text-ink-3'
                  }`}>
                    {slaRemaining > 0 ? `剩 ${slaRemaining.toFixed(1)}h` : 'SLA 突破'}
                  </div>
                )}
                {inc.status === 'closed' && (
                  <div className="text-[11.5px] text-success font-mono">已关闭</div>
                )}
                <div className="text-[11.5px] text-ink-3 font-mono">{ago}</div>
              </div>
            )
          })}
          {recentIncidents.length === 0 && (
            <div className="px-5 py-8 text-center text-[13px] text-ink-3">暂无事件</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-6 py-4 border-t border-progress text-[11.5px] text-ink-3 flex items-center justify-between">
        <div>MRDI · CIM-IMS · IT 报案管理子系统</div>
        <div className="flex items-center gap-4"><span>Build 2026.07.15</span></div>
      </footer>
    </div>
  )
}
