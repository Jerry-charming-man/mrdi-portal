import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getIncidents, type IncidentView } from '../../services/cimims'
import { INCIDENT_TYPE, INCIDENT_URGENCY, INCIDENT_IMPACT, STATUS_CONFIG } from '../../types/cimims'
import type { IncidentStatus, IncidentType, IncidentUrgency } from '../../types/cimims'

type ViewMode = '全部' | '我上报的' | '待我接单' | '处理中' | '待确认'
const viewModes: ViewMode[] = ['全部', '我上报的', '待我接单', '处理中', '待确认']

// Map frontend view mode → backend view param
const viewToApiView: Record<ViewMode, IncidentView | undefined> = {
  '全部': 'all',
  '我上报的': 'submitted_by_me',
  '待我接单': 'pending_takeover',
  '处理中': 'processing',
  '待确认': 'pending_confirm',
}

const PAGE_SIZE = 10

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || { label: status, bg: 'bg-module', text: 'text-ink-3' }
  return <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
}
function UrgencyBadge({ urgency }: { urgency: string }) {
  const cfg = INCIDENT_URGENCY[urgency as keyof typeof INCIDENT_URGENCY] || INCIDENT_URGENCY.P3
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-pure font-mono ${cfg.bg}`}>{cfg.code}</span>
}
function TypeBadge({ type }: { type: string }) {
  const cfg = INCIDENT_TYPE[type as keyof typeof INCIDENT_TYPE] || INCIDENT_TYPE.OTHER
  return <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
}
function ImpactBadge({ scope }: { scope: string }) {
  const cfg = INCIDENT_IMPACT[scope as keyof typeof INCIDENT_IMPACT]
  if (!cfg) return null
  const isFab = scope === 'fab'
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${isFab ? 'bg-danger text-pure sla-pulse' : 'bg-module text-ink-3'}`}>
      {cfg.label}
    </span>
  )
}

