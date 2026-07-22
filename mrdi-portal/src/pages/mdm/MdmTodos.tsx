import { useState } from 'react'
import type { MdmTodo, TodoLabel, TodoPriority } from '../../types/mdm'

// ---- Mock todos ----
const mockTodos: MdmTodo[] = [
  { id: 1, title: '审批 NC-2026-0142 · Etch 区 SPC 漂移调查', label: 'red', priority: 'P1', status: 'open', dueAt: '2026-07-15 18:00', source: '来自 CIM-RMS · 陈工', createdAt: '2026-07-15' },
  { id: 2, title: '复验 E02 腔体维修后 SPC 复测结果', label: 'red', priority: 'P1', status: 'open', dueAt: '2026-07-15 14:00', source: '来自告警中心', createdAt: '2026-07-15' },
  { id: 3, title: '审批 NC-2026-0141 · CMP Platen 温度超限', label: 'red', priority: 'P1', status: 'open', dueAt: '2026-07-16', source: '来自 CIM-RMS · 李工', createdAt: '2026-07-14' },
  { id: 4, title: '复核 E05 维护后 PM checklist', label: 'green', priority: 'P2', status: 'open', dueAt: '今天', source: '', createdAt: '2026-07-15' },
  { id: 5, title: '跟进 W02 WireBond 设备维修进度', label: 'green', priority: 'P2', status: 'open', dueAt: '今天', source: '', createdAt: '2026-07-15' },
  { id: 6, title: '签收班次交接 (16:00)', label: 'green', priority: 'P2', status: 'open', dueAt: '今天 16:00', source: '', createdAt: '2026-07-15' },
  { id: 7, title: '审批 MES 报表导出权限申请', label: 'green', priority: 'P2', status: 'open', dueAt: '明天', source: '来自权限申请 · 王工', createdAt: '2026-07-14' },
  { id: 8, title: 'FYI: Q3 系统升级 7/20 通知', label: 'blue', priority: 'P3', status: 'open', dueAt: '7/20', source: '', createdAt: '2026-07-10' },
  { id: 9, title: '新员工 onboarding 资料准备', label: 'blue', priority: 'P3', status: 'open', dueAt: '7/18', source: '', createdAt: '2026-07-12' },
  { id: 10, title: 'Sprint 1 Retrospective 会议纪要传阅', label: 'blue', priority: 'P3', status: 'open', dueAt: '7/16', source: '', createdAt: '2026-07-13' },
  { id: 11, title: 'P04 Photo 灯管更换工单确认', label: 'blue', priority: 'P3', status: 'open', dueAt: '7/17', source: '', createdAt: '2026-07-14' },
  { id: 12, title: 'SPC 规则配置评审', label: 'blue', priority: 'P3', status: 'open', dueAt: '7/19', source: '', createdAt: '2026-07-13' },
]

const TABS: { id: 'all' | TodoLabel; label: string; count: (todos: MdmTodo[]) => number }[] = [
  { id: 'all', label: '全部', count: (t) => t.length },
  { id: 'red', label: '🔴 Red', count: (t) => t.filter(x => x.label === 'red').length },
  { id: 'green', label: '🟢 Green', count: (t) => t.filter(x => x.label === 'green').length },
  { id: 'blue', label: '🔵 Blue', count: (t) => t.filter(x => x.label === 'blue').length },
]

const labelStyle: Record<TodoLabel, string> = {
  red: 'bg-danger-soft border-danger/20',
  green: 'bg-success-soft border-success/20',
  blue: 'bg-research/5 border-research/20',
}
const dotColor: Record<TodoLabel, string> = {
  red: 'bg-danger',
  green: 'bg-success',
  blue: 'bg-research',
}
const priorityColor: Record<TodoPriority, string> = {
  P1: 'bg-danger text-pure',
  P2: 'bg-warn text-pure',
  P3: 'bg-ink-3 text-pure',
}

