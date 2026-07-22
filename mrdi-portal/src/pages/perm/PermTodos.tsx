import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MOCK_TODOS } from '../../types/cimperm'

type TodoColor = 'red' | 'green' | 'blue'

const COLUMNS: { color: TodoColor; label: string; icon: string; bgClass: string; textClass: string; tagClass: string }[] = [
  { color: 'red',   label: '🔴 Red',    icon: '紧急',   bgClass: 'bg-danger-soft',   textClass: 'text-danger',   tagClass: 'tag-red'   },
  { color: 'green', label: '🟢 Green',  icon: '例行',   bgClass: 'bg-success-soft',  textClass: 'text-success',  tagClass: 'tag-green' },
  { color: 'blue',  label: '🔵 Blue',   icon: 'FYI',    bgClass: 'bg-research/10',    textClass: 'text-research', tagClass: 'tag-blue'  },
]

function showToast(msg: string, type = 'info') {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type } }))
}

export default function PermTodos() {
  const [todos, setTodos] = useState(MOCK_TODOS)

  function getExpiryHours(dueAt?: string) {
    if (!dueAt) return null
    return Math.max(0, (new Date(dueAt).getTime() - Date.now()) / 3600000)
  }

  function formatExpiry(hours: number) {
    if (hours < 1) return `${Math.round(hours * 60)}min`
    if (hours < 24) return `${Math.round(hours)}h`
    return `${Math.round(hours / 24)}d`
  }

  function handleDone(id: string) {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, status: 'done' as const } : t))
    showToast('已标记完成', 'success')
  }

  function handleDismiss(id: string) {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, status: 'dismissed' as const } : t))
    showToast('已忽略', 'info')
  }

  const openCount = (color: TodoColor) => todos.filter(t => t.color === color && t.status === 'open').length
  const doneCount = todos.filter(t => t.status === 'done').length
  const dismissedCount = todos.filter(t => t.status === 'dismissed').length

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight text-ink">我的待办</h2>
          <p className="text-[13px] text-ink-3 mt-1">BB-06 规范 · {openCount('red') + openCount('green') + openCount('blue')} 项 open · {doneCount + dismissedCount} 项 done</p>
        </div>
      </div>

      {/* KPI counts */}
      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map(col => (
          <div key={col.color} className="bg-pure rounded-2xl shadow-card border border-progress/60 p-4 text-center">
            <div className={`text-[11.5px] ${col.textClass} font-medium mb-1`}>{col.label}</div>
            <div className="text-[24px] font-semibold font-mono text-ink">{openCount(col.color)}</div>
            <div className="text-[11px] text-ink-3 mt-1">
              {col.color === 'red' ? '即将过期 / 加急' : col.color === 'green' ? '已开通通知' : 'FYI'}
            </div>
          </div>
        ))}
      </div>

      {/* BB-06 three columns */}
      <div className="grid grid-cols-3 gap-5">
        {COLUMNS.map(col => {
          const items = todos.filter(t => t.color === col.color && t.status === 'open')
          return (
            <div key={col.color} className="space-y-3">
              {/* Column header */}
              <div className={`rounded-xl p-3 ${col.bgClass} text-center`}>
                <span className={`text-[12px] font-semibold ${col.textClass}`}>{col.label}</span>
                <span className="text-[12px] text-ink-3 ml-2">({items.length})</span>
              </div>

              {/* Cards */}
              {items.length === 0 ? (
                <div className="bg-pure rounded-2xl border border-progress/60 p-6 text-center">
                  <p className="text-[12px] text-ink-3">暂无待办</p>
                </div>
              ) : items.map(t => {
                const hours = getExpiryHours(t.dueAt)
                return (
                  <div key={t.id} className={`bg-pure rounded-2xl shadow-card border-l-4 border-${col.color === 'red' ? 'danger' : col.color === 'green' ? 'success' : 'research'} border-r border-y border-progress/60 p-4`}>
                    {/* Time tag */}
                    {hours !== null && hours < 24 && (
                      <span className={`${col.tagClass} px-2 py-0.5 rounded text-[10.5px] font-bold inline-block mb-2`}>
                        🔴 {formatExpiry(hours)}
                      </span>
                    )}
                    {hours !== null && hours >= 24 && (
                      <span className={`${col.tagClass} px-2 py-0.5 rounded text-[10.5px] font-bold inline-block mb-2`}>
                        {formatExpiry(hours)}
                      </span>
                    )}
                    {/* Label */}
                    <div className="text-[13px] text-ink font-medium mb-1">{t.label}</div>
                    {t.desc && <div className="text-[11.5px] text-ink-3 mb-3">{t.desc}</div>}
                    {/* Actions */}
                    <div className="flex gap-2 mt-2">
                      {col.color === 'red' ? (
                        <>
                          <button onClick={() => handleDismiss(t.id)} className="px-3 py-1.5 rounded-lg border border-progress text-[12px] hover:bg-module transition-colors">
                            Dismiss
                          </button>
                          <Link to={`/perm/perm/${t.requestId}`} className="flex-1 py-1.5 bg-research text-pure rounded-lg text-[12px] font-medium text-center hover:bg-research/90 transition-colors">
                            立即续期
                          </Link>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleDismiss(t.id)} className="px-3 py-1.5 rounded-lg border border-progress text-[12px] hover:bg-module transition-colors">
                            Dismiss
                          </button>
                          <button onClick={() => handleDone(t.id)} className="flex-1 py-1.5 bg-research text-pure rounded-lg text-[12px] font-medium hover:bg-research/90 transition-colors">
                            Done
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
