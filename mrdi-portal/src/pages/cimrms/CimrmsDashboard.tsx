import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getDashboardMe, getRequests } from '../../services/cimrms'
import { STATUS_CONFIG, URGENCY } from '../../types/cimrms'
import { useWebSocket } from '../../hooks/useWebSocket'

const RMS_WS_URL = `ws://localhost:3001/v1/ws`

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || { label: status, bg: 'bg-module', text: 'text-ink-3' }
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const cfg = URGENCY[urgency as keyof typeof URGENCY] || URGENCY.P3
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-pure font-mono ${cfg.bg}`}>
      {cfg.code}
    </span>
  )
}

export default function CimrmsDashboard() {
  const queryClient = useQueryClient()

  // WebSocket real-time KPI push（S3-7）
  const { status: wsStatus } = useWebSocket(RMS_WS_URL, {
    events: {
      'kpi:rms:update': () => {
        queryClient.invalidateQueries({ queryKey: ['cimrms', 'dashboard'] })
        queryClient.invalidateQueries({ queryKey: ['cimrms', 'requests'] })
      },
    },
  })

  const [now, setNow] = useState(() => {
    const d = new Date()
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return { date: `${d.getMonth() + 1}/${d.getDate()} ${dayNames[d.getDay()]}`, time: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }
  })
  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date()
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      setNow({ date: `${d.getMonth() + 1}/${d.getDate()} ${dayNames[d.getDay()]}`, time: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` })
    }, 60000)
    return () => clearInterval(t)
  }, [])

  const { data: dash, isLoading: dashLoading, isError: dashError, error: dashErr } = useQuery({
    queryKey: ['cimrms', 'dashboard'],
    queryFn: getDashboardMe,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })

  // Fetch in-progress requests for "团队进行中" table
  const { data: inProgressData } = useQuery({
    queryKey: ['cimrms', 'requests', 'in-progress', 1, 10],
    queryFn: () => getRequests({ view: 'all', pageSize: 10 }),
    staleTime: 15_000,
  })

  // Fetch my todos from pending_action view
  const { data: todosData } = useQuery({
    queryKey: ['cimrms', 'requests', 'todos', 1, 5],
    queryFn: () => getRequests({ view: 'pending_action', pageSize: 5 }),
    staleTime: 15_000,
  })

  if (dashError) {
    queueMicrotask(() => {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { msg: `Dashboard 加载失败: ${(dashErr as Error).message || '网络错误'}`, type: 'error' },
      }))
    })
  }

  // Map backend dashboard → KPI structure
  const myTodos = dash?.my_pending_actions ?? 0
  const monthNew = dash?.month_new ?? 0
  const monthClosed = dash?.month_closed ?? 0
  const completionRate = dash?.completion_rate ?? 0
  const avgCloseHours = dash?.avg_close_hours ?? 0
  const teamInProgress = dash?.team_in_progress ?? 0
  const teamOverdue = dash?.team_overdue ?? 0
  const trendData = dash?.weekly_trend ?? []

  const inProgress = (inProgressData?.data ?? []).filter(r =>
    ['in_development', 'pending_uat', 'pending_deploy', 'scheduled'].includes(r.status)
  )
  const todos = todosData?.data ?? []

  const maxCount = Math.max(1, ...trendData.map(d => d.count))

  return (
    <div className="px-8 py-6">

      {/* Greeting */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[24px] font-semibold tracking-tight">早安</h1>
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
        </div>
        <div className="text-[13px] text-ink-3">
          {now.date} · {now.time} · 你今天有 {myTodos} 项待办 · 团队有 {teamInProgress} 个进行中需求
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/cimrms/requests/new"
            className="px-4 py-2 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2 flex items-center gap-1.5 shadow-card"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            新需求
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5 hover:shadow-card-hover transition cursor-pointer">
          <div className="text-[12px] text-ink-3 mb-2 font-medium">我的待办</div>
          <div className="text-[28px] font-semibold font-mono text-ink">
            {dashLoading ? '—' : myTodos}
          </div>
          <div className={`text-[11.5px] mt-1.5 ${teamOverdue > 0 ? 'text-danger' : 'text-ink-3'}`}>
            {teamOverdue > 0 ? `${teamOverdue} 项超期` : '0 项超期'}
          </div>
        </div>

        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5 hover:shadow-card-hover transition cursor-pointer">
          <div className="text-[12px] text-ink-3 mb-2 font-medium">本月新增</div>
          <div className="text-[28px] font-semibold font-mono text-ink">
            {dashLoading ? '—' : monthNew}
          </div>
          <div className="text-[11.5px] text-ink-3 mt-1.5">较上月变化</div>
        </div>

        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5 hover:shadow-card-hover transition cursor-pointer">
          <div className="text-[12px] text-ink-3 mb-2 font-medium">本月已关闭</div>
          <div className="text-[28px] font-semibold font-mono text-ink">
            {dashLoading ? '—' : monthClosed}
          </div>
          <div className="text-[11.5px] text-ink-3 mt-1.5">完成率 {completionRate.toFixed(1)}%</div>
        </div>

        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5 hover:shadow-card-hover transition cursor-pointer">
          <div className="text-[12px] text-ink-3 mb-2 font-medium">平均处理时长</div>
          <div className="text-[28px] font-semibold font-mono text-ink">
            {dashLoading ? '—' : (avgCloseHours / 24).toFixed(1)}
            <span className="text-[14px] text-ink-3">d</span>
          </div>
          <div className="text-[11.5px] text-ink-3 mt-1.5">较上月</div>
        </div>
      </div>

      {/* Two-column: My Todos + Trend */}
      <div className="grid grid-cols-2 gap-5 mb-6">

        {/* My Todos */}
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-progress flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-ink">我的待办</h3>
              <p className="text-[11.5px] text-ink-3 mt-0.5">需要你处理的 {todos.length} 项</p>
            </div>
            <Link to="/cimrms/todos" className="text-[12px] text-ignite font-medium hover:underline">全部 →</Link>
          </div>
          <div className="divide-y divide-progress">
            {todos.map((req) => {
              const cfg = URGENCY[req.urgency as keyof typeof URGENCY] || URGENCY.P3
              return (
                <Link
                  key={req.id}
                  to={`/cimrms/requests/${req.id}`}
                  className="px-5 py-3 flex items-center gap-3 hover:bg-module transition"
                >
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-pure font-mono ${cfg.bg}`}>
                    {cfg.code}
                  </span>
                  <div className="flex-1 text-[13px] text-ink truncate">{req.title}</div>
                  <div className="text-[11.5px] text-ink-3 font-mono flex-shrink-0">{req.requestNo}</div>
                </Link>
              )
            })}
            {todos.length === 0 && (
              <div className="px-5 py-8 text-center text-[13px] text-ink-3">暂无待办 ✓</div>
            )}
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold text-ink">本周趋势</h3>
            <p className="text-[11.5px] text-ink-3 mt-0.5">每日新增需求数量</p>
          </div>
          {trendData.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-[13px] text-ink-3">暂无数据</div>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {trendData.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full flex items-end" style={{ height: `${(d.count / maxCount) * 100}%` }}>
                    <div className="w-full bg-ignite/20 rounded-t group-hover:bg-ignite/40 transition-colors relative">
                      <div
                        className="absolute bottom-0 w-full bg-ignite rounded-t"
                        style={{ height: `${(d.count / maxCount) * 100}%` }}
                      ></div>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ink text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
                        {d.date} · {d.count} 条
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-ink-3 font-mono">{d.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team In-Progress */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60">
        <div className="px-5 py-4 border-b border-progress flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-ink">团队进行中</h3>
            <p className="text-[11.5px] text-ink-3 mt-0.5">IT-CIM 当前处理的 {inProgress.length} 个需求</p>
          </div>
          <Link to="/cimrms/requests" className="text-[12px] text-ignite font-medium hover:underline">需求列表 →</Link>
        </div>
        <table className="w-full text-[13px]">
          <thead className="bg-module text-ink-3 text-[11px]">
            <tr>
              <th className="px-5 py-2.5 text-left font-medium">编号</th>
              <th className="px-3 py-2.5 text-left font-medium">标题</th>
              <th className="px-3 py-2.5 text-center font-medium w-[60px]">紧急</th>
              <th className="px-3 py-2.5 text-left font-medium">处理人</th>
              <th className="px-3 py-2.5 text-left font-medium w-[120px]">状态</th>
              <th className="px-3 py-2.5 text-right font-medium w-[80px] pr-5">更新时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-progress">
            {inProgress.map((req) => {
              const updated = new Date(req.updatedAt)
              const ago = (() => {
                const diff = Date.now() - updated.getTime()
                const h = Math.floor(diff / 3600000)
                if (h < 1) return `${Math.floor(diff / 60000)}min`
                if (h < 24) return `${h}h`
                return `${Math.floor(h / 24)}d`
              })()
              return (
                <tr key={req.id} className="row-hover cursor-pointer">
                  <td className="px-5 py-3 font-mono font-medium text-ignite">{req.requestNo}</td>
                  <td className="px-3 py-3 text-ink">{req.title}</td>
                  <td className="px-3 py-3 text-center"><UrgencyBadge urgency={req.urgency} /></td>
                  <td className="px-3 py-3 text-ink-3">{req.assigneeName || '—'}</td>
                  <td className="px-3 py-3"><StatusBadge status={req.status} /></td>
                  <td className="px-3 py-3 text-right text-ink-3 font-mono pr-5">{ago}</td>
                </tr>
              )
            })}
            {inProgress.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-ink-3">暂无进行中需求</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <footer className="mt-6 py-4 border-t border-progress text-[11.5px] text-ink-3 flex items-center justify-between">
        <div>MRDI · CIM-RMS · IT 需求管理子系统</div>
        <div className="flex items-center gap-4"><span>Build 2026.07.15</span></div>
      </footer>
    </div>
  )
}
