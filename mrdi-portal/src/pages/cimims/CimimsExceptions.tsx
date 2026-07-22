import { useState } from 'react'
import { MOCK_EXCEPTIONS } from '../../types/cimims'

export default function CimimsExceptions() {
  const [showEscalate, setShowEscalate] = useState<string | null>(null)

  const showToast = (msg: string, type = 'info') => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type } }))
  }

  const slaBreach = MOCK_EXCEPTIONS.filter(e => e.type === 'sla_breach').length
  const sla50 = MOCK_EXCEPTIONS.filter(e => e.type === 'sla_50').length
  const rejectedLoop = 0

  function SeverityCard({ label, count, color, desc }: { label: string; count: number; color: string; desc: string }) {
    return (
      <div className={`rounded-2xl shadow-card border-l-4 p-5 ${color}`}>
        <div className="text-[28px] font-semibold font-mono">{count}</div>
        <div className="text-[13px] font-semibold mt-1">{label}</div>
        <div className="text-[11.5px] mt-0.5 opacity-70">{desc}</div>
      </div>
    )
  }

  return (
    <div className="px-8 py-6">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold tracking-tight">异常 / SLA</h1>
        <p className="text-[13px] text-ink-3 mt-1">
          {slaBreach} 项 SLA 突破 · {sla50} 项 SLA 50% 警告 · 需立即处理
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <SeverityCard label="SLA 突破" count={slaBreach} color="bg-danger-soft border-danger" desc="超过 SLA 时限" />
        <SeverityCard label="SLA 50% 警告" count={sla50} color="bg-warn-soft border-warn" desc="已消耗 50% SLA" />
        <SeverityCard label="重复驳回" count={rejectedLoop} color="bg-ink-3/10 border-ink-3" desc="被驳回 2 次以上" />
      </div>

      {/* Exception List */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
        <div className="divide-y divide-progress">
          {MOCK_EXCEPTIONS.map((ex) => {
            const pct = Math.min(100, Math.round((ex.hoursElapsed / ex.slaHours) * 100))
            const barColor = pct >= 100 ? 'bg-danger' : pct >= 50 ? 'bg-warn' : 'bg-ignite'
            const isCritical = ex.type === 'sla_breach'
            return (
              <div key={ex.id} className="px-5 py-4 hover:bg-module transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`w-4 h-4 flex items-center justify-center ${isCritical ? 'text-danger' : 'text-warn'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                      </span>
                      <span className="font-mono text-[12px] text-ink font-medium">{ex.incidentNo}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-pure ${isCritical ? 'bg-danger sla-pulse' : 'bg-warn'}`}>
                        {isCritical ? 'SLA 突破' : 'SLA 50%'}
                      </span>
                      <span className="text-[12.5px] text-ink">{ex.title}</span>
                    </div>

                    {/* SLA Progress */}
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-[11px] text-ink-3 mb-1">
                        <span>SLA 进度</span>
                        <span className="font-mono">{ex.hoursElapsed.toFixed(1)}h / {ex.slaHours}h</span>
                        <span className="font-mono font-bold text-danger">{pct}%</span>
                      </div>
                      <div className="w-full max-w-md h-1.5 bg-module rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} sla-pulse rounded-full transition-all`} style={{ width: `${Math.min(100, pct)}%` }}></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-[12px] text-ink-3">
                      <span>处理人: <span className="text-ink">{ex.assignee || '—'}</span></span>
                      <span>当前状态: <span className="text-ink">{ex.currentStatus}</span></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => showToast(`提醒已发送给 ${ex.assignee || '处理人'}`)}
                      className="px-3 py-1.5 rounded-lg border border-progress text-[12px] text-ink-3 hover:bg-module flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                      提醒
                    </button>
                    {isCritical && (
                      <button
                        onClick={() => setShowEscalate(ex.id)}
                        className="px-3 py-1.5 rounded-lg bg-danger text-pure text-[12px] font-medium hover:bg-danger/90 flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                        升级
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {MOCK_EXCEPTIONS.length === 0 && (
            <div className="px-5 py-12 text-center text-[13px] text-ink-3">暂无异常 ✓ 系统运行正常</div>
          )}
        </div>
      </div>

      {/* Escalate Modal */}
      {showEscalate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowEscalate(null)}>
          <div className="bg-pure rounded-2xl shadow-card-hover p-6 w-[400px]" onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-ink mb-1">升级事件</h3>
            <p className="text-[13px] text-ink-3 mb-4">将此事件升级给更高级别处理</p>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-[12px] text-ink-3 font-medium mb-1.5">升级给</label>
                <select className="w-full px-3 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30">
                  <option>IT Manager（默认）</option>
                  <option>IT Director</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-ink-3 font-medium mb-1.5">升级原因</label>
                <textarea rows={3} placeholder="说明升级原因"
                  className="w-full px-4 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 resize-none" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setShowEscalate(null); showToast('已升级通知 IT Manager', 'success') }}
                className="flex-1 py-2.5 rounded-lg bg-danger text-pure text-[13px] font-medium hover:bg-danger/90">
                确认升级
              </button>
              <button onClick={() => setShowEscalate(null)}
                className="px-4 py-2.5 rounded-lg border border-progress text-[13px] hover:bg-module">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
