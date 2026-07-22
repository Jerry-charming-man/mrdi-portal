import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Sun, User, LogOut } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { getRequests } from '../services/cimrms'
import { getIncidents } from '../services/cimims'
import { getDashboard as getPermDashboard } from '../services/permApi'

type NavItem =
  | { section: string }
  | { to: string; exact?: boolean; label: string; badgeKey?: 'rmsApprovals' | 'rmsTodos' | 'imsTakeover' | 'permPending' | null; sprint: string | null; badgeType?: 'danger'; disabled?: boolean }

// i18n key lookup
const sidebarNav: NavItem[] = [
  { section: 'sidebar.section.overview' },
  { to: '/', exact: true, label: 'nav.dashboard', badgeKey: null, sprint: null },
  { section: 'sidebar.section.business' },
  { to: '/cimrms', label: 'nav.cimrms', badgeKey: 'rmsApprovals', sprint: null },
  { to: '/cimims', label: 'nav.cimims', badgeKey: 'imsTakeover', sprint: null },
  { to: '/perm', label: 'nav.perm', badgeKey: 'permPending', sprint: null },
  { to: '/mdm', label: 'nav.mdm', badgeKey: null, sprint: null },
  { section: 'sidebar.section.production' },
  { to: '/spc', label: 'nav.spc', badgeKey: null, sprint: 'S3', disabled: true },
  { to: '/alarms', label: 'nav.alarms', badgeKey: null, sprint: null },
  { to: '/handover', label: 'nav.handover', badgeKey: null, sprint: 'S2', disabled: true },
]

function fireToast(msg: string, type: 'info' | 'success' | 'error' = 'info') {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type } }))
}

interface SidebarCounts {
  rmsApprovals: number
  rmsTodos: number
  imsTakeover: number
  permPending: number
}

// ─── SVG icon helpers keyed by i18n label key ─────────────────────────────────

