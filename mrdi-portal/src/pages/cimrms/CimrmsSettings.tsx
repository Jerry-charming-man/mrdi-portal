import { useState } from 'react'

type TabKey = 'notifications' | 'workflow' | 'roles' | 'sla' | 'fields'

const tabs: { key: TabKey; label: string; adminOnly?: boolean }[] = [
  { key: 'notifications', label: '通知规则' },
  { key: 'workflow', label: '流程配置', adminOnly: true },
  { key: 'roles', label: '角色分配', adminOnly: true },
  { key: 'sla', label: 'SLA 配置', adminOnly: true },
  { key: 'fields', label: '字段管理', adminOnly: true },
]

const notificationRules = [
  { id: 'n1', event: '我提交的需求状态变更', inApp: true, email: true, desc: '需求进入新状态时通知我' },
  { id: 'n2', event: '需要我审批的需求', inApp: true, email: true, desc: '有新需求等待您审批时通知' },
  { id: 'n3', event: 'SLA 警告（50%）', inApp: true, email: false, desc: '需求 SLA 消耗过半时通知' },
  { id: 'n4', event: 'SLA 突破（升级）', inApp: true, email: true, desc: '需求 SLA 超时自动升级' },
  { id: 'n5', event: 'UAT 验证请求', inApp: true, email: true, desc: 'IT-CIM 完成开发后通知我进行 UAT' },
  { id: 'n6', event: '验收通过/驳回', inApp: true, email: true, desc: '我的验收结果通知' },
]

const slaConfig = [
  { urgency: 'P1', label: '紧急', responseHours: 2, processHours: 24 },
  { urgency: 'P2', label: '一般', responseHours: 8, processHours: 72 },
  { urgency: 'P3', label: '低', responseHours: 24, processHours: 168 },
]

