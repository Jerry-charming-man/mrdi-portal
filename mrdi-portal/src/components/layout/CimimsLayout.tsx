import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

const currentUser = { name: '张志豪', role: 'duty' as const, email: 'zhang.zh@mrdi.com' }

const navItems = [
  { to: '/cimims/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/cimims/incidents', label: '事件列表', icon: 'list', count: '5' },
  { to: '/cimims/duty-pool', label: '值班池', icon: 'duty', count: '3' },
  { to: '/cimims/todos', label: '我的待办', icon: 'todo', count: '2' },
  { to: '/cimims/audit', label: '审计日志', icon: 'audit' },
  { to: '/cimims/exceptions', label: '异常 / SLA', icon: 'alert', badge: '1' },
  { to: '/cimims/settings', label: '设置', icon: 'settings' },
]

function NavIcon({ type }: { type: string }) {
  const cls = 'w-[18px] h-[18px]'
  if (type === 'dashboard') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
  if (type === 'list') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
  if (type === 'duty') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
  if (type === 'todo') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
  if (type === 'audit') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
  if (type === 'alert') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
  if (type === 'settings') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
  return null
}

function getBreadcrumb(pathname: string): { section: string; page: string } {
  const map: Record<string, { section: string; page: string }> = {
    '/cimims/dashboard': { section: 'CIM-IMS', page: 'Dashboard' },
    '/cimims/incidents': { section: 'CIM-IMS', page: '事件列表' },
    '/cimims/incidents/new': { section: 'CIM-IMS', page: '上报新事件' },
    '/cimims/duty-pool': { section: 'CIM-IMS', page: '值班池' },
    '/cimims/todos': { section: 'CIM-IMS', page: '我的待办' },
    '/cimims/audit': { section: 'CIM-IMS', page: '审计日志' },
    '/cimims/exceptions': { section: 'CIM-IMS', page: '异常 / SLA' },
    '/cimims/settings': { section: 'CIM-IMS', page: '设置' },
  }
  if (pathname.startsWith('/cimims/incidents/') && pathname !== '/cimims/incidents/new') {
    return { section: 'CIM-IMS', page: '事件详情' }
  }
  return map[pathname] || { section: 'CIM-IMS', page: 'Dashboard' }
}

export default function CimimsLayout() {
  const location = useLocation()
  const [search, setSearch] = useState('')
  const breadcrumb = getBreadcrumb(location.pathname)

  const toast = (msg: string, type = 'info') => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type } }))
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ===== CIM-IMS SIDEBAR ===== */}
      <aside className="w-[240px] bg-ink text-white flex-shrink-0 flex flex-col sticky top-0 h-screen overflow-y-auto">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ignite flex items-center justify-center font-bold text-pure text-[15px]">M</div>
            <div>
              <div className="font-semibold text-[15px] tracking-tight">CIM-IMS</div>
              <div className="text-[10.5px] text-white/50 mt-0.5">IT 报案管理 · v0.9</div>
            </div>
          </div>
        </div>

        {/* Back to Portal */}
        <Link
          to="/"
          className="mx-3 mt-3 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 flex items-center gap-2 text-[12px] text-white/60 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          返回 Portal
        </Link>

        {/* Plant badge */}
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-white/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-white/35 uppercase tracking-wider">Plant</div>
            <div className="text-[12.5px] font-medium mt-0.5">Fab-1 · MEC</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 text-[13.5px]">
          <div className="px-3 py-2 text-[10px] text-white/40 uppercase tracking-wider mt-2">运营总览</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-item flex items-center gap-3 px-3 py-2.5 rounded-r-lg ${isActive ? 'active text-white' : 'text-white/70'}`
              }
            >
              <NavIcon type={item.icon} />
              <span className="flex-1">{item.label}</span>
              {item.count && (
                <span className="text-[10.5px] text-white/30 bg-white/10 px-1.5 py-0.5 rounded font-mono">{item.count}</span>
              )}
              {item.badge && (
                <span className="text-[10px] text-danger bg-danger/20 px-1.5 py-0.5 rounded font-mono sla-pulse">{item.badge}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer — duty role */}
        <div className="border-t border-white/10 px-3 py-3">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ignite to-ignite-deep flex items-center justify-center font-semibold text-pure text-[12px]">
              {currentUser.name.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate">{currentUser.name}</div>
              <div className="text-[10.5px] text-white/50 truncate flex items-center gap-1">
                <span className="px-1 py-px rounded bg-ignite/20 text-ignite text-[10px]">{currentUser.role}</span>
                <span className="text-white/40">· IT 值班</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-pure border-b border-progress sticky top-0 z-30">
          <div className="px-8 h-16 flex items-center gap-6">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-ink-3">{breadcrumb.section}</span>
              <svg className="w-3.5 h-3.5 text-ink-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
              </svg>
              <span className="font-medium text-ink">{breadcrumb.page}</span>
            </div>

            {/* Beta badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-warn-soft rounded-full text-[12px]">
              <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse"></span>
              <span className="font-medium text-warn">Beta</span>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md relative ml-auto">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                placeholder="搜事件 / 编号 / 关键词…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-module rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 focus:bg-pure transition"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Link
                to="/cimims/incidents/new"
                className="px-4 py-2 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2 flex items-center gap-1.5 shadow-card"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                上报事件
              </Link>
              <button
                onClick={() => toast('通知中心开发中')}
                className="w-9 h-9 rounded-lg hover:bg-module flex items-center justify-center relative"
                title="通知"
              >
                <svg className="w-[18px] h-[18px] text-ink-2" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger text-pure text-[10px] font-bold rounded-full flex items-center justify-center">2</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-module">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
