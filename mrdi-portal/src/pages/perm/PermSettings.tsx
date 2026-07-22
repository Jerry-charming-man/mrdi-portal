import { useState } from 'react'
import { PERM_TYPE } from '../../types/cimperm'

type SubTab = 'notifications' | 'perm-types' | 'system-owners' | 'reminder-rules'

function showToast(msg: string, type = 'info') {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type } }))
}

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: 'notifications', label: '通知规则' },
  { key: 'perm-types', label: '权限类型配置' },
  { key: 'system-owners', label: 'System Owner 分配' },
  { key: 'reminder-rules', label: '24h 提醒规则' },
]

// Mock data
const mockOwners = [
  { system: 'MES', name: '王经理', email: 'wang@mrdi.com' },
  { system: 'SPC', name: '陈工', email: 'chen@mrdi.com' },
  { system: 'ERP', name: '李总', email: 'li@mrdi.com' },
  { system: 'MDM', name: '张志豪', email: 'zhang@mrdi.com' },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-research' : 'bg-ink-5'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-pure transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

export default function PermSettings() {
  const [activeTab, setActiveTab] = useState<SubTab>('notifications')

  // Notification rules
  const [notifRules, setNotifRules] = useState({
    inApp: true,
    email: true,
    bb06: false,
  })

  // Reminder hours
  const [reminderHours, setReminderHours] = useState(24)

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-[24px] font-semibold tracking-tight text-ink">设置</h2>
        <p className="text-[13px] text-ink-3 mt-1">通知规则 · 权限类型配置 · System Owner 分配 · 提醒规则</p>
      </div>

      {/* Sub tabs */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-1 w-fit">
        {SUB_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
              activeTab === tab.key ? 'bg-ink text-pure' : 'text-ink-3 hover:text-ink hover:bg-module'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'notifications' && (
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6 space-y-5">
          <h3 className="text-[14px] font-semibold text-ink">个人通知规则</h3>
          <p className="text-[13px] text-ink-3 -mt-3">选择接收通知的方式</p>

          <div className="space-y-4">
            {[
              { key: 'inApp' as const, label: '站内通知', desc: '在 CIM-PERM 内接收实时通知' },
              { key: 'email' as const, label: '邮件通知', desc: '发送邮件至 zhang@mrdi.com' },
              { key: 'bb06' as const, label: 'BB-06 待办通知', desc: '权限即将过期时写入 BB-06 系统' },
            ].map(rule => (
              <div key={rule.key} className="flex items-center justify-between p-4 bg-module/50 rounded-xl">
                <div>
                  <div className="text-[13px] font-medium text-ink">{rule.label}</div>
                  <div className="text-[12px] text-ink-3 mt-0.5">{rule.desc}</div>
                </div>
                <Toggle checked={notifRules[rule.key]} onChange={v => {
                  setNotifRules(prev => ({ ...prev, [rule.key]: v }))
                  showToast('设置已保存', 'success')
                }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'perm-types' && (
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-ink">权限类型配置</h3>
              <p className="text-[13px] text-ink-3 mt-1">修改各类权限的默认有效期和范围（admin 专属）</p>
            </div>
            <button onClick={() => showToast('配置已保存', 'success')} className="px-4 py-2 bg-research text-pure rounded-lg text-[13px] font-medium hover:bg-research/90 transition-colors">
              保存配置
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="bg-module text-ink-3 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">类型</th>
                  <th className="px-3 py-3 text-center font-medium">默认</th>
                  <th className="px-3 py-3 text-center font-medium">最短</th>
                  <th className="px-3 py-3 text-center font-medium">最长</th>
                  <th className="px-3 py-3 text-center font-medium">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-progress">
                {Object.entries(PERM_TYPE).map(([k, v]) => (
                  <tr key={k} className="hover:bg-module/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${v.bg} ${v.text}`}>{v.label}</span>
                    </td>
                    <td className="px-3 py-3 text-center font-mono">{v.defaultDuration}</td>
                    <td className="px-3 py-3 text-center font-mono">{v.min}</td>
                    <td className="px-3 py-3 text-center font-mono">{v.max}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-success-soft text-success font-medium">启用</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'system-owners' && (
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-ink">System Owner 分配</h3>
              <p className="text-[13px] text-ink-3 mt-1">每个系统对应一个 System Owner（从 MDM 用户选择）</p>
            </div>
            <button onClick={() => showToast('分配已保存', 'success')} className="px-4 py-2 bg-research text-pure rounded-lg text-[13px] font-medium hover:bg-research/90 transition-colors">
              保存分配
            </button>
          </div>

          <div className="space-y-3">
            {mockOwners.map(owner => (
              <div key={owner.system} className="flex items-center gap-4 p-4 bg-module/50 rounded-xl">
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium bg-research/10 text-research min-w-[80px] text-center`}>{owner.system}</span>
                <div className="flex-1">
                  <div className="text-[13px] text-ink font-medium">{owner.name}</div>
                  <div className="text-[12px] text-ink-3 font-mono">{owner.email}</div>
                </div>
                <button className="px-3 py-1.5 border border-progress rounded-lg text-[12px] hover:bg-pure transition-colors">
                  更改
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reminder-rules' && (
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6 space-y-5">
          <h3 className="text-[14px] font-semibold text-ink">24h 提醒规则</h3>
          <p className="text-[13px] text-ink-3 -mt-3">设置权限到期前多少小时触发提醒</p>

          <div className="flex items-center gap-4 p-4 bg-module/50 rounded-xl">
            <span className="text-[13px] text-ink">到期前</span>
            <select
              value={reminderHours}
              onChange={e => {
                setReminderHours(Number(e.target.value))
                showToast('提醒规则已保存', 'success')
              }}
              className="px-3 py-2 bg-pure border border-progress rounded-lg text-[13px]"
            >
              {[6, 12, 24, 48, 72].map(h => (
                <option key={h} value={h}>{h} 小时</option>
              ))}
            </select>
            <span className="text-[13px] text-ink">发送提醒</span>
          </div>

          <div className="p-4 bg-warn-soft/50 rounded-xl border border-warn/30">
            <div className="text-[12px] text-warn font-medium">注意</div>
            <div className="text-[12px] text-ink-3 mt-1">
              提醒将在权限到期前 {reminderHours}h 发送站内通知 + 邮件 + 写入 BB-06。
              临时权限（temporary）固定在到期前 1h 提醒。
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
