import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { MOCK_INCIDENTS, STATUS_CONFIG, INCIDENT_URGENCY, INCIDENT_TYPE, INCIDENT_IMPACT, ENGINEER_TYPE } from '../../types/cimims'
import { useRole } from '../../utils/auth'

type TabKey = 'basic' | 'timeline' | 'feedback' | 'related' | 'audit'

export default function CimimsIncidentDetail() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<TabKey>('basic')
  const [timelineText, setTimelineText] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const { isEditor } = useRole()

  const toast = (msg: string) => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type: 'info' } }))
  }

  const inc = MOCK_INCIDENTS.find(i => i.id === id) || MOCK_INCIDENTS[0]
  const statusCfg = STATUS_CONFIG[inc.status] || { label: inc.status, bg: 'bg-module', text: 'text-ink-3' }
  const urgencyCfg = INCIDENT_URGENCY[inc.urgency] || INCIDENT_URGENCY.P3
  const typeCfg = INCIDENT_TYPE[inc.type as keyof typeof INCIDENT_TYPE] || INCIDENT_TYPE.OTHER
  const impactCfg = INCIDENT_IMPACT[inc.impactScope as keyof typeof INCIDENT_IMPACT] || { label: inc.impactScope }

  const elapsed = (Date.now() - new Date(inc.createdAt).getTime()) / 3600000
  const sla = inc.slaHours || 4
  const pct = Math.min(100, (elapsed / sla) * 100)
  const slaRemaining = sla - elapsed
  const slaColor = pct >= 100 ? 'bg-danger' : pct >= 50 ? 'bg-warn' : 'bg-ignite'
  const slaTextColor = pct >= 100 ? 'text-danger' : pct >= 50 ? 'text-warn' : 'text-ignite'

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'basic', label: '基本信息' },
    { key: 'timeline', label: '时间线', count: inc.timeline?.length || 0 },
    { key: 'feedback', label: '用户反馈' },
    { key: 'related', label: '关联需求' },
    { key: 'audit', label: '审计' },
  ]

  return (
    <div className="px-8 py-6">

      {/* SLA Countdown Bar */}
      {inc.status !== 'closed' && (
        <div className={`rounded-xl p-4 mb-5 ${pct >= 100 ? 'bg-danger-soft border border-danger/20' : pct >= 50 ? 'bg-warn-soft border border-warn/20' : 'bg-ignite-soft border border-ignite/20'}`}>
          <div className="flex items-center gap-3 mb-2">
            {pct >= 100 ? (
              <svg className="w-5 h-5 text-danger sla-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            ) : pct >= 50 ? (
              <svg className="w-5 h-5 text-warn" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            ) : (
              <svg className="w-5 h-5 text-ignite" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            )}
            <span className={`text-[13px] font-medium ${slaTextColor}`}>
              {pct >= 100 ? `SLA 已突破 · 已升级通知 IT Manager` : pct >= 50 ? `SLA 警告 · 距关闭剩 ${slaRemaining.toFixed(1)}h · 已提醒值班` : `SLA 正常 · 距关闭剩 ${slaRemaining.toFixed(1)}h`}
            </span>
          </div>
          <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden">
            <div className={`h-full ${slaColor} sla-pulse rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[13px] text-ignite font-semibold">{inc.incidentNo}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-pure font-mono ${urgencyCfg.bg}`}>{urgencyCfg.code}</span>
              {inc.impactScope === 'fab' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-pure bg-danger sla-pulse">Fab 级</span>}
              <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${statusCfg.bg} ${statusCfg.text}`}>{statusCfg.label}</span>
            </div>
            <h1 className="text-[22px] font-semibold text-ink mb-1">{inc.title}</h1>
            <p className="text-[13px] text-ink-3">{inc.submitterName} 上报 · {
              (() => {
                const diff = Date.now() - new Date(inc.createdAt).getTime()
                const h = Math.floor(diff / 3600000)
                return h < 1 ? `${Math.floor(diff / 60000)}min 前` : `${h}h 前`
              })()
            }</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="px-3 py-2 rounded-lg border border-progress text-[13px] hover:bg-module flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              联系
            </button>
            {/* 接单/转派 → editor+（duty 权限） */}
            {inc.status === 'pending_takeover' && isEditor && (
              <>
                <button onClick={() => setShowTransfer(true)} className="px-3 py-2 rounded-lg border border-progress text-[13px] hover:bg-module">转派</button>
                <button onClick={() => toast('接单成功！')} className="px-4 py-2 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2">接单</button>
              </>
            )}
            {/* 标记完成 → editor+ */}
            {inc.status === 'processing' && isEditor && (
              <>
                <button onClick={() => setShowTransfer(true)} className="px-3 py-2 rounded-lg border border-progress text-[13px] hover:bg-module">转派</button>
                <button onClick={() => toast('请在 Sprint 2 完成')} className="px-4 py-2 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2">标记完成</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-pure rounded-xl shadow-card border border-progress/60 p-1 w-fit">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition ${activeTab === tab.key ? 'bg-ignite text-pure' : 'text-ink-3 hover:text-ink hover:bg-module'}`}>
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && <span className="ml-1 font-mono text-[11px] opacity-70">({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-3 gap-5">

        {/* Main */}
        <div className="col-span-2 space-y-5">

          {activeTab === 'basic' && (
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6">
              <h3 className="text-[14px] font-semibold text-ink mb-4">事件描述</h3>
              <div className="prose prose-sm max-w-none text-[13.5px] text-ink leading-relaxed whitespace-pre-wrap">{inc.description}</div>
              <div className="mt-5 pt-5 border-t border-progress">
                <div className="text-[12px] text-ink-3 font-medium mb-2">附件</div>
                <button onClick={() => toast('附件下载在 Sprint 2 上线')} className="px-3 py-2 rounded-lg border border-progress text-[12px] text-ink-3 hover:bg-module flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                  暂无附件
                </button>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6">
              <h3 className="text-[14px] font-semibold text-ink mb-4">处理时间线</h3>
              <div className="relative">
                {(inc.timeline || []).length === 0 && (
                  <div className="text-center py-8 text-ink-3 text-[13px]">暂无处理记录</div>
                )}
                {(inc.timeline || []).map((entry, i) => {
                  const isLast = i === (inc.timeline || []).length - 1
                  return (
                    <div key={entry.id} className="flex gap-3 pb-6 relative">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full border-2 ${isLast ? 'border-ignite bg-ignite' : 'border-progress'}`}></div>
                        {!isLast && <div className="w-0.5 flex-1 bg-progress mt-1"></div>}
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-ink">{entry.action}</div>
                        <div className="text-[12px] text-ink-3 mt-0.5">{entry.actorName}</div>
                        {entry.detail && <div className="text-[12px] text-ink-4 mt-0.5">{entry.detail}</div>}
                        <div className="text-[11px] text-ink-4 font-mono mt-1">{new Date(entry.createdAt).toLocaleString('zh-CN')}</div>
                      </div>
                    </div>
                  )
                })}
                <div className="flex gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-warn border-2 border-warn animate-pulse"></div>
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-ink">当前状态</div>
                    <div className="text-[12px] text-warn mt-0.5">{statusCfg.label}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6">
              <h3 className="text-[14px] font-semibold text-ink mb-4">用户反馈</h3>
              <div className="text-[13px] text-ink-3">暂无用户反馈记录。</div>
            </div>
          )}

          {activeTab === 'related' && (
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6">
              <h3 className="text-[14px] font-semibold text-ink mb-4">关联需求</h3>
              <div className="text-[13px] text-ink-3">暂无关联的 CIM-RMS 需求。</div>
              <button onClick={() => toast('关联需求在 Sprint 2 上线')} className="mt-4 px-4 py-2 rounded-lg border border-progress text-[13px] hover:bg-module">
                + 关联 CIM-RMS 需求
              </button>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6">
              <h3 className="text-[14px] font-semibold text-ink mb-4">审计记录</h3>
              <div className="text-[13px] text-ink-3">审计记录在 Sprint 2 上线。</div>
            </div>
          )}

          {/* Add Timeline Entry */}
          <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
            <h4 className="text-[13px] font-semibold text-ink mb-3">添加时间线条目</h4>
            <textarea
              value={timelineText}
              onChange={e => setTimelineText(e.target.value)}
              placeholder="已重启服务 / 已联系 DBA / 等用户反馈…"
              rows={3}
              className="w-full px-4 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 focus:bg-pure resize-none mb-3"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-[12px] text-ink-3 cursor-pointer">
                <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)}
                  className="w-4 h-4 rounded border-progress text-ignite focus:ring-ignite/30" />
                内部备注（上报人不可见）
              </label>
              <button
                onClick={() => { if (timelineText.trim()) { toast('时间线条目已添加'); setTimelineText('') } }}
                className="px-4 py-2 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2"
              >
                添加
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
            <h3 className="text-[13px] font-semibold text-ink mb-4">关键信息</h3>
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between"><span className="text-ink-3">类型</span><span className={`font-medium ${typeCfg.text}`}>{typeCfg.label}</span></div>
              <div className="flex justify-between"><span className="text-ink-3">紧急程度</span><span className={`font-mono font-bold ${urgencyCfg.text}`}>{urgencyCfg.code}</span></div>
              <div className="flex justify-between"><span className="text-ink-3">影响范围</span><span className={`font-medium ${inc.impactScope === 'fab' ? 'text-danger' : 'text-ink'}`}>{impactCfg.label}</span></div>
              <div className="flex justify-between"><span className="text-ink-3">上报人</span><span className="text-ink">{inc.submitterName}</span></div>
              <div className="flex justify-between"><span className="text-ink-3">处理人</span><span className="text-ink">{inc.dutyName || '—'}</span></div>
              {inc.engineerName && <div className="flex justify-between"><span className="text-ink-3">工程师</span><span className="text-ink">{inc.engineerName}</span></div>}
              {inc.engineerType && <div className="flex justify-between"><span className="text-ink-3">工程师类型</span><span className={`font-medium ${ENGINEER_TYPE[inc.engineerType]?.color || 'text-ink'}`}>{ENGINEER_TYPE[inc.engineerType]?.label}</span></div>}
              {inc.relatedSystem && <div className="flex justify-between"><span className="text-ink-3">关联系统</span><span className="text-ink">{inc.relatedSystem}</span></div>}
              <div className="flex justify-between"><span className="text-ink-3">SLA</span><span className="text-ink font-mono">{sla}h</span></div>
            </div>
          </div>

          <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
            <h3 className="text-[13px] font-semibold text-ink mb-3">SLA 监控</h3>
            <div className="space-y-2">
              {[
                { label: '响应', pct: Math.min(100, (elapsed / (inc.responseSlaHours || 1)) * 100), color: slaColor },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-[11px] text-ink-3 mb-1">
                    <span>{s.label}</span><span className={`font-mono ${slaTextColor}`}>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-module rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} sla-pulse rounded-full`} style={{ width: `${s.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowTransfer(false)}>
          <div className="bg-pure rounded-2xl shadow-card-hover p-6 w-[420px]" onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-ink mb-1">转派给工程师</h3>
            <p className="text-[13px] text-ink-3 mb-4">选择工程师类型和具体人员</p>
            <div className="space-y-2 mb-5">
              {Object.entries(ENGINEER_TYPE).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-3 p-3 rounded-xl border border-progress hover:border-ignite/50 hover:bg-ignite-soft/20 cursor-pointer transition">
                  <span className={`w-3 h-3 rounded-full ${cfg.color.replace('text-', 'bg-')}`}></span>
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-ink">{cfg.label}</div>
                    <div className="text-[11px] text-ink-3">{cfg.team}</div>
                  </div>
                  <button onClick={() => { setShowTransfer(false); toast(`已转派给 ${cfg.label}`) }}
                    className="px-3 py-1.5 rounded-lg bg-ignite text-pure text-[12px] font-medium hover:bg-ignite-2">
                    选择
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowTransfer(false)} className="w-full py-2.5 rounded-lg border border-progress text-[13px] hover:bg-module">
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
