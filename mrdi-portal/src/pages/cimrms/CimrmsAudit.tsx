import { useState, useEffect } from 'react'
import { MOCK_AUDIT_LOGS } from '../../types/cimrms'

const typeColors: Record<string, string> = {
  status_change: 'bg-research/10 text-research',
  comment: 'bg-indigo/10 text-indigo',
  assignment: 'bg-ignite/10 text-ignite',
  escalation: 'bg-warn-soft text-warn',
  attachment: 'bg-module text-ink-3',
}

const typeLabels: Record<string, string> = {
  status_change: '状态变更',
  comment: '评论',
  assignment: '分派',
  escalation: '升级',
  attachment: '附件',
}

export default function CimrmsAudit() {
  const [logs, setLogs] = useState(MOCK_AUDIT_LOGS)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const toast = (msg: string) => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type: 'info' } }))
  }

  // Auto-refresh simulation
  useEffect(() => {
    if (!autoRefresh) return
    const t = setInterval(() => { ;(async () => {
      setLogs(prev => {
        const newLog = {
          id: `a${Date.now()}`,
          timestamp: new Date().toISOString(),
          requestId: 'r1',
          requestNo: 'NC-2026-0142',
          event: '状态变更',
          actor: 'system',
          actorName: '系统',
          detail: 'submitted → pending_manager',
          type: 'status_change' as const,
        }
        return [newLog, ...prev]
      })
    })() }, 8000)
    return () => clearInterval(t)
  }, [autoRefresh])

  let filtered = logs
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(l => l.requestNo.toLowerCase().includes(q) || l.actorName.toLowerCase().includes(q) || l.event.toLowerCase().includes(q))
  }
  if (typeFilter !== 'all') filtered = filtered.filter(l => l.type === typeFilter)

  function formatTime(ts: string) {
    const d = new Date(ts)
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
  }

  function exportCSV() {
    toast('CSV 导出在 Sprint 2 上线')
  }

  return (
    <div className="px-8 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">审计日志</h1>
          <p className="text-[13px] text-ink-3 mt-1">需求流转全记录 · 共 {filtered.length} 条</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-module rounded-lg text-[12px]">
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-success animate-pulse' : 'bg-ink-3'}`}></span>
            <span className="text-ink-3">实时刷新</span>
            <button
              onClick={() => setAutoRefresh(v => !v)}
              className={`w-10 h-5 rounded-full transition relative ${autoRefresh ? 'bg-ignite' : 'bg-progress'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition ${autoRefresh ? 'left-5.5' : 'left-0.5'}`}></span>
            </button>
          </div>
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-lg border border-progress text-[13px] hover:bg-module flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            导出 CSV
          </button>
          <button
            onClick={() => setLogs(prev => [...prev])}
            className="px-4 py-2 rounded-lg border border-progress text-[13px] hover:bg-module flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            刷新
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="搜需求编号 / 操作人 / 事件…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-pure border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-pure border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30"
        >
          <option value="all">全部类型</option>
          {Object.entries(typeLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-module text-ink-3 text-[11px]">
            <tr>
              <th className="px-5 py-2.5 text-left font-medium w-[80px]">时间</th>
              <th className="px-3 py-2.5 text-left font-medium">需求</th>
              <th className="px-3 py-2.5 text-left font-medium">事件</th>
              <th className="px-3 py-2.5 text-left font-medium">操作人</th>
              <th className="px-3 py-2.5 text-left font-medium">详情</th>
              <th className="px-3 py-2.5 text-left font-medium w-[100px]">类型</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-progress">
            {filtered.map((log) => {
              const typeCfg = typeColors[log.type] || typeColors.attachment
              const typeLabel = typeLabels[log.type] || log.type
              return (
                <>
                  <tr
                    key={log.id}
                    className="row-hover cursor-pointer"
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  >
                    <td className="px-5 py-3 font-mono text-[12px] text-ink-3">{formatTime(log.timestamp)}</td>
                    <td className="px-3 py-3 font-mono font-medium text-ignite">{log.requestNo}</td>
                    <td className="px-3 py-3 text-ink">{log.event}</td>
                    <td className="px-3 py-3 text-ink-3">{log.actorName}</td>
                    <td className="px-3 py-3 text-ink-3 text-[12px] max-w-[200px] truncate">{log.detail || '—'}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${typeCfg}`}>{typeLabel}</span>
                    </td>
                  </tr>
                  {expanded === log.id && log.detail && (
                    <tr key={`${log.id}-detail`} className="bg-module">
                      <td colSpan={6} className="px-5 py-3">
                        <div className="text-[12px]">
                          <span className="text-ink-3 mr-2">JSON:</span>
                          <code className="bg-pure px-2 py-1 rounded text-[11px] font-mono text-ink-2">
                            {JSON.stringify({ requestNo: log.requestNo, event: log.event, actor: log.actorName, detail: log.detail, timestamp: log.timestamp }, null, 2)}
                          </code>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-ink-3">没有找到匹配的日志</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
