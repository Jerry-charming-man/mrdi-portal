import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

// Mock current user
const currentUser = { name: '王经理', role: 'mdm-admin' as const, email: 'wang.j@mrdi.com' }

// Mock system health
// const systemHealth = [...]

const navSections = [
  {
    label: '概览',
    items: [
      { to: '/mdm', label: '仪表盘', icon: 'dashboard' },
    ],
  },
  {
    label: '身份管理',
    items: [
      { to: '/mdm/users', label: '用户管理', icon: 'users', count: '1,028' },
      { to: '/mdm/roles', label: '角色 & 权限', icon: 'shield' },
    ],
  },
  {
    label: '系统集成',
    items: [
      { to: '/mdm/systems', label: '系统注册', icon: 'server', count: '3' },
      { to: '/mdm/access-matrix', label: '访问矩阵', icon: 'grid' },
      { to: '/mdm/api-keys', label: 'API Keys', icon: 'key' },
      { to: '/mdm/permission-api', label: '权限 API 文档', icon: 'code' },
    ],
  },
  {
    label: '运维',
    items: [
      { to: '/mdm/audit', label: '审计日志', icon: 'audit', badge: 'A' },
      { to: '/mdm/login-audit', label: '登录审计', icon: 'login-audit', badge: 'S3' },
      { to: '/mdm/todos', label: '我的待办', icon: 'todo', count: '12' },
      { to: '/mdm/settings', label: '设置', icon: 'settings' },
    ],
  },
]

function NavIcon({ type }: { type: string }) {
  const cls = 'w-[18px] h-[18px]'
  if (type === 'dashboard') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
  if (type === 'users') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
  if (type === 'shield') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
  if (type === 'server') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/></svg>
  if (type === 'grid') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
  if (type === 'key') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
  if (type === 'code') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
  if (type === 'audit') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
  if (type === 'todo') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
  if (type === 'settings') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
  if (type === 'login-audit') return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
  return null
}

// ---- BREADCRUMB ----
function getBreadcrumb(pathname: string): { section: string; page: string } {
  const map: Record<string, { section: string; page: string }> = {
    '/mdm': { section: 'MDM', page: '仪表盘' },
    '/mdm/users': { section: 'MDM', page: '用户管理' },
    '/mdm/roles': { section: 'MDM', page: '角色 & 权限' },
    '/mdm/systems': { section: 'MDM', page: '系统注册' },
    '/mdm/access-matrix': { section: 'MDM', page: '访问矩阵' },
    '/mdm/api-keys': { section: 'MDM', page: 'API Keys' },
    '/mdm/permission-api': { section: 'MDM', page: '权限 API 文档' },
    '/mdm/audit': { section: 'MDM', page: '审计日志' },
    '/mdm/login-audit': { section: 'MDM', page: '登录审计' },
    '/mdm/todos': { section: 'MDM', page: '我的待办' },
    '/mdm/settings': { section: 'MDM', page: '设置' },
  }
  return map[pathname] || { section: 'MDM', page: '仪表盘' }
}

// ---- AVATAR ----
function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'lg' }) {
  const initials = name.slice(0, 1)
  const gradients: Record<string, string> = {
    '王': 'from-ignite to-ignite-deep', '陈': 'from-research to-indigo',
    '李': 'from-warn to-pink', '张': 'from-ignite-dim to-flash',
    '赵': 'from-indigo to-research', '孙': 'from-success to-ignite',
    '周': 'from-ignite-dim to-flash', '吴': 'from-danger to-pink',
    '林': 'from-ink-3 to-ink-4',
  }
  const grad = Object.entries(gradients).find(([k]) => name.includes(k))?.[1] || 'from-ink-3 to-ink-4'
  const sizeCls = size === 'lg' ? 'w-10 h-10 text-[14px]' : 'w-8 h-8 text-[12px]'
  return (
    <div className={`rounded-full bg-gradient-to-br ${grad} flex items-center justify-center font-semibold text-pure ${sizeCls}`}>
      {initials}
    </div>
  )
}

export default function MdmLayout() {
  const location = useLocation()
  const [search, setSearch] = useState('')
  const breadcrumb = getBreadcrumb(location.pathname)
  const [notifCount] = useState(3)

  const showToast = (msg: string, type = 'info') => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type } }))
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ===== MDM SIDEBAR ===== */}
      <aside className="w-[240px] bg-ink text-white flex-shrink-0 flex flex-col sticky top-0 h-screen overflow-y-auto">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ignite flex items-center justify-center font-bold text-pure text-[15px]">M</div>
            <div>
              <div className="font-semibold text-[15px] tracking-tight">MDM</div>
              <div className="text-[10.5px] text-white/50 mt-0.5">主数据管理 · V2.2</div>
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

        {/* Tenant badge */}
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-white/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-white/35 uppercase tracking-wider">Tenant</div>
            <div className="text-[12.5px] font-medium mt-0.5">mrdi-portal</div>
          </div>
          <span className="text-[10px] text-ignite bg-ignite/15 px-1.5 py-0.5 rounded">API v1</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 text-[13.5px]">
          {navSections.map((section) => (
            <div key={section.label}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/mdm'}
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
                    <span className="text-[10px] text-white/30">{item.badge}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/10 px-3 py-3">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
            <Avatar name={currentUser.name} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate">{currentUser.name}</div>
              <div className="text-[10.5px] text-white/50 truncate flex items-center gap-1">
                <span className="px-1 py-px rounded bg-ignite/20 text-ignite text-[10px]">admin</span>
                <span>· M365 SSO</span>
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

            {/* API health badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-ignite/10 rounded-full text-[12px]">
              <span className="w-1.5 h-1.5 rounded-full bg-ignite pulse-dot"></span>
              <span className="font-medium text-ignite-deep">API 健康</span>
              <span className="text-ink-3">· 12ms</span>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md relative ml-auto">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                placeholder="搜用户 / 系统 / 日志…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-module rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30 focus:bg-pure transition"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => showToast('帮助中心开发中', 'info')}
                className="w-9 h-9 rounded-lg hover:bg-module flex items-center justify-center"
                title="帮助"
              >
                <svg className="w-[18px] h-[18px] text-ink-2" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </button>
              <button
                onClick={() => showToast('通知中心开发中', 'info')}
                className="w-9 h-9 rounded-lg hover:bg-module flex items-center justify-center relative"
                title="通知"
              >
                <svg className="w-[18px] h-[18px] text-ink-2" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                {notifCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger text-pure text-[10px] font-bold rounded-full flex items-center justify-center">
                    {notifCount}
                  </span>
                )}
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
