import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { REQUEST_TYPE, URGENCY } from '../../types/cimrms'

const relatedSystems = ['MES', 'SPC', 'ERP', 'MDM', 'CIM-IMS', '其他']
const areas = ['Diffusion', 'Etch', 'Photo', 'CMP', 'CVD', 'PVD', 'WET', '其他']

export default function CimrmsRequestsNew() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    type: 'feature',
    urgency: 'P2',
    relatedSystem: '',
    area: '',
    description: '',
    expectedDate: '',
    relatedIncidentId: '',
    files: [] as string[],
  })
  const [submitting, setSubmitting] = useState(false)

  const showToast = (msg: string, type = 'info') => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type } }))
  }

  const canSubmit = form.title.trim() && form.description.trim()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))
    setSubmitting(false)
    showToast('需求提交成功！NC-2026-0143 已创建', 'success')
    navigate('/cimrms/requests')
  }

  function updateField(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="px-8 py-6 max-w-4xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] mb-5">
        <button onClick={() => navigate('/cimrms/requests')} className="text-ink-3 hover:text-ink">需求列表</button>
        <svg className="w-3.5 h-3.5 text-ink-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
        <span className="font-medium text-ink">提交新需求</span>
      </div>

      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">提交新需求</h1>
          <p className="text-[13px] text-ink-3 mt-1">IT 需求管理工作流 · 提交后将自动派单至您的主管审批</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Basic Info */}
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6">
          <h3 className="text-[14px] font-semibold text-ink mb-4">基本信息</h3>
          <div className="space-y-4">

            <div>
              <label className="block text-[12px] text-ink-3 font-medium mb-1.5">
                需求标题 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => updateField('title', e.target.value)}
                placeholder="简明描述要做什么，例如：D02 SPC 告警规则调整"
                className="w-full px-4 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 focus:bg-pure"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] text-ink-3 font-medium mb-1.5">
                  需求类型 <span className="text-danger">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={e => updateField('type', e.target.value)}
                  className="w-full px-3 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 focus:bg-pure"
                >
                  {Object.entries(REQUEST_TYPE).map(([, v]) => (
                    <option key={v.code} value={v.code}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-ink-3 font-medium mb-1.5">
                  紧急程度 <span className="text-danger">*</span>
                </label>
                <select
                  value={form.urgency}
                  onChange={e => updateField('urgency', e.target.value)}
                  className="w-full px-3 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 focus:bg-pure"
                >
                  {Object.entries(URGENCY).map(([, v]) => (
                    <option key={v.code} value={v.code}>{v.code} · {v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-ink-3 font-medium mb-1.5">关联系统</label>
                <select
                  value={form.relatedSystem}
                  onChange={e => updateField('relatedSystem', e.target.value)}
                  className="w-full px-3 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 focus:bg-pure"
                >
                  <option value="">选择关联系统</option>
                  {relatedSystems.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] text-ink-3 font-medium mb-1.5">影响区域</label>
                <select
                  value={form.area}
                  onChange={e => updateField('area', e.target.value)}
                  className="w-full px-3 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 focus:bg-pure"
                >
                  <option value="">选择区域</option>
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-ink-3 font-medium mb-1.5">期望完成时间</label>
                <input
                  type="date"
                  value={form.expectedDate}
                  onChange={e => updateField('expectedDate', e.target.value)}
                  className="w-full px-3 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 focus:bg-pure"
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
                placeholder={"业务背景 + 期望效果 + 具体要求\n\n例如：\n- 当前问题：D02 腔体近期 SPC 数据持续漂移\n- 期望效果：自动告警 + 控制限重新计算\n- 具体要求：漂移超过 3σ 时发送邮件通知 PE"}
                className="w-full px-4 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 focus:bg-pure resize-none"
              />
            </div>
          </div>
        </div>

        {/* Optional */}
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6">
          <h3 className="text-[14px] font-semibold text-ink mb-4">可选信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] text-ink-3 font-medium mb-1.5">关联 CIM-IMS 案件</label>
              <input
                type="text"
                value={form.relatedIncidentId}
                onChange={e => updateField('relatedIncidentId', e.target.value)}
                placeholder="INC-2026-XXXX"
                className="w-full px-4 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 focus:bg-pure"
              />
            </div>
            <div>
              <label className="block text-[12px] text-ink-3 font-medium mb-1.5">附件（截图 / 文档）</label>
              <div
                className="w-full px-4 py-6 border-2 border-dashed border-progress rounded-lg text-center cursor-pointer hover:border-ignite/50 transition-colors"
                onClick={() => showToast('附件上传在 Sprint 2 上线', 'info')}
              >
                <svg className="w-8 h-8 text-ink-4 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                <div className="text-[13px] text-ink-3">点击或拖拽上传</div>
                <div className="text-[11px] text-ink-4 mt-1">支持 png, pdf, docx</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="px-6 py-2.5 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2 disabled:opacity-40 flex items-center gap-2 shadow-card"
          >
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                提交中…
              </>
            ) : '提交需求'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/cimrms/requests')}
            className="px-5 py-2.5 rounded-lg border border-progress text-[13px] hover:bg-module"
          >
            取消
          </button>
        </div>

      </form>
    </div>
  )
}