export default function MdmTodos() {
  const [activeTab, setActiveTab] = useState<'all' | TodoLabel>('all')
  const [todos, setTodos] = useState(mockTodos)
  const [createModal, setCreateModal] = useState(false)
  const [fadingIds, setFadingIds] = useState<Set<number>>(new Set())

  const filtered = activeTab === 'all' ? todos : todos.filter(t => t.label === activeTab)
  const openTodos = filtered.filter(t => t.status === 'open')

  const handleDone = (id: number) => {
    setFadingIds(prev => new Set([...prev, id]))
    setTimeout(() => {
      setTodos(prev => prev.map(t => t.id === id ? { ...t, status: 'done' } : t))
      setFadingIds(prev => { const n = new Set(prev); n.delete(id); return n })
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg: '已标记为完成', type: 'success' } }))
    }, 400)
  }

  const handleDismiss = (id: number) => {
    setFadingIds(prev => new Set([...prev, id]))
    setTimeout(() => {
      setTodos(prev => prev.map(t => t.id === id ? { ...t, status: 'dismissed' } : t))
      setFadingIds(prev => { const n = new Set(prev); n.delete(id); return n })
    }, 400)
  }

  return (
    <div className="px-8 py-6 space-y-5">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">我的待办</h1>
          <p className="text-[13px] text-ink-3 mt-1">BB-06 标签规范 · Red/Green/Blue</p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="px-4 py-2 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2 flex items-center gap-1.5 shadow-card"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          新建待办
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-ignite text-pure shadow-sm' : 'text-ink-3 hover:bg-module'}`}
          >
            {tab.label} {tab.count(todos)}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-[12px] text-ink-3">
          <span>状态 ▾</span>
          <span>排序 ▾</span>
        </div>
      </div>

      {/* Todo cards */}
      <div className="space-y-3">
        {openTodos.length === 0 && (
          <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-12 text-center">
            <div className="text-[14px] font-medium text-ink-2">暂无待办</div>
            <div className="text-[12px] text-ink-3 mt-1">所有任务都已完成，继续保持！</div>
          </div>
        )}
        {openTodos.map((todo) => (
          <div
            key={todo.id}
            className={`rounded-xl border p-4 transition-opacity ${labelStyle[todo.label]} ${fadingIds.has(todo.id) ? 'opacity-40' : ''}`}
          >
            <div className="flex items-start gap-3">
              <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor[todo.label]}`}></span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-pure font-mono ${priorityColor[todo.priority]}`}>
                    {todo.priority}
                  </span>
                  <span className="text-[13.5px] font-medium text-ink">{todo.title}</span>
                </div>
                <div className="flex items-center gap-3 text-[11.5px] text-ink-3">
                  {todo.dueAt && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      截止 {todo.dueAt}
                    </span>
                  )}
                  {todo.source && <span>{todo.source}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDone(todo.id)}
                  className="px-3 py-1.5 rounded-lg bg-success/10 border border-success/20 text-success text-[12px] hover:bg-success/20 transition-colors"
                >
                  ✓ Done
                </button>
                <button
                  onClick={() => handleDismiss(todo.id)}
                  className="px-3 py-1.5 rounded-lg bg-module border border-progress text-ink-3 text-[12px] hover:bg-progress transition-colors"
                >
                  ✕ Dismiss
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center" onClick={() => setCreateModal(false)}>
          <div className="bg-pure rounded-2xl shadow-card-hover w-[520px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold text-ink">新建待办</h3>
              <button onClick={() => setCreateModal(false)} className="w-8 h-8 rounded-lg hover:bg-module flex items-center justify-center">
                <svg className="w-4 h-4 text-ink-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[12px] text-ink-3 mb-1 block">标题 *</label>
                <input className="w-full px-3 py-2 bg-module rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30" placeholder="待办事项…" />
              </div>
              <div>
                <label className="text-[12px] text-ink-3 mb-1 block">描述</label>
                <textarea className="w-full px-3 py-2 bg-module rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 resize-none h-20" placeholder="详细描述（可选）…" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] text-ink-3 mb-2 block">标签</label>
                  <div className="flex gap-2">
                    {(['red', 'green', 'blue'] as TodoLabel[]).map((l) => (
                      <button key={l} className={`px-3 py-1.5 rounded-lg text-[12px] border ${l === 'red' ? 'bg-danger-soft border-danger/20 text-danger' : l === 'green' ? 'bg-success-soft border-success/20 text-success' : 'bg-research/5 border-research/20 text-research'} hover:opacity-80`}>
                        {l === 'red' ? '🔴 Red' : l === 'green' ? '🟢 Green' : '🔵 Blue'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[12px] text-ink-3 mb-2 block">优先级</label>
                  <div className="flex gap-2">
                    {(['P1', 'P2', 'P3'] as TodoPriority[]).map((p) => (
                      <button key={p} className="px-3 py-1.5 rounded-lg text-[12px] border border-progress bg-module text-ink-3 hover:bg-progress">{p}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[12px] text-ink-3 mb-1 block">截止时间</label>
                <input type="datetime-local" className="w-full px-3 py-2 bg-module rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30" />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setCreateModal(false)} className="px-4 py-2 rounded-lg border border-progress text-[13px] hover:bg-module">取消</button>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg: '待办已创建', type: 'success' } }))
                  setCreateModal(false)
                }}
                className="px-5 py-2 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-4 py-4 border-t border-progress text-[11.5px] text-ink-3 flex items-center justify-between">
        <div>MRDI · MDM · 主数据管理子系统 v2.2</div>
        <div className="flex items-center gap-4"><span>Build 2026.07.15</span></div>
      </footer>
    </div>
  )
}
