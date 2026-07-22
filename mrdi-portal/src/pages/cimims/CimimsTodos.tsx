import { useState } from 'react'
import { MOCK_TODOS, INCIDENT_URGENCY } from '../../types/cimims'
import type { CimimsTodo } from '../../types/cimims'

const labelDots: Record<string, string> = {
  red: 'bg-danger',
  green: 'bg-success',
  blue: 'bg-research',
}
const labelText: Record<string, string> = {
  red: 'Red',
  green: 'Green',
  blue: 'Blue',
}

export default function CimimsTodos() {
  const [todos, setTodos] = useState<CimimsTodo[]>(MOCK_TODOS)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newLabel, setNewLabel] = useState<CimimsTodo['label']>('green')
  const [newPriority, setNewPriority] = useState('P2')
  const [filterLabel, setFilterLabel] = useState<string>('all')

  const toast = (msg: string, type = 'info') => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type } }))
  }

  const openTodos = todos.filter(t => t.status === 'open')
  const closedTodos = todos.filter(t => t.status !== 'open')
  let filtered = filterLabel === 'all' ? openTodos : openTodos.filter(t => t.label === filterLabel)
  const redCount = openTodos.filter(t => t.label === 'red').length
  const greenCount = openTodos.filter(t => t.label === 'green').length
  const blueCount = openTodos.filter(t => t.label === 'blue').length

  function handleDone(id: string) {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, status: 'done' as const, updatedAt: new Date().toISOString() } : t))
    toast('已标记为完成', 'success')
  }

  function handleDismiss(id: string) {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, status: 'dismissed' as const, updatedAt: new Date().toISOString() } : t))
    toast('已忽略', 'info')
  }

  function handleAdd() {
    if (!newTitle.trim()) return
    const todo: CimimsTodo = {
      id: `t${Date.now()}`,
      title: newTitle.trim(),
      label: newLabel,
      priority: newPriority as 'P1' | 'P2' | 'P3',
      status: 'open',
      createdAt: new Date().toISOString(),
    }
    setTodos(prev => [...prev, todo])
    setNewTitle('')
    setShowAdd(false)
    toast('待办已创建', 'success')
  }

  return (
    <div className="px-8 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">我的待办</h1>
          <p className="text-[13px] text-ink-3 mt-1">BB-06 规范 · {openTodos.length} 项 open · {closedTodos.length} 项 done</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="px-4 py-2 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2 flex items-center gap-1.5 shadow-card">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          新增
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Red', count: redCount, color: 'text-danger', dot: 'bg-danger', desc: '紧急事件' },
          { label: 'Green', count: greenCount, color: 'text-success', dot: 'bg-success', desc: '例行任务' },
          { label: 'Blue', count: blueCount, color: 'text-research', dot: 'bg-research', desc: 'FYI 通知' },
        ].map(s => (
          <div key={s.label} className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-3 h-3 rounded-full ${s.dot}`}></span>
              <span className={`text-[28px] font-semibold font-mono ${s.color}`}>{s.count}</span>
              <span className="text-[14px] text-ink-3">{s.label}</span>
            </div>
            <div className="text-[11.5px] text-ink-3">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        {['all', 'red', 'green', 'blue'].map(f => (
          <button key={f} onClick={() => setFilterLabel(f)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition ${
              filterLabel === f
                ? f === 'red' ? 'bg-danger text-pure' : f === 'green' ? 'bg-success text-pure' : f === 'blue' ? 'bg-research text-pure' : 'bg-ignite text-pure'
                : 'bg-pure border border-progress text-ink-3 hover:bg-module'
            }`}>
            {f === 'all' ? '全部' : labelText[f]} ({f === 'all' ? openTodos.length : openTodos.filter(t => t.label === f).length})
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
        <div className="divide-y divide-progress">
          {filtered.map((todo) => {
            const dot = labelDots[todo.label]
            const urgencyCfg = INCIDENT_URGENCY[todo.priority as keyof typeof INCIDENT_URGENCY] || INCIDENT_URGENCY.P3
            return (
              <div key={todo.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-module transition">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`}></span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-pure font-mono ${urgencyCfg.bg}`}>{urgencyCfg.code}</span>
                <div className="flex-1 text-[13px] text-ink">{todo.title}</div>
                {todo.dueAt && <div className="text-[11.5px] text-ink-3 font-mono flex-shrink-0">{todo.dueAt}</div>}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => handleDismiss(todo.id)} className="px-2.5 py-1.5 rounded-lg border border-progress text-[12px] text-ink-3 hover:bg-module">Dismiss</button>
                  <button onClick={() => handleDone(todo.id)} className="px-2.5 py-1.5 rounded-lg bg-ignite text-pure text-[12px] font-medium hover:bg-ignite-2">Done</button>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-[13px] text-ink-3">暂无待办 ✓</div>
          )}
        </div>
      </div>

      {/* Done History */}
      {closedTodos.length > 0 && (
        <div className="mt-5 bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden opacity-70">
          <div className="px-5 py-3 border-b border-progress">
            <h3 className="text-[13px] font-medium text-ink-3">已完成 ({closedTodos.length})</h3>
          </div>
          <div className="divide-y divide-progress">
            {closedTodos.map((todo) => {
              const dot = labelDots[todo.label]
              const urgencyCfg = INCIDENT_URGENCY[todo.priority as keyof typeof INCIDENT_URGENCY] || INCIDENT_URGENCY.P3
              return (
                <div key={todo.id} className="px-5 py-2.5 flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot} opacity-50`}></span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-pure font-mono ${urgencyCfg.bg} opacity-60`}>{urgencyCfg.code}</span>
                  <div className="flex-1 text-[12.5px] text-ink-3 line-through">{todo.title}</div>
                  <span className="text-[11px] text-ink-4">{todo.status === 'done' ? '✓ Done' : 'Dismissed'}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-pure rounded-2xl shadow-card-hover p-6 w-[440px]" onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-ink mb-4">新建待办</h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-[12px] text-ink-3 font-medium mb-1.5">标题</label>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="待办事项"
                  className="w-full px-4 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 focus:bg-pure"
                  autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-ink-3 font-medium mb-1.5">BB-06 标签</label>
                  <div className="flex gap-2">
                    {(['red', 'green', 'blue'] as const).map(l => (
                      <button key={l} onClick={() => setNewLabel(l)}
                        className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition ${
                          newLabel === l
                            ? l === 'red' ? 'bg-danger text-pure' : l === 'green' ? 'bg-success text-pure' : 'bg-research text-pure'
                            : 'border border-progress text-ink-3 hover:bg-module'
                        }`}>
                        <span className={`w-2 h-2 rounded-full inline-block mr-1 ${labelDots[l]}`}></span>
                        {labelText[l]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] text-ink-3 font-medium mb-1.5">紧急度</label>
                  <select value={newPriority} onChange={e => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30">
                    <option value="P1">P1 阻断</option>
                    <option value="P2">P2 影响效率</option>
                    <option value="P3">P3 一般</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleAdd} disabled={!newTitle.trim()}
                className="flex-1 py-2.5 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2 disabled:opacity-40">
                创建
              </button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-lg border border-progress text-[13px] hover:bg-module">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
