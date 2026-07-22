import { Outlet, Link, useLocation } from 'react-router-dom'
import { MOCK_REQUESTS, MOCK_TODOS, MOCK_EXPIRING } from '../../types/cimperm'

// Sidebar nav items per design spec (8 items)
const NAV_ITEMS = [
  { label: 'Dashboard',     path: '/perm',          icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', badge: null },
  { label: '申请列表',       path: '/perm/perm',      icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', badge: MOCK_REQUESTS.length },
  { label: '申请详情',       path: '/perm/perm/prm-1', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M6.05 6.05L4.636 4.636m12.728 0L15.95 6.05M6.05 17.95l-1.414 1.414', badge: 'PRM-0312' },
  { label: '权限类型',       path: '/perm/perm-types', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', badge: null },
  { label: '我的待办',       path: '/perm/todos',     icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', badge: MOCK_TODOS.filter(t => t.status === 'open').length },
  { label: '审计日志',       path: '/perm/audit',     icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', badge: null },
  { label: '即将过期',       path: '/perm/expiring-soon', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', badge: MOCK_EXPIRING.length, pulse: true },
  { label: '设置',           path: '/perm/settings',  icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', badge: null },
]

function getPageTitle(pathname: string): string {
  if (pathname === '/perm' || pathname === '/perm/') return 'Dashboard'
  if (pathname.startsWith('/perm/perm/new')) return '提交新申请'
  if (pathname.match(/^\/perm\/perm\/[^/]+$/)) return '申请详情'
  if (pathname === '/perm/perm') return '申请列表'
  if (pathname === '/perm/perm-types') return '权限类型'
  if (pathname === '/perm/todos') return '我的待办'
  if (pathname === '/perm/audit') return '审计日志'
  if (pathname === '/perm/expiring-soon') return '即将过期'
  if (pathname === '/perm/settings') return '设置'
  return 'CIM-PERM'
}

export default function PermLayout() {
  const location = useLocation()
  const pathname = location.pathname

  function isActive(path: string) {
    if (path === '/perm') return pathname === '/perm' || pathname === '/perm/'
    if (path === '/perm/perm') return pathname === '/perm/perm' || pathname.startsWith('/perm/perm/')
    return pathname === path || pathname.startsWith(path + '/')
  }

  const pageTitle = getPageTitle(pathname)

  return (
    <div className="flex min-h-screen bg-module">
      {/* Sidebar — per design spec */}
      <aside className="w-[240px] bg-ink text-white flex-shrink-0 flex flex-col sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <Link to="/perm" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ignite flex items-center justify-center font-bold text-pure text-[15px]">P</div>
            <div>
              <div className="font-semibold text-[15px] tracking-tight leading-none">CIM-PERM</div>
              <div className="text-[10.5px] text-white/50 mt-1 leading-none">权限申请</div>
            </div>
          </Link>
        </div>

        {/* Back to portal */}
        <div className="px-3 pt-4 pb-2">
          <Link to="/" className="block px-3 py-2 rounded-lg bg-white/5 hover:bg-white/8 transition-colors cursor-pointer">
            <div className="text-[10px] text-white/40 uppercase tracking-wider">返回 Portal</div>
            <div className="text-[12px] font-medium mt-0.5">← MRDI 主门户</div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 text-[13.5px]">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={[
                'nav-item flex items-center gap-3 px-3 py-2.5 rounded-r-lg',
                isActive(item.path) ? 'active' : 'text-white/70 hover:bg-white/4 hover:text-white',
              ].join(' ')}
            >
              <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span className="flex-1">{item.label}</span>
              {item.badge !== null && (
                <span className={[
                  'text-[10.5px] px-1.5 py-0.5 rounded font-mono',
                  item.pulse
                    ? 'bg-danger text-pure sla-pulse'
                    : 'bg-ignite text-pure',
                ].join(' ')}>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/10 px-3 py-3">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ignite to-ignite-deep flex items-center justify-center text-[12px] font-semibold text-white">张</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate">张志豪</div>
              <div className="text-[10.5px] text-white/50 truncate">viewer · 申请人</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header — per design spec */}
        <header className="bg-pure border-b border-progress sticky top-0 z-30">
          <div className="px-8 h-16 flex items-center gap-6">
            <div className="flex items-center gap-2 text-[13px]">
              <Link to="/perm" className="text-ink-3 hover:text-ink transition-colors">CIM-PERM</Link>
              <svg className="w-3.5 h-3.5 text-ink-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
              <span className="font-medium text-ink">{pageTitle}</span>
            </div>
            <div className="ml-auto flex items-center gap-3 text-[12px] text-ink-3">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ignite animate-pulse" />
                <span className="font-mono">v1.0.0</span>
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
