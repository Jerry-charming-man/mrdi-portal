import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRequest, getRequestAudits, itReview, ownerReview, revokeRequest, withdrawRequest, addComment } from '../../services/permApi'
import { PERM_STATUS, PERM_TYPE, PERM_LEVEL, URGENCY, PERM_AUDIT_TYPE } from '../../types/cimperm'

type TabKey = 'basic' | 'audit' | 'related' | 'incidents'

function fireToast(msg: string, type: 'info' | 'success' | 'error' = 'info') {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type } }))
}

function formatTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 3600000
  if (diff < 1) return `${Math.round(diff * 60)}min 前`
  if (diff < 24) return `${Math.round(diff)}h 前`
  return `${Math.round(diff / 24)}d`
}

function getExpiryHours(expiresAt: string) {
  return Math.max(0, (new Date(expiresAt).getTime() - Date.now()) / 3600000)
}

export default function PermDetail() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabKey>('basic')
  const [comment, setComment] = useState('')
  const [showRenew, setShowRenew] = useState(false)
  const [showRevoke, setShowRevoke] = useState(false)
  const [revokeReason, setRevokeReason] = useState('')
  const [reviewComment, setReviewComment] = useState('')

  const { data: req, isLoading } = useQuery({
    queryKey: ['perm', 'request', id],
    queryFn: () => getRequest(id!),
    enabled: !!id,
  })

  const { data: audits = [] } = useQuery({
    queryKey: ['perm', 'request', id, 'audits'],
    queryFn: () => getRequestAudits(id!),
    enabled: !!id,
  })

  // Mutations
  const itReviewMut = useMutation({
    mutationFn: ({ approved }: { approved: boolean }) => itReview(id!, approved, reviewComment),
    onSuccess: () => {
      fireToast('IT 审核已完成', 'success')
      qc.invalidateQueries({ queryKey: ['perm', 'request', id] })
      qc.invalidateQueries({ queryKey: ['perm', 'requests'] })
      setReviewComment('')
    },
    onError: (e: Error) => fireToast(e.message, 'error'),
  })

  const ownerReviewMut = useMutation({
    mutationFn: ({ approved }: { approved: boolean }) => ownerReview(id!, approved, reviewComment),
    onSuccess: () => {
      fireToast('Owner 核准已完成', 'success')
      qc.invalidateQueries({ queryKey: ['perm', 'request', id] })
      qc.invalidateQueries({ queryKey: ['perm', 'requests'] })
      setReviewComment('')
    },
    onError: (e: Error) => fireToast(e.message, 'error'),
  })

  const revokeMut = useMutation({
    mutationFn: () => revokeRequest(id!, revokeReason),
    onSuccess: () => {
      fireToast('权限已撤销', 'success')
      qc.invalidateQueries({ queryKey: ['perm', 'request', id] })
      qc.invalidateQueries({ queryKey: ['perm', 'requests'] })
      setShowRevoke(false)
      setRevokeReason('')
    },
    onError: (e: Error) => fireToast(e.message, 'error'),
  })

  const withdrawMut = useMutation({
    mutationFn: () => withdrawRequest(id!),
    onSuccess: () => {
      fireToast('申请已撤回', 'info')
      qc.invalidateQueries({ queryKey: ['perm', 'request', id] })
      qc.invalidateQueries({ queryKey: ['perm', 'requests'] })
    },
    onError: (e: Error) => fireToast(e.message, 'error'),
  })

  const commentMut = useMutation({
    mutationFn: () => addComment(id!, comment),
    onSuccess: () => {
      fireToast('评论已添加', 'success')
      setComment('')
      qc.invalidateQueries({ queryKey: ['perm', 'request', id, 'audits'] })
    },
    onError: (e: Error) => fireToast(e.message, 'error'),
  })

  if (isLoading) {
    return <div className="p-6 text-[13px] text-ink-3">加载中...</div>
  }

  if (!req) {
    return <div className="p-6 text-[13px] text-danger">申请不存在</div>
  }

  const sc = PERM_STATUS[req.status]
  const tc = PERM_TYPE[req.permissionType]
  const lc = PERM_LEVEL[req.permissionLevel]
  const uc = URGENCY[req.urgency]

  const expiryHours = getExpiryHours(req.expiresAt)
  const expiryDays = expiryHours / 24

  const isMyRequest = req.applicantEmail === 'zhang@mrdi.example'
  const canWithdraw = isMyRequest && ['pending_it_review', 'pending_owner_review'].includes(req.status)
  const canRenew = ['granted', 'expiring_soon'].includes(req.status) && isMyRequest
  const canRevoke = ['granted', 'expiring_soon'].includes(req.status)
  const canITReview = req.status === 'pending_it_review'
  const canOwnerReview = req.status === 'pending_owner_review'

  function getSlaBar(r: NonNullable<typeof req>) {
    if (r.status === 'granted' || r.status === 'expiring_soon') {
      if (expiryHours < 1) return { bg: 'bg-success-soft border-success/30', icon: '✓', iconBg: 'bg-success', label: '权限生效中', detail: `还剩 ${Math.round(expiryHours * 60)}min 后到期` }
      if (expiryHours < 8) return { bg: 'bg-danger-soft border-danger/30', icon: '⚠', iconBg: 'bg-danger', label: '即将过期', detail: `还剩 ${Math.round(expiryHours)}h 后到期` }
      if (expiryHours < 24) return { bg: 'bg-warn-soft border-warn/30', icon: '⏰', iconBg: 'bg-warn', label: '即将过期', detail: `还剩 ${Math.round(expiryHours)}h 后到期` }
      return { bg: 'bg-success-soft border-success/30', icon: '✓', iconBg: 'bg-success', label: '权限生效中', detail: `还剩 ${expiryDays.toFixed(1)}d 后到期 · ${new Date(r.expiresAt).toLocaleDateString('zh-CN')} 到期` }
    }
    if (r.status === 'pending_it_review') return { bg: 'bg-warn-soft border-warn/30', icon: '⏳', iconBg: 'bg-warn', label: '待 IT 审核', detail: '等待 IT 值班审核' }
    if (r.status === 'pending_owner_review') return { bg: 'bg-indigo/10 border-indigo/30', icon: '⏳', iconBg: 'bg-indigo', label: '待 Owner 核准', detail: '等待系统 Owner 核准' }
    if (r.status === 'pending_grant') return { bg: 'bg-module border-progress', icon: '⏳', iconBg: 'bg-ink-3', label: '待授予', detail: '等待系统执行授权' }
    return { bg: 'bg-module border-progress', icon: '○', iconBg: 'bg-ink-3', label: '已关闭', detail: '' }
  }
  const slaBar = getSlaBar(req)

  const isPending = ['granted', 'expiring_soon', 'pending_it_review', 'pending_owner_review', 'pending_grant'].includes(req.status)

  return (
    <div className="p-6 space-y-5">
      {/* SLA bar */}
      {isPending && (
        <div className={`rounded-2xl border p-4 flex items-center gap-4 ${slaBar.bg}`}>
          <div className={`w-10 h-10 rounded-full ${slaBar.iconBg} text-pure flex items-center justify-center font-bold text-[16px]`}>
            {slaBar.icon}
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-ink">{slaBar.label}</div>
            <div className="text-[12px] text-ink-2 mt-0.5">{slaBar.detail}</div>
          </div>
          <div className="text-[11.5px] text-ink-3 font-mono">{tc.label}</div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-ink-3">
        <Link to="/perm/perm" className="hover:text-ink transition-colors">申请列表</Link>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
        <span>{req.requestNo}</span>
      </div>

      {/* Title + badges + actions */}
      <div className="bg-pure border border-progress rounded-2xl p-5 shadow-card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${sc.bg} ${sc.text} ${sc.pulse ? 'sla-pulse' : ''}`}>{sc.label}</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${tc.bg} ${tc.text}`}>{tc.label}</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${lc.bg} ${lc.text}`}>{lc.label}</span>
              {req.urgency !== 'normal' && (
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${uc.bg} ${uc.text}`}>{uc.label}</span>
              )}
            </div>
            <h1 className="text-[22px] font-semibold text-ink">
              {req.targetSystem} <span className="text-ink-3">/</span>{' '}
              <span className="font-mono text-[18px]">{req.resourceId.split(':').pop()}</span>
            </h1>
            <p className="text-[13px] text-ink-3 mt-1">
              {req.applicantName}（{req.applicantDept}）申请 · {formatTime(req.createdAt)} · 有效期 {req.requestedDuration}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setActiveTab('basic')} className="px-3.5 py-2 rounded-lg border border-progress text-[13px] hover:bg-module transition-colors">
              添加评论
            </button>
            {canRevoke && (
              <button onClick={() => setShowRevoke(true)} className="px-3.5 py-2 rounded-lg border border-danger/30 text-danger bg-danger-soft text-[13px] hover:bg-danger/10 transition-colors">
                撤销权限
              </button>
            )}
            {canRenew && (
              <button onClick={() => setShowRenew(true)} className="px-5 py-2.5 bg-research text-pure text-[13px] font-medium rounded-lg hover:bg-research/90 shadow-card transition-colors">
                续期
              </button>
            )}
            {canWithdraw && (
              <button
                onClick={() => withdrawMut.mutate()}
                disabled={withdrawMut.isPending}
                className="px-3.5 py-2 rounded-lg border border-progress text-[13px] hover:bg-module transition-colors disabled:opacity-50"
              >
                撤回申请
              </button>
            )}
          </div>
        </div>

        {/* IT Review controls */}
        {canITReview && (
          <div className="mb-3 p-3 bg-warn-soft/30 rounded-xl border border-warn/20">
            <div className="text-[12px] font-medium text-warn mb-2">IT 审核</div>
            <textarea
              rows={2}
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              placeholder="审核意见（可选）..."
              className="w-full px-3 py-2 bg-pure rounded-lg text-[12.5px] mb-2 resize-none focus:outline-none focus:ring-1 focus:ring-warn/30"
            />
            <div className="flex gap-2">
              <button
                onClick={() => itReviewMut.mutate({ approved: true })}
                disabled={itReviewMut.isPending}
                className="px-4 py-1.5 rounded-lg bg-success text-pure text-[12px] font-medium hover:bg-success/90 disabled:opacity-50 transition-colors"
              >
                通过
              </button>
              <button
                onClick={() => itReviewMut.mutate({ approved: false })}
                disabled={itReviewMut.isPending}
                className="px-4 py-1.5 rounded-lg border border-danger text-danger text-[12px] hover:bg-danger-soft disabled:opacity-50 transition-colors"
              >
                驳回
              </button>
            </div>
          </div>
        )}

        {/* Owner Review controls */}
        {canOwnerReview && (
          <div className="mb-3 p-3 bg-indigo/10 rounded-xl border border-indigo/20">
            <div className="text-[12px] font-medium text-indigo mb-2">Owner 核准</div>
            <textarea
              rows={2}
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              placeholder="核准意见（可选）..."
              className="w-full px-3 py-2 bg-pure rounded-lg text-[12.5px] mb-2 resize-none focus:outline-none focus:ring-1 focus:ring-indigo/30"
            />
            <div className="flex gap-2">
              <button
                onClick={() => ownerReviewMut.mutate({ approved: true })}
                disabled={ownerReviewMut.isPending}
                className="px-4 py-1.5 rounded-lg bg-success text-pure text-[12px] font-medium hover:bg-success/90 disabled:opacity-50 transition-colors"
              >
                核准
              </button>
              <button
                onClick={() => ownerReviewMut.mutate({ approved: false })}
                disabled={ownerReviewMut.isPending}
                className="px-4 py-1.5 rounded-lg border border-danger text-danger text-[12px] hover:bg-danger-soft disabled:opacity-50 transition-colors"
              >
                驳回
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-t border-progress pt-4 flex items-center gap-1">
          {(['basic', 'audit', 'related', 'incidents'] as TabKey[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-all ${
                activeTab === tab ? 'bg-ink text-pure' : 'text-ink-3 hover:text-ink hover:bg-module'
              }`}
            >
              {tab === 'basic' ? '基本信息' : tab === 'audit' ? `审计(${audits.length})` : tab === 'related' ? '关联需求' : '关联案件'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'basic' && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-5">
            {/* Reason */}
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
              <h3 className="text-[13px] font-semibold text-ink mb-3">申请理由</h3>
              <p className="text-[13px] text-ink-2 leading-relaxed">{req.reason}</p>
              {req.rejectReason && (
                <div className="mt-3 p-3 bg-danger-soft/30 rounded-lg border border-danger/20">
                  <div className="text-[12px] font-medium text-danger mb-1">驳回原因</div>
                  <p className="text-[12.5px] text-ink-2">{req.rejectReason}</p>
                </div>
              )}
              {req.revokeReason && (
                <div className="mt-3 p-3 bg-warn-soft/30 rounded-lg border border-warn/20">
                  <div className="text-[12px] font-medium text-warn mb-1">撤销原因</div>
                  <p className="text-[12.5px] text-ink-2">{req.revokeReason}</p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
              <h3 className="text-[13px] font-semibold text-ink mb-4">流转时间轴</h3>
              {audits.length === 0 && (
                <div className="text-[13px] text-ink-3 text-center py-4">暂无流转记录</div>
              )}
              <div className="space-y-3">
                {[...audits].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((a, i) => {
                  const evtCfg = PERM_AUDIT_TYPE[a.eventType] || PERM_AUDIT_TYPE.comment
                  const isLast = i === 0
                  const dotBg = (evtCfg.bg as string).replace('/10', '')
                  return (
                    <div key={a.id} className="flex gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${dotBg} text-pure`}>
                        {evtCfg.label[0]}
                      </div>
                      <div className={`flex-1 pb-3 ${!isLast ? 'border-l border-progress pl-4 -ml-3.5' : ''}`}>
                        <div className="text-[12.5px] text-ink-2 -ml-4">
                          {a.actorName} {evtCfg.label}
                          {a.comment && <span className="text-ink-3 ml-1">· {a.comment}</span>}
                        </div>
                        <div className="text-[11px] text-ink-3 mt-0.5 -ml-4">
                          {formatTime(a.createdAt)}
                          {a.metadata && 'grantId' in a.metadata && (
                            <span className="ml-1">· 调 MDM grant_id = {a.metadata.grantId as string}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Comment */}
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
              <h3 className="text-[13px] font-semibold text-ink mb-3">评论</h3>
              <textarea
                rows={3}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="添加评论..."
                className="w-full px-4 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-research/30 resize-none placeholder:text-ink-5"
              />
              <button
                onClick={() => comment.trim() && commentMut.mutate()}
                disabled={!comment.trim() || commentMut.isPending}
                className="mt-2 px-4 py-1.5 bg-research text-pure text-[12px] rounded-lg hover:bg-research/90 disabled:opacity-50 transition-colors"
              >
                发送
              </button>
            </div>
          </div>

          {/* Right 1/3 */}
          <div className="space-y-4">
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
              <h3 className="text-[13px] font-semibold text-ink mb-3">关键信息</h3>
              <dl className="space-y-2.5 text-[12.5px]">
                {[
                  ['目标系统', req.targetSystem],
                  ['资源对象', <span key="res" className="font-mono text-[11.5px]">{req.resourceId}</span>],
                  ['类型 / 级别', `${tc.label} / ${lc.label}`],
                  ['有效期', req.requestedDuration],
                  ['到期时间', new Date(req.expiresAt).toLocaleDateString('zh-CN')],
                  ['IT 审核', req.itReviewerName || req.itReviewerEmail || '-'],
                  ['IT 审核时间', req.itReviewedAt ? formatTime(req.itReviewedAt) : '-'],
                  ['Owner 核准', req.ownerReviewerName || req.ownerReviewerEmail || '-'],
                  ['Owner 核准时间', req.ownerReviewedAt ? formatTime(req.ownerReviewedAt) : '-'],
                  ['MDM grant_id', req.grantId ? <span key="gid" className="font-mono text-[11px] text-research">{req.grantId}</span> : '-'],
                  ['关联需求', req.relatedRequestId ? <span key="rq" className="font-mono text-[11.5px] text-research">{req.relatedRequestId}</span> : '-'],
                  ['关联案件', req.relatedIncidentId ? <span key="ri" className="font-mono text-[11.5px] text-research">{req.relatedIncidentId}</span> : '-'],
                  ['提交时间', formatTime(req.createdAt)],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between items-start gap-2">
                    <dt className="text-ink-3 flex-shrink-0">{k}</dt>
                    <dd className="text-ink text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
              <h3 className="text-[13px] font-semibold text-ink mb-3">到期提醒</h3>
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between"><span className="text-ink-3">24h 提醒</span><span className="text-success font-medium">已配置</span></div>
                <div className="flex justify-between"><span className="text-ink-3">自动回收</span><span className="text-success font-medium">已配置</span></div>
                <div className="text-[11px] text-ink-3 mt-3 pt-2 border-t border-progress">
                  到期前 24h 通知 + 自动回收{req.relatedRequestId ? ` · 关联 NC-${req.relatedRequestId.split('-').pop()} 关闭时优先检查` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
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
              {audits.map(a => {
                const evtCfg = PERM_AUDIT_TYPE[a.eventType] || PERM_AUDIT_TYPE.comment
                return (
                  <tr key={a.id} className="row-hover">
                    <td className="px-5 py-3 text-ink-3 font-mono text-[11.5px]">
                      {new Date(a.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-3 py-3 font-mono text-ink-2">{req.requestNo}</td>
                    <td className="px-3 py-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10.5px] font-medium ${evtCfg.bg} ${evtCfg.text}`}>{evtCfg.label}</span>
                    </td>
                    <td className="px-3 py-3 text-ink-2">{a.actorName}</td>
                    <td className="px-3 py-3 text-ink-2">
                      {a.comment || (a.metadata ? JSON.stringify(a.metadata) : '-')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'related' && (
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-8 text-center">
          <p className="text-[13px] text-ink-3">暂无关联需求</p>
          {req.relatedRequestId && (
            <p className="text-[13px] text-research mt-2">关联：{req.relatedRequestId}</p>
          )}
        </div>
      )}

      {activeTab === 'incidents' && (
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-8 text-center">
          <p className="text-[13px] text-ink-3">暂无关联案件</p>
          {req.relatedIncidentId && (
            <p className="text-[13px] text-research mt-2">关联：{req.relatedIncidentId}</p>
          )}
        </div>
      )}

      {/* Renew modal */}
      {showRenew && (
        <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50">
          <div className="bg-pure rounded-2xl p-6 w-[420px] shadow-xl border border-progress">
            <h3 className="text-[16px] font-bold text-ink mb-4">续期权限</h3>
            <p className="text-[13px] text-ink-3 mb-4">选择新的有效期（续期功能开发中）：</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['7d', '30d', '90d'].map(d => (
                <button key={d}
                  onClick={() => { fireToast('续期功能开发中', 'info'); setShowRenew(false) }}
                  className="py-2.5 bg-module border border-progress rounded-lg text-[13px] hover:border-research hover:text-research transition-colors">
                  {d}
                </button>
              ))}
            </div>
            <button onClick={() => setShowRenew(false)} className="w-full py-2.5 border border-progress rounded-lg text-[13px] hover:bg-module transition-colors">
              取消
            </button>
          </div>
        </div>
      )}

      {/* Revoke modal */}
      {showRevoke && (
        <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50">
          <div className="bg-pure rounded-2xl p-6 w-[420px] shadow-xl border border-progress">
            <h3 className="text-[16px] font-bold text-danger mb-4">撤销权限</h3>
            <p className="text-[13px] text-ink-3 mb-4">请输入撤销原因（必填）：</p>
            <textarea
              rows={3}
              value={revokeReason}
              onChange={e => setRevokeReason(e.target.value)}
              placeholder="撤销原因..."
              className="w-full px-4 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-danger/30 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowRevoke(false)} className="flex-1 py-2.5 border border-progress rounded-lg text-[13px] hover:bg-module transition-colors">
                取消
              </button>
              <button
                disabled={!revokeReason.trim() || revokeMut.isPending}
                onClick={() => revokeMut.mutate()}
                className="flex-1 py-2.5 bg-danger text-pure rounded-lg text-[13px] font-medium hover:bg-danger/90 disabled:opacity-50 transition-colors"
              >
                确认撤销
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