function NavIcon({ labelKey }: { labelKey: string }) {
  const icons: Record<string, React.ReactNode> = {
    'nav.dashboard': (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    'nav.cimrms': (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    'nav.cimims': (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
    'nav.perm': (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
    'nav.mdm': (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10C4 19.21 7.582 21 12 21s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
    'nav.spc': (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    'nav.alarms': (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    'nav.handover': (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  }
  return icons[labelKey] ?? null
}

// ─── User Menu ─────────────────────────────────────────────────────────────────

function fireToastSidebar(msg: string, type: 'info' | 'success' | 'error' = 'info') {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type } }))
}

function UserMenu({
  userMenuOpen,
  setUserMenuOpen,
  toggleTheme,
}: {
  userMenuOpen: boolean
  setUserMenuOpen: (v: boolean) => void
  toggleTheme: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const logout = useAuthStore(s => s.logout)
  const user = useAuthStore(s => s.user)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside the dropdown
  useEffect(() => {
    if (!userMenuOpen) return
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [userMenuOpen, setUserMenuOpen])

  const handleLogout = () => {
    logout()
    fireToastSidebar(t('userMenu.loggedOut'), 'success')
    setUserMenuOpen(false)
    navigate('/login')
  }

  const initials = user?.name ? user.name.slice(0, 1) : '?'
  const roleLabel = user?.role ? t(`userMenu.role.${user.role}`) : '—'

  return (
    <>
      <div
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ignite to-ignite-deep flex items-center justify-center text-[12px] font-semibold text-pure">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium truncate text-white/85">{user?.name ?? '—'}</div>
          <div className="text-[10.5px] text-white/50 truncate">{roleLabel}</div>
        </div>
        <ChevronDown size={16} className={`text-white/40 shrink-0 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
      </div>

      {userMenuOpen && (
        <div ref={dropdownRef} className="absolute left-3 right-3 bottom-full mb-2 bg-pure rounded-xl shadow-card-hover border border-progress py-1.5 z-50">
          <div className="px-4 py-2.5 border-b border-progress">
            <div className="text-[13px] font-medium text-ink">{user?.name}</div>
            <div className="text-[11px] text-ink-3 mt-0.5">{user?.email}</div>
            <div className="mt-1">
              <span className="text-[10.5px] px-1.5 py-0.5 rounded-full bg-ignite/10 text-ignite-2">
                {roleLabel}
              </span>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="w-full px-4 py-2.5 hover:bg-module text-left text-[13px] flex items-center gap-2.5 text-ink transition"
          >
            <span className="w-6 h-6 rounded-md bg-ignite-soft flex items-center justify-center flex-shrink-0">
              <Sun size={14} className="text-ignite" />
            </span>
            <span className="flex-1">{t('userMenu.switchTheme')}</span>
            <span className="text-[10.5px] text-ink-4 font-mono">T</span>
          </button>

          <button
            onClick={() => { navigate('/profile'); setUserMenuOpen(false) }}
            className="w-full px-4 py-2.5 hover:bg-module text-left text-[13px] flex items-center gap-2.5 text-ink transition"
          >
            <span className="w-6 h-6 rounded-md bg-module flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-ink-3" />
            </span>
            <span className="flex-1">{t('userMenu.accountSettings')}</span>
          </button>

          <div className="my-1 border-t border-progress" />

          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 hover:bg-module text-left text-[13px] flex items-center gap-2.5 text-danger transition"
          >
            <span className="w-6 h-6 rounded-md bg-danger-soft flex items-center justify-center flex-shrink-0">
              <LogOut size={14} className="text-danger" />
            </span>
            <span className="flex-1">{t('userMenu.logout')}</span>
          </button>
        </div>
      )}
    </>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { t } = useTranslation()
  const location = useLocation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [darkTheme, setDarkTheme] = useState(false)
  const userMenuWrapRef = useRef<HTMLDivElement>(null)

  // Close user menu when clicking outside
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (userMenuWrapRef.current && !userMenuWrapRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const toggleTheme = () => {
    setDarkTheme(d => !d)
    fireToast(darkTheme ? t('theme.switchToLight') : t('theme.switchToDark'), 'info')
    window.dispatchEvent(new CustomEvent('theme-toggle', { detail: { dark: !darkTheme } }))
  }

  // Aggregate badge counts via parallel queries.
  const { data: rmsApprovals } = useQuery({
    queryKey: ['sidebar', 'rms-approvals'],
    queryFn: () => getRequests({ view: 'pending_approval', page: 1, pageSize: 1 }),
    select: (d) => d.total,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
  const { data: rmsTodos } = useQuery({
    queryKey: ['sidebar', 'rms-todos'],
    queryFn: () => getRequests({ view: 'pending_action', page: 1, pageSize: 1 }),
    select: (d) => d.total,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
  const { data: imsTakeover } = useQuery({
    queryKey: ['sidebar', 'ims-takeover'],
    queryFn: () => getIncidents({ view: 'pending_takeover', page: 1, pageSize: 1 }),
    select: (d) => d.total,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
  const { data: permDash } = useQuery({
    queryKey: ['sidebar', 'perm-dashboard'],
    queryFn: getPermDashboard,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const counts: SidebarCounts = {
    rmsApprovals: rmsApprovals ?? 0,
    rmsTodos: rmsTodos ?? 0,
    imsTakeover: imsTakeover ?? 0,
    permPending: (permDash?.pending_it ?? 0) + (permDash?.pending_owner ?? 0),
  }

  const getBadge = (key: keyof SidebarCounts | null | undefined): string | null => {
    if (!key) return null
    const n = counts[key]
    if (!n) return null
    return String(n)
  }

  return (
    <aside className="w-[240px] bg-ink text-white flex-shrink-0 flex flex-col sticky top-0 h-screen overflow-hidden">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-ignite flex items-center justify-center font-bold text-pure text-[15px]">
            M
          </div>
          <div>
            <div className="font-semibold text-[15px] tracking-tight leading-none text-pure">MRDI</div>
            <div className="text-[10.5px] text-white/50 mt-1 leading-none">Smart Fab Portal</div>
          </div>
        </div>
      </div>

      {/* Plant selector */}
      <div className="px-3 pt-4 pb-2">
        <div className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/8 cursor-pointer flex items-center justify-between">
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider">{t('sidebar.plant')}</div>
            <div className="text-[13px] font-medium mt-0.5 text-white/85">{t('sidebar.plantName')}</div>
          </div>
          <ChevronDown size={16} className="text-white/40" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5 text-[13.5px]">
        {sidebarNav.map((item, i) => {
          if ('section' in item) {
            return (
              <div key={i} className="px-3 py-2 text-[10px] text-white/40 uppercase tracking-wider">
                {t(item.section)}
              </div>
            )
          }

          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to || '')

          const className = `
            nav-item flex items-center gap-3 px-3 py-2.5 rounded-r-lg
            ${isActive
              ? 'active text-white bg-white/6'
              : item.disabled
                ? 'text-white/50 cursor-not-allowed pointer-events-none'
                : 'text-white/70 hover:text-white hover:bg-white/4'
            }
          `

          const badge = item.badgeKey ? getBadge(item.badgeKey as keyof SidebarCounts) : null

          const handleDisabledClick = () => {
            if (item.label === 'nav.spc') fireToast(t('sidebar.spcPlanned'), 'info')
            else if (item.label === 'nav.handover') fireToast(t('sidebar.handoverPlanned'), 'info')
          }

          return (
            <div key={item.to}>
              {item.disabled ? (
                <div className={className} onClick={handleDisabledClick}>
                  <NavIcon labelKey={item.label} />
                  <span className="flex-1">{t(item.label)}</span>
                  {badge && (
                    <span className={`text-[10.5px] px-1.5 py-0.5 rounded font-mono font-medium
                      ${item.badgeType === 'danger' ? 'bg-danger text-pure' : 'bg-ignite text-pure'}`}>
                      {badge}
                    </span>
                  )}
                  {item.sprint && (
                    <span className="text-[10px] text-white/30">{item.sprint}</span>
                  )}
                </div>
              ) : (
                <NavLink to={item.to!} end={item.exact} className={className}>
                  <NavIcon labelKey={item.label} />
                  <span className="flex-1">{t(item.label)}</span>
                  {badge && (
                    <span className={`text-[10.5px] px-1.5 py-0.5 rounded font-mono font-medium
                      ${item.badgeType === 'danger' ? 'bg-danger text-pure' : 'bg-ignite text-pure'}`}>
                      {badge}
                    </span>
                  )}
                  {item.sprint && (
                    <span className="text-[10px] text-white/30">{item.sprint}</span>
                  )}
                </NavLink>
              )}
            </div>
          )
        })}
      </nav>

      {/* User dropdown */}
      <div className="border-t border-white/10 px-3 py-3 relative" ref={userMenuWrapRef}>
        <UserMenu
          userMenuOpen={userMenuOpen}
          setUserMenuOpen={setUserMenuOpen}
          toggleTheme={toggleTheme}
        />
      </div>
    </aside>
  )
}
