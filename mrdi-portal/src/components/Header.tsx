import { useLocation, Link, useNavigate } from 'react-router-dom'
import { Bell, Search, Settings, ChevronRight, ChevronDown, Zap, Pause, ClipboardCheck, AlertTriangle, BellRing, Globe } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { startAlarmPolling, stopAlarmPolling } from '../store'
import { useAuthStore } from '../store/authStore'
import { SUPPORTED_LANGUAGES, LANG_LABELS } from '../i18n'

// i18n key lookup (matches t() keys)
const pageNameKeys: Record<string, string> = {
  '/': 'nav.dashboard',
  '/notifications': 'nav.notifications',
  '/cimrms': 'nav.cimrms',
  '/cimims': 'nav.cimims',
  '/perm': 'nav.perm',
  '/mdm': 'nav.mdm',
  '/spc': 'nav.spc',
  '/alarms': 'nav.alarms',
  '/handover': 'nav.handover',
}

function getShift(t: (key: string) => string) {
  const now = new Date()
  const h = now.getHours()
  if (h >= 8 && h < 16) return { name: t('shift.morning'), range: t('shift.morningRange') }
  if (h >= 16 && h < 24) return { name: t('shift.afternoon'), range: t('shift.afternoonRange') }
  return { name: t('shift.night'), range: t('shift.nightRange') }
}

function formatTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function fireToast(msg: string, type: 'info' | 'success' | 'error' = 'info') {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type } }))
}

export default function Header() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const unreadCount = useAuthStore(s => s.unreadCount)

  // Start / stop alarm polling with Header lifecycle
  useEffect(() => {
    startAlarmPolling()
    return () => stopAlarmPolling()
  }, [])

  const shift = getShift(t)
  const [now, setNow] = useState(formatTime())
  const [qaOpen, setQaOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const qaWrapRef = useRef<HTMLDivElement>(null)
  const langWrapRef = useRef<HTMLDivElement>(null)

  const pageNameKey = pageNameKeys[location.pathname] || 'header.unknownPage'

  useEffect(() => {
    const t = setInterval(() => setNow(formatTime()), 30_000)
    return () => clearInterval(t)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (qaWrapRef.current && !qaWrapRef.current.contains(e.target as Node)) {
        setQaOpen(false)
      }
      if (langWrapRef.current && !langWrapRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const quickActions = [
    {
      icon: <Pause size={14} className="text-warn" />,
      iconBg: 'bg-warn-soft',
      label: t('header.quickActionsHint'),
      shortcut: 'P',
      action: () => fireToast('Lot 暂停面板在 Sprint 2 上线', 'info'),
    },
    {
      icon: <ClipboardCheck size={14} className="text-research" />,
      iconBg: 'bg-research/10',
      label: t('header.equipmentCheck'),
      shortcut: 'E',
      action: () => fireToast('设备点名面板在 Sprint 2 上线', 'info'),
    },
    {
      icon: <AlertTriangle size={14} className="text-danger" />,
      iconBg: 'bg-danger-soft',
      label: t('header.reportRepair'),
      shortcut: 'R',
      action: () => fireToast('已发起报修工单 #WO-2026-0418', 'success'),
    },
    {
      divider: true,
    },
    {
      icon: <BellRing size={14} className="text-ignite" />,
      iconBg: 'bg-ignite-soft',
      label: t('header.notifySupervisor'),
      shortcut: 'N',
      action: () => fireToast('已通知值班长 (张志豪) · 飞书推送', 'success'),
    },
  ]

  return (
    <header className="bg-pure border-b border-progress sticky top-0 z-30">
      <div className="px-8 h-16 flex items-center gap-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px]">
          <Link to="/" className="text-ink-3 hover:text-ignite transition-colors">{t('header.home')}</Link>
          <ChevronRight size={14} className="text-ink-4" />
          <span className="font-medium text-ink">{t(pageNameKey)}</span>
        </div>

        {/* Shift pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-module rounded-full text-[12px]">
          <span className="w-1.5 h-1.5 rounded-full bg-ignite animate-pulse" />
          <span className="font-medium text-ink-2">{shift.name} ({shift.range})</span>
          <span className="text-ink-3">· {t('header.now')} {now}</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md relative ml-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
          <input
            type="text"
            placeholder="搜 Lot / 设备 / Recipe / 工单…  ⌘K"
            className="w-full pl-10 pr-4 py-2 bg-module rounded-lg text-[13px]
              focus:outline-none focus:ring-2 focus:ring-ignite/30 focus:bg-pure transition text-ink"
          />
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">

          {/* P0-2: 快速操作下拉 */}
          <div className="relative" ref={qaWrapRef}>
            <button
              onClick={() => setQaOpen(o => !o)}
              className="px-4 py-2 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2 flex items-center gap-1.5 shadow-card transition"
            >
              <Zap size={15} strokeWidth={2.2} />
              {t('header.quickActions')}
              <ChevronDown size={13} strokeWidth={2.2} className={`transition-transform ${qaOpen ? 'rotate-180' : ''}`} />
            </button>
            {qaOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-pure rounded-xl shadow-card-hover border border-progress py-1.5 z-50">
                {quickActions.map((qa, i) =>
                  qa.divider ? (
                    <div key={`div-${i}`} className="my-1 border-t border-progress" />
                  ) : (
                    <button
                      key={qa.label}
                      onClick={() => { qa.action?.(); setQaOpen(false) }}
                      className="w-full px-4 py-2.5 hover:bg-module text-left text-[13px] flex items-center gap-2.5 transition"
                    >
                      <span className={`w-7 h-7 rounded-lg ${qa.iconBg} flex items-center justify-center flex-shrink-0`}>
                        {qa.icon}
                      </span>
                      <span className="text-ink flex-1">{qa.label}</span>
                      <span className="text-[10.5px] text-ink-4 font-mono">{qa.shortcut}</span>
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/notifications')}
            className="w-9 h-9 rounded-lg hover:bg-module flex items-center justify-center relative"
            title={t('header.notifications')}
          >
            <Bell size={18} className="text-ink-2" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-pure text-[10px] font-bold rounded-full flex items-center justify-center pulse-once">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Language switcher */}
          <div className="relative" ref={langWrapRef}>
            <button
              onClick={() => setLangOpen(o => !o)}
              className="w-9 h-9 rounded-lg hover:bg-module flex items-center justify-center"
              title="Language"
            >
              <Globe size={18} className="text-ink-2" />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-28 bg-pure rounded-xl shadow-card-hover border border-progress py-1.5 z-50">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      i18n.changeLanguage(lang)
                      setLangOpen(false)
                    }}
                    className={`w-full px-4 py-2 text-[13px] text-left transition ${
                      i18n.language === lang
                        ? 'text-ignite font-medium bg-ignite/5'
                        : 'text-ink hover:bg-module'
                    }`}
                  >
                    {LANG_LABELS[lang]}
                    {i18n.language === lang && (
                      <span className="ml-2 text-ignite text-[11px]">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="w-9 h-9 rounded-lg hover:bg-module flex items-center justify-center" title={t('header.settings')}>
            <Settings size={18} className="text-ink-2" />
          </button>
        </div>
      </div>
    </header>
  )
}
