import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getUsers, getTodos } from '../../services/mdm'
import type { MdmTodo } from '../../types/mdm'

// ── KPI icon map ─────────────────────────────────────────────────────────────
function KpiIcon({ type }: { type: string }) {
  const cls = 'w-3.5 h-3.5'
  if (type === 'users') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"/></svg>
  if (type === 'server') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/></svg>
  if (type === 'key') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
  if (type === 'shield') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
  if (type === 'todo') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
  return null
}

function QuickIcon({ type }: { type: string }) {
  const cls = 'w-3.5 h-3.5'
  if (type === 'server') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
  if (type === 'key') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
  if (type === 'user') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
  if (type === 'grid') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"/></svg>
  if (type === 'audit') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
  if (type === 'code') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
  return null
}

const labelDotColor: Record<string, string> = {
  red: 'bg-danger',
  green: 'bg-success',
  blue: 'bg-research',
}

const priorityColor: Record<string, string> = {
  P1: 'bg-danger',
  P2: 'bg-warn',
  P3: 'bg-ink-3',
}

// ── KPI card shape ────────────────────────────────────────────────────────────
interface KpiDef {
  label: string
  value: string
  sub?: string
  subColor?: string
  icon: string
  href?: string
  loading?: boolean
}

// ── Static data ──────────────────────────────────────────────────────────────
const staticKpis: KpiDef[] = [
  { label: '已注册系统', value: '3', sub: 'CIM-RMS · CIM-IMS · Portal', icon: 'server', href: '/mdm/systems' },
  { label: '活跃 API Keys', value: '3', sub: '均已签发 · 无过期', icon: 'key', href: '/mdm/api-keys' },
  { label: '全局角色', value: '4', sub: 'admin · editor · viewer · auditor', icon: 'shield', href: '/mdm/roles' },
  { label: '待办', value: '—', sub: '加载中…', icon: 'todo', href: '/mdm/todos' },
]

const quickActions = [
  { icon: 'server', iconBg: 'bg-research/10', iconColor: 'text-research', label: '注册新系统', href: '/mdm/systems' },
  { icon: 'key', iconBg: 'bg-indigo/10', iconColor: 'text-indigo', label: '生成 API Key', href: '/mdm/api-keys' },
  { icon: 'user', iconBg: 'bg-ignite/10', iconColor: 'text-ignite', label: '添加用户', href: '/mdm/users' },
  { icon: 'grid', iconBg: 'bg-module', iconColor: 'text-ink-3', label: '配置访问矩阵', href: '/mdm/access-matrix' },
  { icon: 'audit', iconBg: 'bg-module', iconColor: 'text-ink-3', label: '查看审计日志', href: '/mdm/audit' },
  { icon: 'code', iconBg: 'bg-module', iconColor: 'text-ink-3', label: 'API 集成文档', href: '/mdm/permission-api' },
]

const systemHealth = [
  { name: 'MDM API', status: 'success', latency: '12ms' },
  { name: 'CIM-IMS DB', status: 'warn', latency: '慢查询' },
  { name: 'M365 SSO', status: 'success', latency: '正常' },
]

// Fallback todos when API fails
const fallbackTodos: MdmTodo[] = [
  { id: 1, title: '审批 NC-2026-0142 · Etch 区 SPC 漂移调查', label: 'red', priority: 'P1', status: 'open', dueAt: '18:00', source: '来自 CIM-RMS', createdAt: '' },
  { id: 2, title: '复验 E02 腔体维修后 SPC 复测结果', label: 'red', priority: 'P1', status: 'open', dueAt: '14:00', source: '来自告警中心', createdAt: '' },
  { id: 3, title: '复核 E05 维护后 PM checklist', label: 'green', priority: 'P2', status: 'open', dueAt: '今天', source: '', createdAt: '' },
  { id: 4, title: 'FYI: Q3 系统升级 7/20 通知', label: 'blue', priority: 'P3', status: 'open', dueAt: '7/20', source: '', createdAt: '' },
  { id: 5, title: '新员工 onboarding 资料准备', label: 'blue', priority: 'P3', status: 'open', dueAt: '7/18', source: '', createdAt: '' },
]