export default function CimimsIncidents() {
  const [view, setView] = useState<ViewMode>('全部')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<IncidentType | 'all'>('all')
  const [urgencyFilter, setUrgencyFilter] = useState<IncidentUrgency | 'all'>('all')
  const [page, setPage] = useState(1)

  const showToast = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type } }))
  }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['cimims', 'incidents', view, statusFilter, typeFilter, urgencyFilter, search, page],
    queryFn: () =>
      getIncidents({
        view: viewToApiView[view],
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        urgency: urgencyFilter !== 'all' ? urgencyFilter : undefined,
        search: search || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    staleTime: 15_000,
  })

  if (isError && error) {
    queueMicrotask(() => {
      showToast(`加载失败: ${(error as Error).message || '网络错误'}`, 'error')
    })
  }

  const filtered = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="px-8 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">事件列表</h1>
          <p className="text-[13px] text-ink-3 mt-1">
            {isLoading ? '加载中…' : `共 ${total} 个事件`}
          </p>
        </div>
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

      {/* View Tabs */}
      <div className="flex items-center gap-1 mb-4 bg-pure rounded-xl shadow-card border border-progress/60 p-1 w-fit">
        {viewModes.map((v) => (
          <button
            key={v}
            onClick={() => { setView(v); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition ${view === v ? 'bg-ignite text-pure' : 'text-ink-3 hover:text-ink hover:bg-module'}`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" placeholder="搜编号 / 标题 / 上报人…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2 bg-pure border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30"
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as IncidentStatus | 'all'); setPage(1) }}
          className="px-3 py-2 bg-pure border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30">
          <option value="all">全部状态</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value as IncidentType | 'all'); setPage(1) }}
          className="px-3 py-2 bg-pure border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30">
          <option value="all">全部类型</option>
          {Object.entries(INCIDENT_TYPE).map(([, v]) => <option key={v.code} value={v.code}>{v.label}</option>)}
        </select>
        <select value={urgencyFilter} onChange={e => { setUrgencyFilter(e.target.value as IncidentUrgency | 'all'); setPage(1) }}
          className="px-3 py-2 bg-pure border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30">
          <option value="all">全部紧急度</option>
          <option value="P1">P1 阻断</option>
          <option value="P2">P2 影响效率</option>
          <option value="P3">P3 一般</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-module text-ink-3 text-[11px]">
            <tr>
              <th className="px-5 py-2.5 text-left font-medium">编号</th>
              <th className="px-3 py-2.5 text-left font-medium">标题</th>
              <th className="px-3 py-2.5 text-left font-medium">类型</th>
              <th className="px-3 py-2.5 text-center font-medium w-[50px]">紧急</th>
              <th className="px-3 py-2.5 text-center font-medium w-[70px]">影响</th>
              <th className="px-3 py-2.5 text-left font-medium">上报人</th>
              <th className="px-3 py-2.5 text-left font-medium">处理人</th>
              <th className="px-3 py-2.5 text-left font-medium w-[100px]">SLA</th>
              <th className="px-3 py-2.5 text-left font-medium w-[100px]">状态</th>
              <th className="px-3 py-2.5 text-right font-medium w-[60px] pr-5">更新</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-progress">
            {isLoading && (
              <tr>
                <td colSpan={10} className="px-5 py-12 text-center text-ink-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-ignite border-t-transparent animate-spin" />
                    正在加载…
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && filtered.map((inc) => {
              const elapsed = (Date.now() - new Date(inc.updatedAt).getTime()) / 3600000
              const sla = inc.slaHours || 4
              const pct = elapsed / sla
              const slaColor = pct >= 1 ? 'text-danger' : pct >= 0.5 ? 'text-warn' : 'text-ink-3'
              const slaBar = pct >= 1 ? 'bg-danger sla-pulse' : pct >= 0.5 ? 'bg-warn' : 'bg-ignite'
              const ago = elapsed < 1 ? `${Math.floor(elapsed * 60)}min` : `${elapsed.toFixed(1)}h`
              return (
                <tr key={inc.id} className="row-hover cursor-pointer" onClick={() => showToast('Sprint 2 上线', 'info')}>
                  <td className="px-5 py-3 font-mono font-medium text-ignite">{inc.incidentNo}</td>
                  <td className="px-3 py-3 text-ink font-medium">{inc.title}</td>
                  <td className="px-3 py-3"><TypeBadge type={inc.type} /></td>
                  <td className="px-3 py-3 text-center"><UrgencyBadge urgency={inc.urgency} /></td>
                  <td className="px-3 py-3 text-center"><ImpactBadge scope={inc.impactScope} /></td>
                  <td className="px-3 py-3 text-ink-3">{inc.submitterName}</td>
                  <td className="px-3 py-3 text-ink-3">{inc.dutyName || '—'}</td>
                  <td className="px-3 py-3">
                    {inc.status !== 'closed' ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-module rounded-full overflow-hidden max-w-[60px]">
                          <div className={`h-full ${slaBar} rounded-full`} style={{ width: `${Math.min(100, pct * 100)}%` }}></div>
                        </div>
                        <span className={`text-[11px] font-mono ${slaColor}`}>{sla - elapsed > 0 ? `${(sla - elapsed).toFixed(1)}h` : '突破'}</span>
                      </div>
                    ) : <span className="text-[11px] text-success font-mono">已关闭</span>}
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={inc.status} /></td>
                  <td className="px-3 py-3 text-right text-ink-3 font-mono pr-5">{ago}</td>
                </tr>
              )
            })}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={10} className="px-5 py-12 text-center text-ink-3">没有找到匹配的事件</td></tr>
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-progress flex items-center justify-between text-[13px]">
            <span className="text-ink-3">显示 {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} 共 {total} 条</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-progress hover:bg-module disabled:opacity-30 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-[13px] ${p === page ? 'bg-ignite text-pure' : 'border border-progress hover:bg-module'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-8 h-8 rounded-lg border border-progress hover:bg-module disabled:opacity-30 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
