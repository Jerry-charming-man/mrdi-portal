import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { INCIDENT_TYPE, INCIDENT_URGENCY, INCIDENT_IMPACT } from '../../types/cimims'

const relatedSystems = ['MES', 'SPC', 'ERP', 'MDM', 'CIM-IMS', '其他']

export default function CimimsIncidentsNew() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    type: 'system',
    urgency: 'P2',
    impactScope: 'user',
    relatedSystem: '',
    description: '',
    relatedRequestId: '',
    files: [] as string[],
  })
  const [submitting, setSubmitting] = useState(false)

  const toast = (msg: string, type = 'info') => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type } }))
  }

  const canSubmit = form.title.trim() && form.description.trim()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))
    setSubmitting(false)
    toast('事件上报成功！INC-2026-0288 已创建', 'success')
    navigate('/cimims/incidents')
  }

  function updateField(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="px-8 py-6 max-w-4xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] mb-5">
        <button onClick={() => navigate('/cimims/incidents')} className="text-ink-3 hover:text-ink">事件列表</button>
        <svg className="w-3.5 h-3.5 text-ink-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
        <span className="font-medium text-ink">上报新事件</span>
      </div>

      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">上报新事件</h1>
          <p className="text-[13px] text-ink-3 mt-1">IT 报案管理 · 上报后将自动通知 IT 值班</p>
        </div>
        {form.impactScope === 'fab' && (
          <div className="px-4 py-2 bg-danger-soft border border-danger/20 rounded-xl text-[13px] text-danger font-medium flex items-center gap-2">
            <svg className="w-4 h-4 sla-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            Fab 级影响将自动提升为 P1 阻断
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Basic Info */}
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6">
          <h3 className="text-[14px] font-semibold text-ink mb-4">基本信息</h3>
          <div className="space-y-4">

            <div>
              <label className="block text-[12px] text-ink-3 font-medium mb-1.5">
                事件标题 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => updateField('title', e.target.value)}
                placeholder="简明描述问题，例如：MES 报表模块无法打开"
                className="w-full px-4 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 focus:bg-pure"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] text-ink-3 font-medium mb-1.5">
                  事件类型 <span className="text-danger">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={e => updateField('type', e.target.value)}
                  className="w-full px-3 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 focus:bg-pure"
                >
                  {Object.entries(INCIDENT_TYPE).map(([, v]) => (
                    <option key={v.code} value={v.code}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-ink-3 font-medium mb-1.5">
                  紧急程度 <span className="text-danger">*</span>
                  {form.impactScope === 'fab' && <span className="text-danger ml-1">(已自动提升)</span>}
                </label>
                <select
                  value={form.urgency}
                  onChange={e => updateField('urgency', e.target.value)}
                  disabled={form.impactScope === 'fab'}
                  className="w-full px-3 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 focus:bg-pure disabled:opacity-60"
                >
                  {Object.entries(INCIDENT_URGENCY).map(([, v]) => (
                    <option key={v.code} value={v.code}>{v.code} · {v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-ink-3 font-medium mb-1.5">
                  影响范围 <span className="text-danger">*</span>
                </label>
                <select
                  value={form.impactScope}
                  onChange={e => updateField('impactScope', e.target.value)}
                  className="w-full px-3 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 focus:bg-pure"
                >
                  {Object.entries(INCIDENT_IMPACT).map(([, v]) => (
                    <option key={v.code} value={v.code}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] text-ink-3 font-medium mb-1.5">关联系统</label>
                <select
                  value={form.relatedSystem}
                  onChange={e => updateField('relatedSystem', e.target.value)}
                  className="w-full px-3 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 focus:bg-pure"
                >
                  <option value="">选择系统</option>
                  {relatedSystems.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-ink-3 font-medium mb-1.5">关联 CIM-RMS 需求</label>
                <input
                  type="text"
                  value={form.relatedRequestId}
                  onChange={e => updateField('relatedRequestId', e.target.value)}
                  placeholder="NC-2026-XXXX"
                  className="w-full px-4 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 focus:bg-pure"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] text-ink-3 font-medium mb-1.5">
                详细描述 <span className="text-danger">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={e => updateField('description', e.target.value)}
                rows={5}
                placeholder={"现象描述 + 出现时间 + 影响范围 + 复现步骤\n\n例如：\n- 现象：MES 报表页面加载失败\n- 时间：07/15 07:30 发现\n- 影响：Fab-1 PE 无法查看日报\n- 复现：每次刷新均失败"}
                className="w-full px-4 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 focus:bg-pure resize-none"
              />
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6">
          <h3 className="text-[14px] font-semibold text-ink mb-4">附件（可选）</h3>
          <div
            className="w-full px-4 py-6 border-2 border-dashed border-progress rounded-lg text-center cursor-pointer hover:border-ignite/50 transition-colors"
            onClick={() => toast('附件上传在 Sprint 2 上线')}
          >
            <svg className="w-8 h-8 text-ink-4 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            <div className="text-[13px] text-ink-3">点击或拖拽上传截图 / 日志 / 视频</div>
            <div className="text-[11px] text-ink-4 mt-1">支持 png, pdf, mp4</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={!canSubmit || submitting}
            className="px-6 py-2.5 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2 disabled:opacity-40 flex items-center gap-2 shadow-card">
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                上报中…
              </>
            ) : '提交事件'}
          </button>
          <button type="button" onClick={() => navigate('/cimims/incidents')}
            className="px-5 py-2.5 rounded-lg border border-progress text-[13px] hover:bg-module">
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