// ── Dashboard component ───────────────────────────────────────────────────────
export default function MdmDashboard() {
  const [now, setNow] = useState(() => {
    const d = new Date()
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const day = dayNames[d.getDay()]
    const date = `${d.getMonth() + 1}/${d.getDate()} ${day}`
    const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
    return { date, time }
  })

  // KPI state
  const [userCount, setUserCount] = useState<number | null>(null)
  const [todoCount, setTodoCount] = useState<number | null>(null)
  const [todos, setTodos] = useState<MdmTodo[]>(fallbackTodos)
  const [todoLoadFailed, setTodoLoadFailed] = useState(false)

  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date()
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      setNow({
        date: `${d.getMonth() + 1}/${d.getDate()} ${dayNames[d.getDay()]}`,
        time: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,
      })
    }, 60000)
    return () => clearInterval(t)
  }, [])

  // ── Fetch user count ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    getUsers({ pageSize: 1 })
      .then(r => { if (!cancelled) setUserCount(r.total) })
      .catch(() => { if (!cancelled) setUserCount(null) })
    return () => { cancelled = true }
  }, [])

  // ── Fetch todos ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    getTodos()
      .then(list => {
        if (!cancelled) {
          setTodos(list.filter(t => t.status === 'open').slice(0, 5))
          setTodoCount(list.filter(t => t.status === 'open').length)
          setTodoLoadFailed(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTodoLoadFailed(true)
          setTodoCount(null)
        }
      })
    return () => { cancelled = true }
  }, [])

  // ── Build KPI list ──────────────────────────────────────────────────────
  const kpis: KpiDef[] = [
    {
      label: '用户总数',
      value: userCount !== null ? userCount.toLocaleString() : '…',
      sub: userCount !== null ? 'MDM 实时' : '加载中…',
      subColor: 'text-success',
      icon: 'users',
      href: '/mdm/users',
    },
    ...staticKpis.map(k => {
      if (k.label === '待办') {
        const label = todoCount !== null
          ? `${todoCount} 项待处理`
          : todoLoadFailed ? '加载失败' : '加载中…'
        const color = todoLoadFailed ? 'text-danger' : 'text-ink-3'
        return { ...k, value: todoCount !== null ? String(todoCount) : '—', sub: label, subColor: color }
      }
      return k
    }),
  ]

  const showToast = (msg: string) => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type: 'info' } }))
  }

  const hoursUntilEnd = 16 - new Date().getHours()

  const displayTodos = todos.length > 0 ? todos : fallbackTodos

  return (
    <div className="px-8 py-6">

      {/* Greeting */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">早安，王经理</h1>
          <p className="text-[13px] text-ink-3 mt-1">
            {now.date} · 当前 {now.time} · 距下班 {hoursUntilEnd > 0 ? `${hoursUntilEnd}h ${60 - new Date().getMinutes()}min` : '已下班'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('导出报表开发中')}
            className="px-3.5 py-2 rounded-lg border border-progress text-[13px] hover:bg-module flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            导出报表
          </button>
          <Link
            to="/mdm/todos"
            className="px-4 py-2 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2 flex items-center gap-1.5 shadow-card"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            新建待办
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            to={kpi.href ?? '#'}
            className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5 hover:shadow-card-hover transition cursor-pointer kpi-card"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11.5px] text-ink-3 font-medium uppercase tracking-wider">{kpi.label}</div>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${kpi.icon === 'users' ? 'bg-ignite/10 text-ignite' : kpi.icon === 'server' ? 'bg-research/10 text-research' : kpi.icon === 'key' ? 'bg-indigo/10 text-indigo' : kpi.icon === 'shield' ? 'bg-ignite/10 text-ignite' : 'bg-ignite/10 text-ignite'}`}>
                <KpiIcon type={kpi.icon} />
              </div>
            </div>
            <div className="text-[30px] font-semibold tracking-tight font-mono text-ink">{kpi.value}</div>
            {kpi.sub && (
              <div className={`text-[11.5px] ${kpi.subColor ?? 'text-ink-3'} mt-1`}>{kpi.sub}</div>
            )}
          </Link>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-3 gap-5 mb-6">

        {/* System permission overview (2/3) — static for now */}
        <div className="col-span-2 bg-pure rounded-2xl shadow-card border border-progress/60">
          <div className="px-5 py-4 border-b border-progress flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold">系统访问概览</h3>
              <p className="text-[11.5px] text-ink-3 mt-0.5">各系统活跃用户 · 实时</p>
            </div>
            <Link to="/mdm/systems" className="text-[12px] text-ignite font-medium hover:underline">管理 →</Link>
          </div>
          <div className="divide-y divide-progress">
            {[
              { id: 'rms', name: 'CIM-RMS', desc: 'Normal Change 需求管理', api: '/cimrms-api', version: 'v1.0.0', users: 86, change: 5, status: 'healthy' as const, color: 'bg-research/10', initial: 'R', initialColor: 'text-research' },
              { id: 'ims', name: 'CIM-IMS', desc: '报案 / 工单管理', api: '/cimims-api', version: 'v0.9.2', users: 64, change: 0, status: 'partial' as const, color: 'bg-indigo/10', initial: 'I', initialColor: 'text-indigo' },
              { id: 'portal', name: 'MRDI Portal', desc: '统一入口', api: '/portal-api', version: 'v2.3.0', users: userCount ?? 0, change: 0, status: 'healthy' as const, color: 'bg-ignite/10', initial: 'P', initialColor: 'text-ignite' },
            ].map((sys) => (
              <div key={sys.id} className="px-5 py-3.5 flex items-center gap-4 row-hover">
                <div className={`w-8 h-8 rounded-lg ${sys.color} flex items-center justify-center flex-shrink-0`}>
                  <span className={`text-[13px] font-bold ${sys.initialColor}`}>{sys.initial}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium">
                    {sys.name} <span className="text-[11px] text-ink-3 ml-1">{sys.desc}</span>
                  </div>
                  <div className="text-[11.5px] text-ink-3 mt-0.5">
                    API: <span className="font-mono text-[11px]">{sys.api}</span> · 版本 {sys.version}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[20px] font-semibold font-mono text-ink">{sys.users.toLocaleString()}</div>
                  <div className={`text-[11px] ${sys.change > 0 ? 'text-success' : 'text-ink-3'}`}>
                    {sys.change > 0 ? `↑ ${sys.change} 本周` : '—'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${sys.status === 'healthy' ? 'bg-success pulse-dot' : 'bg-warn pulse-dot'}`}></span>
                  <span className={`text-[11.5px] ${sys.status === 'healthy' ? 'text-ink-3' : 'text-warn'}`}>
                    {sys.status === 'healthy' ? '健康' : '部分离线'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel (1/3) */}
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5 flex flex-col gap-5">

          {/* Quick actions */}
          <div>
            <h3 className="text-[14px] font-semibold mb-3">快捷操作</h3>
            <div className="space-y-1">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-module text-[13px] transition-colors"
                >
                  <span className={`w-7 h-7 rounded-md ${action.iconBg} flex items-center justify-center`}>
                    <span className={action.iconColor}><QuickIcon type={action.icon} /></span>
                  </span>
                  <span>{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* System health */}
          <div className="pt-4 border-t border-progress">
            <h4 className="text-[12px] font-semibold text-ink-3 uppercase tracking-wider mb-3">系统健康</h4>
            <div className="space-y-2">
              {systemHealth.map((h) => (
                <div key={h.name} className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${h.status === 'success' ? 'bg-success' : 'bg-warn'}`}></span>
                  <span className="text-[12.5px] flex-1">{h.name}</span>
                  <span className={`text-[11.5px] font-mono ${h.status === 'success' ? 'text-ink-3' : 'text-warn'}`}>{h.latency}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* My Todos Summary */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60">
        <div className="px-5 py-4 border-b border-progress flex items-center justify-between">
          <h3 className="text-[14px] font-semibold">
            我的待办 · Top 5
            {todoLoadFailed && <span className="ml-2 text-[11px] text-danger">(API 失败，显示示例)</span>}
          </h3>
          <Link to="/mdm/todos" className="text-[12px] text-ignite font-medium hover:underline">查看全部 →</Link>
        </div>
        <div className="divide-y divide-progress">
          {displayTodos.map((todo) => (
            <div key={todo.id} className="px-5 py-3 flex items-center gap-3 row-hover cursor-pointer">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${labelDotColor[todo.label] ?? 'bg-module'}`}></span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-pure font-mono ${priorityColor[todo.priority] ?? 'bg-module'}`}>
                {todo.priority}
              </span>
              <div className="flex-1 text-[13px] text-ink truncate">{todo.title}</div>
              {todo.dueAt && (
                <div className="text-[11.5px] text-ink-3 font-mono flex-shrink-0">{todo.dueAt}</div>
              )}
            </div>
          ))}
          {displayTodos.length === 0 && (
            <div className="px-5 py-6 text-center text-[13px] text-ink-3">暂无待办事项</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-6 py-4 border-t border-progress text-[11.5px] text-ink-3 flex items-center justify-between">
        <div>MRDI · MDM · 主数据管理子系统 v2.2</div>
        <div className="flex items-center gap-4">
          <span>Build 2026.07.16</span>
        </div>
      </footer>
    </div>
  )
}
