import { useState } from 'react'

type TabKey = 'duty-roster' | 'escalation' | 'sla' | 'templates' | 'engineers'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'duty-roster', label: '值班表' },
  { key: 'escalation', label: '升级规则' },
  { key: 'sla', label: 'SLA 配置' },
  { key: 'templates', label: '通知模板' },
  { key: 'engineers', label: '工程师类型' },
]

const notificationTemplates = [
  { id: 't1', event: '新事件上报', subject: '【IT报案】{incident_no} - {title}', channel: '站内+邮件+短信(P1)', active: true },
  { id: 't2', event: 'SLA 50% 警告', subject: '【SLA 警告】{incident_no} 即将超时', channel: '站内+邮件', active: true },
  { id: 't3', event: 'SLA 突破升级', subject: '【SLA 突破】{incident_no} 已升级', channel: '站内+邮件', active: true },
  { id: 't4', event: '事件关闭通知', subject: '【IT报案已关闭】{incident_no}', channel: '站内+邮件', active: false },
]

export default function CimimsSettings() {
  const [activeTab, setActiveTab] = useState<TabKey>('duty-roster')

  const toast = (msg: string) => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type: 'success' } }))
  }

  return (
    <div className="px-8 py-6">

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[24px] font-semibold tracking-tight">设置</h1>
        <p className="text-[13px] text-ink-3 mt-1">系统配置 · 仅 admin 可访问</p>
      </div>

      <div className="flex gap-5">

        {/* Left tabs */}
        <div className="w-[180px] flex-shrink-0">
          <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-2 space-y-0.5">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`w-full px-4 py-2.5 rounded-lg text-[13px] text-left transition ${
                  activeTab === tab.key ? 'bg-ignite text-pure font-medium' : 'text-ink-3 hover:bg-module hover:text-ink'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1">

          {/* Duty Roster */}
          {activeTab === 'duty-roster' && (
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-progress">
                <h3 className="text-[14px] font-semibold text-ink">值班表</h3>
                <p className="text-[11.5px] text-ink-3 mt-0.5">按周排班，管理 IT 值班人员</p>
              </div>
              <table className="w-full text-[13px]">
                <thead className="bg-module text-ink-3 text-[11px]">
                  <tr>
                    <th className="px-5 py-2.5 text-left font-medium">时间段</th>
                    <th className="px-3 py-2.5 text-left font-medium">值班人</th>
                    <th className="px-3 py-2.5 text-left font-medium">角色</th>
                    <th className="px-3 py-2.5 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-progress text-[12.5px]">
                  {[
                    { period: '周一 ~ 周五 08:00-20:00', name: '张志豪', role: 'IT 值班' },
                    { period: '周一 ~ 周五 20:00-08:00', name: '王经理', role: 'IT 值班' },
                    { period: '周末全天', name: '李总监', role: 'IT 经理' },
                  ].map(row => (
                    <tr key={row.period} className="row-hover">
                      <td className="px-5 py-3 text-ink">{row.period}</td>
                      <td className="px-3 py-3 text-ink font-medium">{row.name}</td>
                      <td className="px-3 py-3 text-ink-3">{row.role}</td>
                      <td className="px-3 py-3 text-right">
                        <button onClick={() => toast('值班表编辑在 Sprint 2 上线')} className="text-ignite text-[12px] hover:underline">编辑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Escalation Rules */}
          {activeTab === 'escalation' && (
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-progress">
                <h3 className="text-[14px] font-semibold text-ink">升级规则</h3>
                <p className="text-[11.5px] text-ink-3 mt-0.5">SLA 突破时的自动升级逻辑</p>
              </div>
              <table className="w-full text-[13px]">
                <thead className="bg-module text-ink-3 text-[11px]">
                  <tr>
                    <th className="px-5 py-2.5 text-left font-medium">触发条件</th>
                    <th className="px-3 py-2.5 text-left font-medium">升级对象</th>
                    <th className="px-3 py-2.5 text-left font-medium">通知方式</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-progress text-[12.5px]">
                  {[
                    { trigger: 'P1 / Fab 级超过 SLA', target: 'IT Director', channel: '站内+邮件+短信' },
                    { trigger: 'P2/P3 超过 SLA', target: 'IT Manager', channel: '站内+邮件' },
                    { trigger: '同一事件被驳回 ≥2 次', target: 'IT Manager', channel: '站内+邮件' },
                    { trigger: 'SLA 50% 无响应', target: '当前处理人', channel: '站内' },
                  ].map((rule, i) => (
                    <tr key={i} className="row-hover">
                      <td className="px-5 py-3 text-ink font-medium">{rule.trigger}</td>
                      <td className="px-3 py-3 text-ink">{rule.target}</td>
                      <td className="px-3 py-3 text-ink-3">{rule.channel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SLA Config */}
          {activeTab === 'sla' && (
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-progress">
                <h3 className="text-[14px] font-semibold text-ink">SLA 配置</h3>
                <p className="text-[11.5px] text-ink-3 mt-0.5">按事件类型与紧急度配置响应与闭环时限</p>
              </div>
              <table className="w-full text-[13px]">
                <thead className="bg-module text-ink-3 text-[11px]">
                  <tr>
                    <th className="px-5 py-2.5 text-left font-medium">事件类型</th>
                    <th className="px-3 py-2.5 text-left font-medium">P1 响应/闭环</th>
                    <th className="px-3 py-2.5 text-left font-medium">P2 闭环</th>
                    <th className="px-3 py-2.5 text-left font-medium">P3 闭环</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-progress text-[12.5px]">
                  {[
                    { type: '系统故障', p1: '2h 响 / 8h 闭', p2: '8h', p3: '24h' },
                    { type: '网络问题', p1: '1h 响 / 4h 闭', p2: '4h', p3: '8h' },
                    { type: '账号问题', p1: '自动', p2: '4h', p3: '8h' },
                    { type: '设备关联', p1: '—', p2: '8h', p3: '24h' },
                    { type: '其他', p1: '—', p2: '按评估', p3: '按评估' },
                  ].map(row => (
                    <tr key={row.type} className="row-hover">
                      <td className="px-5 py-3 text-ink font-medium">{row.type}</td>
                      <td className="px-3 py-3 font-mono text-danger">{row.p1}</td>
                      <td className="px-3 py-3 font-mono text-warn">{row.p2}</td>
                      <td className="px-3 py-3 font-mono text-ink-3">{row.p3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Notification Templates */}
          {activeTab === 'templates' && (
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-progress">
                <h3 className="text-[14px] font-semibold text-ink">通知模板</h3>
                <p className="text-[11.5px] text-ink-3 mt-0.5">不同事件类型的通知文案配置</p>
              </div>
              <table className="w-full text-[13px]">
                <thead className="bg-module text-ink-3 text-[11px]">
                  <tr>
                    <th className="px-5 py-2.5 text-left font-medium">事件</th>
                    <th className="px-3 py-2.5 text-left font-medium">通知渠道</th>
                    <th className="px-3 py-2.5 text-center font-medium w-[80px]">状态</th>
                    <th className="px-3 py-2.5 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-progress text-[12.5px]">
                  {notificationTemplates.map(tpl => (
                    <tr key={tpl.id} className="row-hover">
                      <td className="px-5 py-3">
                        <div className="text-ink font-medium">{tpl.event}</div>
                        <div className="text-[11px] text-ink-3 mt-0.5 font-mono">{tpl.subject}</div>
                      </td>
                      <td className="px-3 py-3 text-ink-3">{tpl.channel}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${tpl.active ? 'bg-success-soft text-success' : 'bg-module text-ink-3'}`}>
                          {tpl.active ? '已启用' : '已禁用'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button onClick={() => toast('模板编辑在 Sprint 2 上线')} className="text-ignite text-[12px] hover:underline">编辑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Engineer Types */}
          {activeTab === 'engineers' && (
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-progress">
                <h3 className="text-[14px] font-semibold text-ink">工程师类型</h3>
                <p className="text-[11.5px] text-ink-3 mt-0.5">4 类工程师的成员管理</p>
              </div>
              <table className="w-full text-[13px]">
                <thead className="bg-module text-ink-3 text-[11px]">
                  <tr>
                    <th className="px-5 py-2.5 text-left font-medium">类型</th>
                    <th className="px-3 py-2.5 text-left font-medium">团队</th>
                    <th className="px-3 py-2.5 text-left font-medium">成员</th>
                    <th className="px-3 py-2.5 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-progress text-[12.5px]">
                  {[
                    { label: '网络', team: 'IT 基础设施组', color: 'text-research', members: '王经理, 赵工' },
                    { label: '数据库', team: 'IT 数据组', color: 'text-ignite', members: '张志豪' },
                    { label: '系统应用', team: 'IT 应用组', color: 'text-pink', members: '陈工' },
                    { label: '安全', team: 'IT 安全组', color: 'text-indigo', members: '李总监' },
                  ].map(e => (
                    <tr key={e.label} className="row-hover">
                      <td className="px-5 py-3">
                        <span className={`font-medium ${e.color}`}>{e.label}</span>
                      </td>
                      <td className="px-3 py-3 text-ink-3">{e.team}</td>
                      <td className="px-3 py-3 text-ink">{e.members}</td>
                      <td className="px-3 py-3 text-right">
                        <button onClick={() => toast('成员编辑在 Sprint 2 上线')} className="text-ignite text-[12px] hover:underline">编辑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
