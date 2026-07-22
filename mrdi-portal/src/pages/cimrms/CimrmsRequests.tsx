import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getRequests, type RequestView } from '../../services/cimrms'
import { REQUEST_TYPE, URGENCY, STATUS_CONFIG } from '../../types/cimrms'
import type { RequestStatus, Urgency } from '../../types/cimrms'

type FilterStatus = RequestStatus | 'all'
type ViewMode = '全部' | '我的' | '待我审批' | '待我处理' | '我提交'

const viewModes: ViewMode[] = ['全部', '我的', '待我审批', '待我处理', '我提交']

// Map frontend view mode → backend view param
const viewToApiView: Record<ViewMode, RequestView | undefined> = {
  '全部': 'all',
  '我的': 'mine',
  '待我审批': 'pending_approval',
  '待我处理': 'pending_action',
  '我提交': 'submitted_by_me',
}

const PAGE_SIZE = 10

export default function CimrmsRequests() {
  const [view, setView] = useState<ViewMode>('全部')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [urgencyFilter, setUrgencyFilter] = useState<Urgency | 'all'>('all')
  const [page, setPage] = useState(1)

  const toast = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type } }))
  }

  // Fetch from API. Search is debounced via the input value; pass it server-side.
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['cimrms', 'requests', view, statusFilter, typeFilter, urgencyFilter, search, page],
    queryFn: () =>
      getRequests({
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

  // Show error toast once (don't spam on every render)
  if (isError && error) {
    // Use microtask to avoid setState-during-render
    queueMicrotask(() => {
      toast(`加载失败: ${(error as Error).message || '网络错误'}`, 'error')
    })
  }

  const filtered = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  function UrgencyBadge({ urgency }: { urgency: string }) {
    const cfg = URGENCY[urgency as keyof typeof URGENCY] || URGENCY.P3
    return <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-pure font-mono ${cfg.bg}`}>{cfg.code}</span>
  }

  function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || { label: status, bg: 'bg-module', text: 'text-ink-3' }
    return <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
  }

  return (
    <div className="px-8 py-6">

      {/* Page Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">需求列表</h1>
          <p className="text-[13px] text-ink-3 mt-1">
            {isLoading ? '加载中…' : `共 ${total} 个需求`}
          </p>
        </div>
        <Link
          to="/cimrms/requests/new"
          className="px-4 py-2 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2 flex items-center gap-1.5 shadow-card"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          提交新需求
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
          <input
            type="text"
            placeholder="搜索编号 / 标题 / 提交人…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2 bg-pure border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as FilterStatus); setPage(1) }}
          className="px-3 py-2 bg-pure border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30"
        >
          <option value="all">全部状态</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-pure border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30"
        >
          <option value="all">全部类型</option>
          {Object.entries(REQUEST_TYPE).map(([, v]) => (
            <option key={v.code} value={v.code}>{v.label}</option>
          ))}
        </select>
        <select
          value={urgencyFilter}
          onChange={(e) => { setUrgencyFilter(e.target.value as Urgency | 'all'); setPage(1) }}
          className="px-3 py-2 bg-pure border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30"
        >
          <option value="all">全部紧急度</option>
          <option value="P1">P1 紧急</option>
          <option value="P2">P2 一般</option>
          <option value="P3">P3 低</option>
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
              <th className="px-3 py-2.5 text-center font-medium w-[60px]">紧急</th>
              <th className="px-3 py-2.5 text-left font-medium">提交人</th>
              <th className="px-3 py-2.5 text-left font-medium">处理人</th>
              <th className="px-3 py-2.5 text-left font-medium w-[120px]">状态</th>
              <th className="px-3 py-2.5 text-right font-medium w-[80px] pr-5">更新</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-progress">
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-ink-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-ignite border-t-transparent animate-spin" />
                    正在加载…
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && filtered.map((req) => {
              const updated = new Date(req.updatedAt)
              const ago = (() => {
                const diff = Date.now() - updated.getTime()
                const h = Math.floor(diff / 3600000)
                if (h < 1) return `${Math.floor(diff / 60000)}min`
                if (h < 24) return `${h}h`
                return `${Math.floor(h / 24)}d`
              })()
              const typeLabel = REQUEST_TYPE[req.type as keyof typeof REQUEST_TYPE]?.label || req.type
              return (
                <tr
                  key={req.id}
                  className="row-hover cursor-pointer"
                  onClick={() => toast('Sprint 2 上线', 'info')}
                >
                  <td className="px-5 py-3 font-mono font-medium text-ignite">{req.requestNo}</td>
                  <td className="px-3 py-3 text-ink font-medium">{req.title}</td>
                  <td className="px-3 py-3 text-ink-3">{typeLabel}</td>
                  <td className="px-3 py-3 text-center"><UrgencyBadge urgency={req.urgency} /></td>
                  <td className="px-3 py-3 text-ink-3">{req.submitterName}</td>
                  <td className="px-3 py-3 text-ink-3">{req.assigneeName || '—'}</td>
                  <td className="px-3 py-3"><StatusBadge status={req.status} /></td>
                  <td className="px-3 py-3 text-right text-ink-3 font-mono pr-5">{ago}</td>
                </tr>
              )
            })}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-ink-3">没有找到匹配的需求</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-progress flex items-center justify-between text-[13px]">
            <span className="text-ink-3">显示 {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} 共 {total} 条</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-progress hover:bg-module disabled:opacity-30 flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-[13px] ${p === page ? 'bg-ignite text-pure' : 'border border-progress hover:bg-module'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg border border-progress hover:bg-module disabled:opacity-30 flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