export default function CimrmsSettings() {
  const [activeTab, setActiveTab] = useState<TabKey>('notifications')
  const [rules, setRules] = useState(notificationRules)
  const [sla] = useState(slaConfig)

  const toast = (msg: string) => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type: 'success' } }))
  }

  function toggleInApp(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, inApp: !r.inApp } : r))
    toast('通知规则已保存')
  }

  function toggleEmail(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, email: !r.email } : r))
    toast('通知规则已保存')
  }

  return (
    <div className="px-8 py-6">

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[24px] font-semibold tracking-tight">设置</h1>
        <p className="text-[13px] text-ink-3 mt-1">系统配置 · 仅 admin 可访问高级选项</p>
      </div>

      <div className="flex gap-5">

        {/* Left tabs */}
        <div className="w-[180px] flex-shrink-0">
          <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-2 space-y-0.5">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full px-4 py-2.5 rounded-lg text-[13px] text-left flex items-center justify-between transition ${
                  activeTab === tab.key
                    ? 'bg-ignite text-pure font-medium'
                    : 'text-ink-3 hover:bg-module hover:text-ink'
                }`}
              >
                <span>{tab.label}</span>
                {tab.adminOnly && (
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1">

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-progress">
                <h3 className="text-[14px] font-semibold text-ink">我的通知规则</h3>
                <p className="text-[11.5px] text-ink-3 mt-0.5">选择接收通知的方式</p>
              </div>
              <table className="w-full text-[13px]">
                <thead className="bg-module text-ink-3 text-[11px]">
                  <tr>
                    <th className="px-5 py-2.5 text-left font-medium">事件</th>
                    <th className="px-3 py-2.5 text-center font-medium w-[80px]">站内</th>
                    <th className="px-3 py-2.5 text-center font-medium w-[80px]">邮件</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-progress">
                  {rules.map(rule => (
                    <tr key={rule.id} className="row-hover">
                      <td className="px-5 py-3.5">
                        <div className="text-[13px] font-medium text-ink">{rule.event}</div>
                        <div className="text-[11.5px] text-ink-3 mt-0.5">{rule.desc}</div>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <button
                          onClick={() => toggleInApp(rule.id)}
                          className={`w-10 h-6 rounded-full transition relative ${rule.inApp ? 'bg-ignite' : 'bg-progress'}`}
                        >
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${rule.inApp ? 'left-5' : 'left-1'}`}></span>
                        </button>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <button
                          onClick={() => toggleEmail(rule.id)}
                          className={`w-10 h-6 rounded-full transition relative ${rule.email ? 'bg-ignite' : 'bg-progress'}`}
                        >
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${rule.email ? 'left-5' : 'left-1'}`}></span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Workflow */}
          {activeTab === 'workflow' && (
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6">
              <h3 className="text-[14px] font-semibold text-ink mb-1">流程配置</h3>
              <p className="text-[11.5px] text-ink-3 mb-4">可视化编辑需求状态机（admin 专用）</p>
              <div className="border border-progress rounded-xl p-6 text-center text-[13px] text-ink-3 bg-module">
                <svg className="w-12 h-12 mx-auto mb-3 text-ink-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
                </svg>
                状态机可视化编辑器在 Sprint 2 上线
                <div className="mt-2 text-[12px] text-ink-4">当前状态机包含 10 个状态，12 条转换规则</div>
              </div>
            </div>
          )}

          {/* Roles */}
          {activeTab === 'roles' && (
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-6">
              <h3 className="text-[14px] font-semibold text-ink mb-1">角色分配</h3>
              <p className="text-[11.5px] text-ink-3 mb-4">配置角色 × 操作权限矩阵（admin 专用）</p>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="bg-module text-ink-3 text-[11px]">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">操作</th>
                      <th className="px-3 py-2.5 text-center font-medium w-[80px]">viewer</th>
                      <th className="px-3 py-2.5 text-center font-medium w-[80px]">editor</th>
                      <th className="px-3 py-2.5 text-center font-medium w-[80px]">auditor</th>
                      <th className="px-3 py-2.5 text-center font-medium w-[80px]">admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-progress text-[12.5px]">
                    {['提交需求', '审批需求', '接单', '开发', 'UAT 验证', '上线', '查看审计', '系统设置'].map(op => (
                      <tr key={op} className="row-hover">
                        <td className="px-4 py-2.5 text-ink">{op}</td>
                        {['viewer', 'editor', 'auditor', 'admin'].map(role => {
                          const can = role === 'admin' || (op === '提交需求' && ['viewer', 'editor', 'auditor', 'admin'].indexOf(role) >= 0) || (op === '审批需求' && ['auditor', 'admin'].includes(role)) || (op === '接单' && ['editor', 'admin'].includes(role)) || (op === '开发' && ['editor', 'admin'].includes(role)) || (op === 'UAT 验证' && ['viewer', 'editor', 'auditor', 'admin'].includes(role)) || (op === '上线' && ['editor', 'admin'].includes(role)) || (op === '查看审计' && ['auditor', 'admin'].includes(role)) || (op === '系统设置' && role === 'admin')
                          return (
                            <td key={role} className="px-3 py-2.5 text-center">
                              {can
                                ? <span className="text-ignite font-mono">✓</span>
                                : <span className="text-ink-4">—</span>
                              }
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SLA */}
          {activeTab === 'sla' && (
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-progress">
                <h3 className="text-[14px] font-semibold text-ink">SLA 配置</h3>
                <p className="text-[11.5px] text-ink-3 mt-0.5">配置各紧急度的响应与处理时限（admin 专用）</p>
              </div>
              <table className="w-full text-[13px]">
                <thead className="bg-module text-ink-3 text-[11px]">
                  <tr>
                    <th className="px-5 py-2.5 text-left font-medium">紧急度</th>
                    <th className="px-3 py-2.5 text-left font-medium">响应时限</th>
                    <th className="px-3 py-2.5 text-left font-medium">处理时限</th>
                    <th className="px-3 py-2.5 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-progress">
                  {sla.map((row) => (
                    <tr key={row.urgency} className="row-hover">
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold text-pure font-mono ${
                          row.urgency === 'P1' ? 'bg-danger' : row.urgency === 'P2' ? 'bg-warn' : 'bg-ink-3'
                        }`}>{row.urgency}</span>
                        <span className="ml-2 text-ink">{row.label}</span>
                      </td>
                      <td className="px-3 py-3.5 text-ink font-mono">{row.responseHours}h</td>
                      <td className="px-3 py-3.5 text-ink font-mono">{row.processHours}h</td>
                      <td className="px-3 py-3.5 text-right">
                        <button
                          onClick={() => toast('SLA 编辑在 Sprint 2 上线')}
                          className="text-ignite text-[12px] hover:underline"
                        >
                          编辑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Fields */}
          {activeTab === 'fields' && (
            <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-progress">
                <h3 className="text-[14px] font-semibold text-ink">字段管理</h3>
                <p className="text-[11.5px] text-ink-3 mt-0.5">管理需求表单字段（admin 专用）</p>
              </div>
              <table className="w-full text-[13px]">
                <thead className="bg-module text-ink-3 text-[11px]">
                  <tr>
                    <th className="px-5 py-2.5 text-left font-medium">字段名</th>
                    <th className="px-3 py-2.5 text-center font-medium">必填</th>
                    <th className="px-3 py-2.5 text-left font-medium">类型</th>
                    <th className="px-3 py-2.5 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-progress text-[12.5px]">
                  {[
                    { name: '需求标题', required: true, type: '文本' },
                    { name: '需求类型', required: true, type: '单选' },
                    { name: '紧急程度', required: true, type: '单选' },
                    { name: '关联系统', required: true, type: '单选' },
                    { name: '详细描述', required: true, type: '多行文本' },
                    { name: '附件', required: false, type: '文件上传' },
                    { name: '关联报案', required: false, type: '文本' },
                    { name: '期望完成时间', required: false, type: '日期' },
                  ].map(field => (
                    <tr key={field.name} className="row-hover">
                      <td className="px-5 py-3 text-ink font-medium">{field.name}</td>
                      <td className="px-3 py-3 text-center">
                        {field.required
                          ? <span className="text-ignite font-mono">✓</span>
                          : <span className="text-ink-4">—</span>
                        }
                      </td>
                      <td className="px-3 py-3 text-ink-3">{field.type}</td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => toast('字段编辑在 Sprint 2 上线')}
                          className="text-ignite text-[12px] hover:underline"
                        >
                          编辑
                        </button>
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
