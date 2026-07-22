import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MOCK_REQUESTS, REQUEST_TYPE, URGENCY, STATUS_CONFIG } from '../../types/cimrms'
import { useRole } from '../../utils/auth'

type TabKey = 'basic' | 'history' | 'uat' | 'permissions' | 'incidents'

export default function CimrmsRequestDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('basic')
  const [comment, setComment] = useState('')
  const { isAuditor, isEditor } = useRole()

  const showToast = (msg: string, type = 'info') => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type } }))
  }

  const req = MOCK_REQUESTS.find(r => r.id === id) || MOCK_REQUESTS[0]
  const statusCfg = STATUS_CONFIG[req.status] || { label: req.status, bg: 'bg-module', text: 'text-ink-3' }
  const urgencyCfg = URGENCY[req.urgency] || URGENCY.P3
  const typeLabel = REQUEST_TYPE[req.type as keyof typeof REQUEST_TYPE]?.label || req.type

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'basic', label: '基本信息' },
    { key: 'history', label: '流转历史', count: req.events?.length || 0 },
    { key: 'uat', label: 'UAT 反馈' },
    { key: 'permissions', label: '关联权限' },
    { key: 'incidents', label: '关联案件' },
  ]

  function handleAction(action: string) {
    showToast(`${action} 操作在 Sprint 2 上线`, 'info')
  }

  return (
    <div className="px-8 py-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] mb-5">
        <button onClick={() => navigate('/cimrms/requests')} className="text-ink-3 hover:text-ink">需求列表</button>
        <svg className="w-3.5 h-3.5 text-ink-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
        <span className="font-mono text-ink-3">{req.requestNo}</span>
      </div>

      {/* Header */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[13px] text-ignite font-semibold">{req.requestNo}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-pure font-mono ${urgencyCfg.bg}`}>{urgencyCfg.code}</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${statusCfg.bg} ${statusCfg.text}`}>{statusCfg.label}</span>
            </div>
            <h1 className="text-[22px] font-semibold text-ink mb-1">{req.title}</h1>
            <p className="text-[13px] text-ink-3">
              {req.submitterName} 提交 · {req.relatedSystem || '—'} · {(() => {
                const diff = Date.now() - new Date(req.createdAt).getTime()
                const h = Math.floor(diff / 3600000)
                if (h < 1) return `${Math.floor(diff / 60000)}min 前`
                if (h < 24) return `${h}h 前`
                return `${Math.floor(h / 24)}d 前`
              })()}
            </p>
          </div>
          {/* Action buttons — role-gated */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 任何人都能评论 */}
            <button
              onClick={() => { if (comment) handleAction('评论'); }}
              className="px-3 py-2 rounded-lg border border-progress text-[13px] hover:bg-module flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              评论
            </button>

            {/* 主管审批 → auditor+ */}
            {req.status === 'pending_manager' && isAuditor && (
              <>
                <button
                  onClick={() => handleAction('驳回')}
                  className="px-4 py-2 rounded-lg border border-danger text-danger text-[13px] hover:bg-danger-soft"
                >
                  驳回
                </button>
                <button
                  onClick={() => handleAction('通过')}
                  className="px-4 py-2 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2"
                >
                  通过
                </button>
              </>
            )}

            {/* 开发完成 → assignee/admin（本 demo：editor+ 可见） */}
            {req.status === 'in_development' && isEditor && (
              <button
                onClick={() => handleAction('开发完成')}
                className="px-4 py-2 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2"
              >
                开发完成
              </button>
            )}

            {/* UAT → 提交人（本 demo：editor+ 可见） */}
            {req.status === 'pending_uat' && isEditor && (
              <>
                <button
                  onClick={() => handleAction('UAT 失败')}
                  className="px-3 py-2 rounded-lg border border-danger text-danger text-[13px] hover:bg-danger-soft"
                >
                  UAT 失败
                </button>
                <button
                  onClick={() => handleAction('UAT 通过')}
                  className="px-4 py-2 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2"
                >
                  UAT 通过
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-pure rounded-xl shadow-card border border-progress/60 p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition ${activeTab === tab.key ? 'bg-ignite text-pure' : 'text-ink-3 hover:text-ink hover:bg-module'}`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1 font-mono text-[11px] opacity-70">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-3 gap-5">

        {/* Main content */}
        <div className="col-span-2 space-y-5">

          {activeTab === 'basic' && (
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6">
              <h3 className="text-[14px] font-semibold text-ink mb-4">需求描述</h3>
              <div className="prose prose-sm max-w-none text-[13.5px] text-ink leading-relaxed whitespace-pre-wrap">
                {req.description}
              </div>
              <div className="mt-5 pt-5 border-t border-progress">
                <div className="text-[12px] text-ink-3 font-medium mb-2">附件</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => showToast('附件下载在 Sprint 2 上线', 'info')}
                    className="px-3 py-2 rounded-lg border border-progress text-[12px] text-ink-3 hover:bg-module flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                    </svg>
                    SPC数据截图.png
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6">
              <h3 className="text-[14px] font-semibold text-ink mb-4">流转历史</h3>
              <div className="relative">
                {(req.events || []).length === 0 && (
                  <div className="text-center py-8 text-ink-3 text-[13px]">暂无流转记录</div>
                )}
                {(req.events || []).map((ev, i) => {
                  const isLast = i === (req.events || []).length - 1
                  return (
                    <div key={ev.id} className="flex gap-3 pb-6 relative">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full border-2 ${isLast ? 'border-ignite bg-ignite' : 'border-progress'}`}></div>
                        {!isLast && <div className="w-0.5 flex-1 bg-progress mt-1"></div>}
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-ink">{ev.event}</div>
                        <div className="text-[12px] text-ink-3 mt-0.5">{ev.actorName}</div>
                        {ev.detail && <div className="text-[12px] text-ink-4 mt-0.5">{ev.detail}</div>}
                        <div className="text-[11px] text-ink-4 font-mono mt-1">
                          {new Date(ev.createdAt).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {/* Current state marker */}
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

          {activeTab === 'uat' && (
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6">
              <h3 className="text-[14px] font-semibold text-ink mb-4">UAT 反馈</h3>
              {req.status === 'pending_uat' ? (
                <div className="text-[13px] text-ink-3">UAT 测试正在等待提交人验证。</div>
              ) : (
                <div className="text-[13px] text-ink-3">UAT 尚未开始（需求当前状态：{statusCfg.label}）</div>
              )}
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6">
              <h3 className="text-[14px] font-semibold text-ink mb-4">关联权限</h3>
              <div className="text-[13px] text-ink-3 mb-4">暂无关联的权限申请。</div>
              <button
                onClick={() => showToast('关联权限申请在 Sprint 2 上线', 'info')}
                className="px-4 py-2 rounded-lg border border-progress text-[13px] hover:bg-module"
              >
                + 申请关联权限
              </button>
            </div>
          )}

          {activeTab === 'incidents' && (
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6">
              <h3 className="text-[14px] font-semibold text-ink mb-4">关联案件</h3>
              <div className="text-[13px] text-ink-3">暂无关联的 CIM-IMS 案件。</div>
            </div>
          )}

          {/* Comment Input */}
          <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
            <h4 className="text-[13px] font-semibold text-ink mb-3">添加评论</h4>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="输入评论内容，支持 @人 @部门…"
              rows={3}
              className="w-full px-4 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 focus:bg-pure resize-none mb-3"
            />
            <button
              onClick={() => { if (comment.trim()) { handleAction('评论'); setComment('') } }}
              className="px-4 py-2 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2"
            >
              发送评论
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
            <h3 className="text-[13px] font-semibold text-ink mb-4">关键信息</h3>
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-ink-3">类型</span>
                <span className="text-ink font-medium">{typeLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">关联系统</span>
                <span className="text-ink">{req.relatedSystem || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">紧急程度</span>
                <span className={`font-mono font-bold ${urgencyCfg.text}`}>{urgencyCfg.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">提交人</span>
                <span className="text-ink">{req.submitterName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">处理人</span>
                <span className="text-ink">{req.assigneeName || '—'}</span>
              </div>
              {req.expectedDate && (
                <div className="flex justify-between">
                  <span className="text-ink-3">期望完成</span>
                  <span className="text-ink">{req.expectedDate}</span>
                </div>
              )}
              {req.team && (
                <div className="flex justify-between">
                  <span className="text-ink-3">团队</span>
                  <span className="text-ink">{req.team}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-ink-3">SLA</span>
                <span className="text-ink">{req.slaHours}h</span>
              </div>
            </div>
          </div>

          <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
            <h3 className="text-[13px] font-semibold text-ink mb-3">快速操作</h3>
            <div className="space-y-1.5">
              <button
                onClick={() => handleAction('复制链接')}
                className="w-full px-3 py-2 rounded-lg text-[12.5px] text-ink-3 hover:bg-module text-left flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                复制链接
              </button>
              <button
                onClick={() => showToast('Sprint 2 上线', 'info')}
                className="w-full px-3 py-2 rounded-lg text-[12.5px] text-ink-3 hover:bg-module text-left flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                查看地图定位
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
