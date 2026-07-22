import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { PERM_TYPE, PERM_LEVEL, URGENCY } from '../../types/cimperm'
import type { PermissionType, PermissionLevel, UrgencyLevel } from '../../types/cimperm'

const SYSTEMS = ['MES', 'SPC', 'ERP', 'MDM', 'CIM-IMS', 'CIM-RMS', '其他']
const DURATIONS = ['1h', '4h', '8h', '24h', '48h', '7d', '14d', '30d', '60d', '90d', '180d', '365d']

export default function PermNew() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    targetSystem: '',
    permissionType: 'functional' as PermissionType,
    permissionLevel: 'read' as PermissionLevel,
    resourceId: '',
    reason: '',
    requestedDuration: '30d',
    urgency: 'normal' as UrgencyLevel,
    relatedIncidentId: '',
    relatedRequestId: '',
  })

  const showToast = (msg: string, type = 'info') => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type } }))
  }

  const typeCfg = PERM_TYPE[form.permissionType]
  const maxDur = typeCfg.max
  const maxSec = maxDur.endsWith('d') ? parseInt(maxDur) * 86400 : parseInt(maxDur) * 3600

  const canSubmit = form.targetSystem && form.resourceId && form.reason && form.requestedDuration

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))
    setSubmitting(false)
    showToast('申请已提交，等待 IT 审核', 'success')
    navigate('/perm/perm')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[13px] text-ink-3 mb-2">
          <Link to="/perm/perm" className="hover:text-research transition-colors">申请列表</Link>
          <span>→</span>
          <span className="text-ink">新申请</span>
        </div>
        <h2 className="text-[18px] font-bold text-ink">提交权限申请</h2>
        <p className="text-[13px] text-ink-3 mt-1">请填写以下信息，申请将提交给 IT 审核</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-pure border border-progress rounded-xl p-6 shadow-card space-y-5">
        {/* Target System */}
        <div>
          <label className="block text-[13px] font-semibold text-ink mb-2">
            目标系统 <span className="text-danger">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {SYSTEMS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setForm(f => ({ ...f, targetSystem: s }))}
                className={`px-4 py-2 rounded-lg text-[12px] font-medium border transition-all ${
                  form.targetSystem === s
                    ? 'bg-research border-research text-pure'
                    : 'bg-module border-progress text-ink-3 hover:border-research hover:text-research'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Type + Level */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-2">
              权限类型 <span className="text-danger">*</span>
            </label>
            <select
              value={form.permissionType}
              onChange={e => setForm(f => ({ ...f, permissionType: e.target.value as PermissionType }))}
              className="w-full h-10 px-3 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-research/30"
            >
              {Object.entries(PERM_TYPE).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-ink-3 mt-1.5">{typeCfg.desc}</p>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-2">
              权限级别 <span className="text-danger">*</span>
            </label>
            <div className="flex gap-2">
              {Object.entries(PERM_LEVEL).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, permissionLevel: k as PermissionLevel }))}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-medium border transition-all ${
                    form.permissionLevel === k
                      ? `${v.bg} ${v.text} border-transparent`
                      : 'bg-module border-progress text-ink-3 hover:border-research'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Resource ID */}
        <div>
          <label className="block text-[13px] font-semibold text-ink mb-2">
            资源对象 <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={form.resourceId}
            onChange={e => setForm(f => ({ ...f, resourceId: e.target.value }))}
            placeholder={`如：${form.targetSystem || 'MES'}:module:xxx`}
            className="w-full h-10 px-4 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-research/30 placeholder:text-ink-5"
          />
          <p className="text-[11px] text-ink-3 mt-1.5">格式：系统:资源类型:具体资源，如 MES:module:production-report</p>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-[13px] font-semibold text-ink mb-2">
            申请时长 <span className="text-danger">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map(d => {
              const sec = d.endsWith('d') ? parseInt(d) * 86400 : parseInt(d) * 3600
              const disabled = sec > maxSec
              return (
                <button
                  key={d}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && setForm(f => ({ ...f, requestedDuration: d }))}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                    form.requestedDuration === d
                      ? 'bg-research border-research text-pure'
                      : disabled
                        ? 'bg-module/50 border-progress/50 text-ink-5 cursor-not-allowed'
                        : 'bg-module border-progress text-ink-3 hover:border-research hover:text-research'
                  }`}
                >
                  {d}
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-ink-3 mt-1.5">
            {typeCfg.label} 最长 {typeCfg.max}（已根据类型自动限制）
          </p>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-[13px] font-semibold text-ink mb-2">
            申请理由 <span className="text-danger">*</span>
          </label>
          <textarea
            rows={4}
            value={form.reason}
            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            placeholder="请说明申请该权限的业务必要性..."
            className="w-full px-4 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-research/30 resize-none placeholder:text-ink-5"
          />
        </div>

        {/* Urgency */}
        <div>
          <label className="block text-[13px] font-semibold text-ink mb-2">紧急程度</label>
          <div className="flex gap-2">
            {Object.entries(URGENCY).map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => setForm(f => ({ ...f, urgency: k as UrgencyLevel }))}
                className={`px-4 py-2 rounded-lg text-[12px] font-medium border transition-all ${
                  form.urgency === k
                    ? `${v.bg} ${v.text} border-transparent`
                    : 'bg-module border-progress text-ink-3 hover:border-research'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Related */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-2">关联案件（可选）</label>
            <input
              type="text"
              value={form.relatedIncidentId}
              onChange={e => setForm(f => ({ ...f, relatedIncidentId: e.target.value }))}
              placeholder="INC-2026-XXXX"
              className="w-full h-10 px-4 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-research/30 placeholder:text-ink-5"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-2">关联需求（可选）</label>
            <input
              type="text"
              value={form.relatedRequestId}
              onChange={e => setForm(f => ({ ...f, relatedRequestId: e.target.value }))}
              placeholder="NC-2026-XXXX"
              className="w-full h-10 px-4 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-research/30 placeholder:text-ink-5"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/perm/perm')}
            className="px-5 py-2.5 border border-progress rounded-lg text-[13px] hover:bg-module transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="flex-1 py-2.5 bg-research text-pure rounded-lg text-[13px] font-medium hover:bg-research/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.364-6.364l-2.828 2.828M9.464 14.536l-2.828 2.828m12.728 0l-2.828-2.828M9.464 9.464L6.636 6.636" strokeLinecap="round" />
                </svg>
                提交中...
              </>
            ) : '提交申请'}
          </button>
        </div>
      </form>
    </div>
  )
}
