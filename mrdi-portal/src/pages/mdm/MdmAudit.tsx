import { useState, useEffect, useCallback } from 'react'
import { getMdmAuditLogs, type MdmAuditParams } from '../../services/mdm'
import type { MdmAuditLogItem } from '../../types/mdm'

function actionColor(action: string): { bg: string; text: string } {
  if (action.includes('reject') || action.includes('revoke') || action.includes('fail')) {
    return { bg: 'bg-danger/10', text: 'text-danger' }
  }
  if (action.includes('approve') || action.includes('grant') || action.includes('create')) {
    return { bg: 'bg-success/10', text: 'text-success' }
  }
  return { bg: 'bg-module', text: 'text-ink-2' }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  } catch {
    return iso
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('zh-HK', { month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

const SYSTEM_OPTIONS = [
  { value: '', label: '全部系统' },
  { value: 'cimrms', label: 'CIM-RMS' },
  { value: 'cimims', label: 'CIM-IMS' },
  { value: 'cim-perm', label: 'CIM-PERM' },
]

const PAGE_SIZE = 20

export default function MdmAudit() {
  const [logs, setLogs] = useState<MdmAuditLogItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [system, setSystem] = useState('')
  const [actionSearch, setActionSearch] = useState('')
  const [actorSearch, setActorSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchLogs = useCallback(async (params: MdmAuditParams) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getMdmAuditLogs({ ...params, pageSize: PAGE_SIZE })
      setLogs(result.items)
      setTotal(result.pagination.total)
    } catch (e: unknown) {
      setError((e as Error).message ?? '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const params: MdmAuditParams = { page }
    if (system)     params.system   = system
    if (actionSearch) params.action = actionSearch
    if (actorSearch)  params.actor  = actorSearch
    if (dateFrom)    params.dateFrom = dateFrom
    if (dateTo)      params.dateTo   = dateTo
    fetchLogs(params)
  }, [page, system, actionSearch, actorSearch, dateFrom, dateTo, fetchLogs])

  // KPI: today's total
  const today = new Date().toISOString().slice(0, 10)
  const todayLogs = logs.filter(l => l.createdAt.startsWith(today))
  const totalPages = Math.ceil(total / PAGE_SIZE)

  function handleSearch() {
    setPage(1)
    const params: MdmAuditParams = { page: 1, pageSize: PAGE_SIZE }
    if (system)       params.system    = system
    if (actionSearch) params.action   = actionSearch
    if (actorSearch)  params.actor    = actorSearch
    if (dateFrom)     params.dateFrom  = dateFrom
    if (dateTo)       params.dateTo    = dateTo
    fetchLogs(params)
  }

  function handleReset() {
    setSystem('')
    setActionSearch('')
    setActorSearch('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
    fetchLogs({ pageSize: PAGE_SIZE })
  }

  return (
    <div className="px-8 py-6 space-y-5">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">审计日志</h1>
          <p className="text-[13px] text-ink-3 mt-1">跨系统统一审计 · CIM-RMS / CIM-IMS / CIM-PERM</p>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-ink-3 px-3 py-1.5 bg-module rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-ignite pulse-dot"></span>
          {loading ? '加载中…' : `共 ${total} 条记录`}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5 text-center">
          <div className="text-[28px] font-semibold font-mono text-ink">{total}</div>
          <div className="text-[11.5px] text-ink-3 mt-1">总记录数</div>
        </div>
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5 text-center">
          <div className="text-[28px] font-semibold font-mono text-ignite">{todayLogs.length}</div>
          <div className="text-[11.5px] text-ink-3 mt-1">今日操作</div>
        </div>
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5 text-center">
          <div className="text-[28px] font-semibold font-mono text-ink">
            {[...new Set(logs.map(l => l.actorEmail))].length}
          </div>
          <div className="text-[11.5px] text-ink-3 mt-1">涉及用户</div>
        </div>
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5 text-center">
          <div className="text-[28px] font-semibold font-mono text-ignite">
            {[...new Set(logs.map(l => l.action.split('.')[0]))].length}
          </div>
          <div className="text-[11.5px] text-ink-3 mt-1">活跃系统</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-pure rounded-xl border border-progress/60 px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap mb-3">
          {/* System */}
          <select
            value={system}
            onChange={e => { setSystem(e.target.value); setPage(1) }}
            className="px-3 py-1.5 bg-module rounded-lg text-[12.5px] focus:outline-none focus:ring-2 focus:ring-ignite/30"
          >
            {SYSTEM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Action search */}
          <input
            type="text"
            placeholder="操作类型（如 request.approve）"
            value={actionSearch}
            onChange={e => setActionSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="px-3 py-1.5 bg-module rounded-lg text-[12.5px] focus:outline-none focus:ring-2 focus:ring-ignite/30 flex-1 min-w-[180px]"
          />

          {/* Actor search */}
          <input
            type="text"
            placeholder="操作人"
            value={actorSearch}
            onChange={e => setActorSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="px-3 py-1.5 bg-module rounded-lg text-[12.5px] focus:outline-none focus:ring-2 focus:ring-ignite/30 flex-1 min-w-[120px]"
          />

          {/* Date range */}
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-1.5 bg-module rounded-lg text-[12.5px] focus:outline-none focus:ring-2 focus:ring-ignite/30"
          />
          <span className="text-ink-3 text-[12px]">–</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="px-3 py-1.5 bg-module rounded-lg text-[12.5px] focus:outline-none focus:ring-2 focus:ring-ignite/30"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="px-4 py-1.5 bg-ignite text-white rounded-lg text-[12.5px] hover:opacity-90 transition-opacity"
          >
            搜索
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-1.5 bg-module text-ink-2 rounded-lg text-[12.5px] hover:bg-progress transition-colors"
          >
            重置
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-[13px] px-4 py-3 rounded-xl">
          加载失败：{error}
        </div>
      )}

      {/* Table */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-ink-3 text-[13px]">
            <span className="pulse-dot w-2 h-2 rounded-full bg-ignite mr-2"></span>
            加载中…
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-ink-3 text-[13px]">
            暂无记录
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-module text-ink-3 text-[11.5px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left font-medium">时间</th>
                <th className="px-4 py-3 text-left font-medium">操作人</th>
                <th className="px-4 py-3 text-left font-medium">系统</th>
                <th className="px-4 py-3 text-left font-medium">操作</th>
                <th className="px-4 py-3 text-left font-medium">目标</th>
                <th className="px-4 py-3 text-left font-medium">状态</th>
                <th className="px-4 py-3 text-left font-medium">详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-progress">
              {logs.map((log) => {
                const [sys, ...rest] = log.action.split('.')
                const ac = actionColor(log.action)
                const actionDisplay = rest.join('.')
                return (
                  <tr key={log.id} className="row-hover">
                    <td className="px-4 py-3">
                      <div className="font-mono text-[12px] text-ink-3">{formatDate(log.createdAt)}</div>
                      <div className="font-mono text-[12px] text-ink-3">{formatTime(log.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-ink">{log.actorName || '—'}</div>
                      <div className="font-mono text-[11px] text-ink-3">{log.actorEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-module text-[11px] text-ink-3 rounded">
                        {sys}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${ac.bg} ${ac.text}`}>
                        {actionDisplay || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-[12px] text-ink-2">{log.targetId || log.targetEmail || '—'}</div>
                      {log.targetEmail && (
                        <div className="font-mono text-[11px] text-ink-3">{log.targetEmail}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-success text-[13px]">✓</span>
                        <span className="text-[12px] text-ink-3">success</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-3 text-[12px] max-w-[200px] truncate" title={JSON.stringify(log.metadata ?? {})}>
                      {log.metadata ? Object.entries(log.metadata).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' · ') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-4 border-t border-progress">
          <div className="text-[12px] text-ink-3">
            第 {page} / {totalPages} 页，共 {total} 条
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-module rounded-lg text-[12.5px] hover:bg-progress disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ‹ 上一页
            </button>
            <span className="text-[12px] text-ink-3 px-2">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 bg-module rounded-lg text-[12.5px] hover:bg-progress disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              下一页 ›
            </button>
          </div>
        </div>
      )}

      <footer className="py-4 border-t border-progress text-[11.5px] text-ink-3 flex items-center justify-between">
        <div>MRDI · MDM · 主数据管理子系统 v2.2</div>
        <div className="flex items-center gap-4"><span>Build 2026.07.20</span></div>
      </footer>
    </div>
  )
}
