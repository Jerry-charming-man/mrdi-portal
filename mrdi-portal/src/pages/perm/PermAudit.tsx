import { useState, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { MOCK_AUDITS, MOCK_REQUESTS, PERM_AUDIT_TYPE } from '../../types/cimperm'

type EventFilter = keyof typeof PERM_AUDIT_TYPE | 'all'

function fireToast(msg: string, type: 'info' | 'success' | 'error' = 'info') {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type } }))
}

const EVENT_TYPES: { key: EventFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'submit', label: '提交' },
  { key: 'it_review', label: 'IT 审核' },
  { key: 'owner_review', label: 'Owner 核准' },
  { key: 'grant', label: '授予' },
  { key: 'revoke', label: '撤销' },
  { key: 'expire', label: '到期回收' },
  { key: 'comment', label: '评论' },
]

export default function PermAudit() {
  const [eventFilter, setEventFilter] = useState<EventFilter>('all')
  const [actorSearch, setActorSearch] = useState('')
  const [reqSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  let filtered = [...MOCK_AUDITS].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  if (eventFilter !== 'all') filtered = filtered.filter(a => a.eventType === eventFilter)
  if (actorSearch) filtered = filtered.filter(a => a.actorName.includes(actorSearch))
  if (reqSearch) filtered = filtered.filter(a => {
    const req = MOCK_REQUESTS.find(r => r.id === a.requestId)
    return req?.requestNo.toLowerCase().includes(reqSearch.toLowerCase()) || a.requestId.includes(reqSearch)
  })

  function exportCSV() {
    const headers = ['时间', '申请编号', '事件', '操作人', '详情', '元数据']
    const rows = filtered.map(a => [
      new Date(a.createdAt).toLocaleString('zh-CN'),
      MOCK_REQUESTS.find(r => r.id === a.requestId)?.requestNo || a.requestId,
      PERM_AUDIT_TYPE[a.eventType]?.label || a.eventType,
      a.actorName,
      a.comment || '',
      a.metadata ? JSON.stringify(a.metadata) : '',
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `perm-audit-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    fireToast('审计日志已导出', 'success')
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight text-ink">审计日志</h2>
          <p className="text-[13px] text-ink-3 mt-1">权限全流程记录 · 共 {filtered.length} 条</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="px-3.5 py-2 rounded-lg border border-progress text-[13px] hover:bg-module transition-colors">
            导出 CSV
          </button>
          <button onClick={() => fireToast('审计日志已刷新', 'info')} className="px-3.5 py-2 rounded-lg border border-progress text-[13px] hover:bg-module transition-colors">
            刷新
          </button>
        </div>
      </div>

      {/* Filters — per design */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-4">
        {/* Event type filter buttons */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {EVENT_TYPES.map(et => (
            <button
              key={et.key}
              onClick={() => setEventFilter(et.key)}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all ${
                eventFilter === et.key ? 'bg-ink text-pure' : 'hover:bg-module text-ink-2'
              }`}
            >
              {et.label}
            </button>
          ))}
        </div>
        {/* Search */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            value={actorSearch}
            onChange={e => setActorSearch(e.target.value)}
            placeholder="申请编号 / 操作人..."
            className="px-3 py-2 bg-module rounded-lg text-[13px] flex-1 min-w-[160px]"
          />
          <input
            type="date"
            className="px-3 py-2 bg-module rounded-lg text-[13px]"
          />
          <span className="text-ink-3">至</span>
          <input
            type="date"
            className="px-3 py-2 bg-module rounded-lg text-[13px]"
          />
          <button className="px-3 py-2 bg-research text-pure rounded-lg text-[13px] font-medium hover:bg-research/90 transition-colors">
            查询
          </button>
        </div>
      </div>

      {/* Table — per design */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="bg-module text-ink-3 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left font-medium">时间</th>
                <th className="px-3 py-3 text-left font-medium">申请</th>
                <th className="px-3 py-3 text-left font-medium">事件</th>
                <th className="px-3 py-3 text-left font-medium">操作人</th>
                <th className="px-3 py-3 text-left font-medium">详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-progress">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[13px] text-ink-3">暂无记录</td>
                </tr>
              ) : filtered.map(a => {
                const evtCfg = PERM_AUDIT_TYPE[a.eventType] || PERM_AUDIT_TYPE.comment
                const req = MOCK_REQUESTS.find(r => r.id === a.requestId)
                const isExpanded = expandedId === a.id
                return (
                  <Fragment key={a.id}>
                    <tr className="row-hover cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : a.id)}>
                      <td className="px-5 py-3 text-ink-3 font-mono text-[11.5px]">
                        {new Date(a.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-3 py-3 font-mono text-ink-2">
                        <Link to={`/perm/perm/${a.requestId}`} className="hover:text-research transition-colors" onClick={e => e.stopPropagation()}>
                          {req?.requestNo || a.requestId}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10.5px] font-medium ${evtCfg.bg} ${evtCfg.text}`}>{evtCfg.label}</span>
                      </td>
                      <td className="px-3 py-3 text-ink-2">{a.actorName}</td>
                      <td className="px-3 py-3 text-ink-2">
                        {a.comment || (a.metadata ? JSON.stringify(a.metadata) : '-')}
                        {a.metadata && (
                          <span className="ml-2 text-ink-4 text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && a.metadata && (
                      <tr className="bg-module/50">
                        <td colSpan={5} className="px-8 py-3">
                          <div className="text-[11px] text-ink-3 mb-1">元数据：</div>
                          <pre className="text-[11px] text-ink-2 font-mono bg-pure p-3 rounded-lg overflow-x-auto">
                            {JSON.stringify(a.metadata, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
