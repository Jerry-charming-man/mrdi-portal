import { useState } from 'react'
import { MOCK_REQUESTS, URGENCY } from '../../types/cimrms'

const poolRequests = MOCK_REQUESTS.filter(r => r.status === 'pool')

const p1Count = poolRequests.filter(r => r.urgency === 'P1').length
const p2Count = poolRequests.filter(r => r.urgency === 'P2').length
const p3Count = poolRequests.filter(r => r.urgency === 'P3').length

type ViewMode = 'list' | 'kanban'

export default function CimrmsPool() {
  const [view, setView] = useState<ViewMode>('list')
  const [showModal, setShowModal] = useState<string | null>(null)

  const toast = (msg: string) => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type: 'info' } }))
  }

  function UrgencyBadge({ urgency }: { urgency: string }) {
    const cfg = URGENCY[urgency as keyof typeof URGENCY] || URGENCY.P3
    return <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-pure font-mono ${cfg.bg}`}>{cfg.code}</span>
  }

  function waitTime(createdAt: string) {
    const diff = Date.now() - new Date(createdAt).getTime()
    const d = Math.floor(diff / 86400000)
    if (d < 1) { const h = Math.floor(diff / 3600000); return h < 1 ? `${Math.floor(diff / 60000)}min` : `${h}h` }
    return `${d}d`
  }

  return (
    <div className="px-8 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">需求池</h1>
          <p className="text-[13px] text-ink-3 mt-1">
            待评估需求 · {poolRequests.length} 个 · 最早等待 {poolRequests[0] ? waitTime(poolRequests[poolRequests.length - 1].createdAt) : '—'}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-pure rounded-xl shadow-card border border-progress/60 p-1">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition ${view === 'list' ? 'bg-ignite text-pure' : 'text-ink-3 hover:text-ink hover:bg-module'}`}
          >
            列表
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition ${view === 'kanban' ? 'bg-ignite text-pure' : 'text-ink-3 hover:text-ink hover:bg-module'}`}
          >
            看板
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'P1 待评估', count: p1Count, color: 'text-danger', bg: 'bg-danger-soft border border-danger/20' },
          { label: 'P2 待评估', count: p2Count, color: 'text-warn', bg: 'bg-warn-soft border border-warn/20' },
          { label: 'P3 待评估', count: p3Count, color: 'text-ink-3', bg: 'bg-module border border-progress' },
        ].map(kpi => (
          <div key={kpi.label} className={`rounded-2xl shadow-card p-5 ${kpi.bg}`}>
            <div className={`text-[28px] font-semibold font-mono ${kpi.color}`}>{kpi.count}</div>
            <div className={`text-[12px] ${kpi.color} mt-1`}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* List View */}
      {view === 'list' && (
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60">
          <table className="w-full text-[13px]">
            <thead className="bg-module text-ink-3 text-[11px]">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium w-[80px]">紧急</th>
                <th className="px-3 py-2.5 text-left font-medium">编号</th>
                <th className="px-3 py-2.5 text-left font-medium">标题</th>
                <th className="px-3 py-2.5 text-left font-medium">提交人</th>
                <th className="px-3 py-2.5 text-left font-medium">关联系统</th>
                <th className="px-3 py-2.5 text-center font-medium w-[80px]">等待</th>
                <th className="px-3 py-2.5 text-right font-medium w-[100px] pr-5">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-progress">
              {poolRequests.map((req) => {
                const days = waitTime(req.createdAt)
                return (
                  <tr key={req.id} className="row-hover">
                    <td className="px-5 py-3"><UrgencyBadge urgency={req.urgency} /></td>
                    <td className="px-3 py-3 font-mono font-medium text-ignite">{req.requestNo}</td>
                    <td className="px-3 py-3 text-ink font-medium">{req.title}</td>
                    <td className="px-3 py-3 text-ink-3">{req.submitterName}</td>
                    <td className="px-3 py-3 text-ink-3">{req.relatedSystem || '—'}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-mono ${days.includes('d') ? 'text-warn' : 'text-ink-3'}`}>{days}</span>
                    </td>
                    <td className="px-3 py-3 text-right pr-5">
                      <button
                        onClick={() => setShowModal(req.id)}
                        className="px-3 py-1.5 rounded-lg bg-ignite text-pure text-[12px] font-medium hover:bg-ignite-2"
                      >
                        接单
                      </button>
                    </td>
                  </tr>
                )
              })}
              {poolRequests.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-ink-3">需求池暂无待评估需求 ✓</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-3 gap-5">
          {['P1 紧急', 'P2 一般', 'P3 低'].map((col, ci) => {
            const colUrgency = ['P1', 'P2', 'P3'][ci] as 'P1' | 'P2' | 'P3'
            const items = poolRequests.filter(r => r.urgency === colUrgency)
            const colColors = ['border-danger', 'border-warn', 'border-progress']
            return (
              <div key={col} className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
                <div className={`px-4 py-3 border-b-2 ${colColors[ci]}`}>
                  <div className="text-[13px] font-semibold">{col}</div>
                  <div className="text-[11px] text-ink-3 mt-0.5">{items.length} 项</div>
                </div>
                <div className="p-3 space-y-2">
                  {items.map(req => (
                    <div key={req.id} className="bg-module rounded-xl p-3 hover:shadow-card transition cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <UrgencyBadge urgency={req.urgency} />
                        <span className="font-mono text-[11px] text-ignite">{req.requestNo}</span>
                      </div>
                      <div className="text-[12.5px] font-medium text-ink mb-2 leading-snug">{req.title}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-ink-3">{req.submitterName}</span>
                        <span className={`text-[11px] font-mono ${waitTime(req.createdAt).includes('d') ? 'text-warn' : 'text-ink-3'}`}>{waitTime(req.createdAt)}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowModal(req.id) }}
                        className="mt-2 w-full py-1.5 rounded-lg bg-ignite text-pure text-[12px] font-medium hover:bg-ignite-2"
                      >
                        接单
                      </button>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="py-6 text-center text-[12px] text-ink-3">无</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Accept Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowModal(null)}>
          <div className="bg-pure rounded-2xl shadow-card-hover p-6 w-[400px]" onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-ink mb-1">接单确认</h3>
            <p className="text-[13px] text-ink-3 mb-4">将此需求分配给团队并排期</p>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-[12px] text-ink-3 font-medium mb-1.5">分配团队</label>
                <select className="w-full px-3 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30">
                  <option>IT-CIM</option>
                  <option>IT-SEC</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-ink-3 font-medium mb-1.5">计划完成日期</label>
                <input type="date" className="w-full px-3 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowModal(null); toast('需求已接单！') }}
                className="flex-1 py-2.5 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2"
              >
                确认接单
              </button>
              <button
                onClick={() => setShowModal(null)}
                className="px-4 py-2.5 rounded-lg border border-progress text-[13px] hover:bg-module"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
