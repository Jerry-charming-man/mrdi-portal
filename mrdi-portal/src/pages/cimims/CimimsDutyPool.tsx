import { useState } from 'react'
import { MOCK_INCIDENTS, INCIDENT_URGENCY } from '../../types/cimims'

const pendingTakeover = MOCK_INCIDENTS.filter(i => i.status === 'pending_takeover')
const p1Count = pendingTakeover.filter(i => i.urgency === 'P1').length
const p2Count = pendingTakeover.filter(i => i.urgency === 'P2').length
const p3Count = pendingTakeover.filter(i => i.urgency === 'P3').length

function UrgencyBadge({ urgency }: { urgency: string }) {
  const cfg = INCIDENT_URGENCY[urgency as keyof typeof INCIDENT_URGENCY] || INCIDENT_URGENCY.P3
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-pure font-mono ${cfg.bg}`}>{cfg.code}</span>
}

export default function CimimsDutyPool() {
  const [showTransfer, setShowTransfer] = useState<string | null>(null)

  const toast = (msg: string) => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type: 'success' } }))
  }

  function waitTime(createdAt: string) {
    const diff = Date.now() - new Date(createdAt).getTime()
    const h = diff / 3600000
    if (h < 1) return `${Math.floor(h * 60)}min`
    return `${h.toFixed(1)}h`
  }

  const sorted = [...pendingTakeover].sort((a, b) => {
    const order = { P1: 0, P2: 1, P3: 2 }
    return (order[a.urgency as keyof typeof order] ?? 3) - (order[b.urgency as keyof typeof order] ?? 3)
  })

  return (
    <div className="px-8 py-6">

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[24px] font-semibold tracking-tight">值班池</h1>
        <p className="text-[13px] text-ink-3 mt-1">待接单事件 · {pendingTakeover.length} 个 · 快速分诊</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'P1 待接单', count: p1Count, color: 'text-danger', bg: 'bg-danger-soft border border-danger/20' },
          { label: 'P2 待接单', count: p2Count, color: 'text-warn', bg: 'bg-warn-soft border border-warn/20' },
          { label: 'P3 待接单', count: p3Count, color: 'text-ink-3', bg: 'bg-module border border-progress' },
        ].map(kpi => (
          <div key={kpi.label} className={`rounded-2xl shadow-card p-5 ${kpi.bg}`}>
            <div className={`text-[28px] font-semibold font-mono ${kpi.color}`}>{kpi.count}</div>
            <div className={`text-[12px] ${kpi.color} mt-1`}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-module text-ink-3 text-[11px]">
            <tr>
              <th className="px-5 py-2.5 text-left font-medium w-[60px]">紧急</th>
              <th className="px-3 py-2.5 text-left font-medium">编号</th>
              <th className="px-3 py-2.5 text-left font-medium">标题</th>
              <th className="px-3 py-2.5 text-left font-medium">类型</th>
              <th className="px-3 py-2.5 text-left font-medium">上报人</th>
              <th className="px-3 py-2.5 text-center font-medium w-[80px]">等待</th>
              <th className="px-3 py-2.5 text-right font-medium w-[160px] pr-5">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-progress">
            {sorted.map((inc) => {
              const elapsed = (Date.now() - new Date(inc.createdAt).getTime()) / 3600000
              const slaRemaining = (inc.slaHours || 4) - elapsed
              const isWarning = slaRemaining < (inc.slaHours || 4) * 0.5
              return (
                <tr key={inc.id} className="row-hover">
                  <td className="px-5 py-3"><UrgencyBadge urgency={inc.urgency} /></td>
                  <td className="px-3 py-3 font-mono font-medium text-ignite">{inc.incidentNo}</td>
                  <td className="px-3 py-3 text-ink font-medium">{inc.title}</td>
                  <td className="px-3 py-3 text-ink-3">{inc.type}</td>
                  <td className="px-3 py-3 text-ink-3">{inc.submitterName}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`font-mono ${isWarning ? 'text-warn' : 'text-ink-3'}`}>{waitTime(inc.createdAt)}</span>
                  </td>
                  <td className="px-3 py-3 text-right pr-5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setShowTransfer(inc.id)}
                        className="px-3 py-1.5 rounded-lg border border-progress text-[12px] text-ink-3 hover:bg-module"
                      >
                        转派
                      </button>
                      <button
                        onClick={() => toast(`${inc.incidentNo} 已接单！`)}
                        className="px-3 py-1.5 rounded-lg bg-ignite text-pure text-[12px] font-medium hover:bg-ignite-2"
                      >
                        接单
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-ink-3">值班池为空 ✓</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowTransfer(null)}>
          <div className="bg-pure rounded-2xl shadow-card-hover p-6 w-[400px]" onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-ink mb-1">转派事件</h3>
            <p className="text-[13px] text-ink-3 mb-4">选择工程师类型处理</p>
            <div className="space-y-2 mb-5">
              {[
                { label: '网络', color: 'bg-research', team: 'IT 基础设施组' },
                { label: '数据库', color: 'bg-ignite', team: 'IT 数据组' },
                { label: '系统应用', color: 'bg-pink', team: 'IT 应用组' },
                { label: '安全', color: 'bg-indigo', team: 'IT 安全组' },
              ].map(e => (
                <div key={e.label} className="flex items-center gap-3 p-3 rounded-xl border border-progress hover:border-ignite/50 hover:bg-ignite-soft/20 cursor-pointer transition">
                  <span className={`w-3 h-3 rounded-full ${e.color}`}></span>
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-ink">{e.label}</div>
                    <div className="text-[11px] text-ink-3">{e.team}</div>
                  </div>
                  <button onClick={() => { setShowTransfer(null); toast(`已转派给 ${e.label}`) }}
                    className="px-3 py-1.5 rounded-lg bg-ignite text-pure text-[12px] font-medium hover:bg-ignite-2">
                    选择
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowTransfer(null)} className="w-full py-2.5 rounded-lg border border-progress text-[13px] hover:bg-module">
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
