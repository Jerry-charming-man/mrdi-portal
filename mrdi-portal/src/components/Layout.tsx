import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

interface Toast {
  id: number
  msg: string
  type: 'info' | 'success' | 'error'
}

export default function Layout() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const onToast = (e: Event) => {
      const { msg, type } = (e as CustomEvent).detail
      const id = Date.now()
      setToasts(prev => [...prev, { id, msg, type }])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 2400)
    }

    const onTheme = (e: Event) => {
      const { dark: d } = (e as CustomEvent).detail
      document.body.classList.toggle('theme-dark', d)
      forceUpdate(n => n + 1)
    }

    window.addEventListener('show-toast', onToast)
    window.addEventListener('theme-toggle', onTheme)
    return () => {
      window.removeEventListener('show-toast', onToast)
      window.removeEventListener('theme-toggle', onTheme)
    }
  }, [])

  const toastColors: Record<string, string> = {
    info: 'border-progress text-ink',
    success: 'border-ignite text-ink',
    error: 'border-danger text-ink',
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-module">
          <Outlet />
        </main>
      </div>

      {/* Toast container */}
      <div className="fixed top-20 right-8 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`toast bg-pure border rounded-xl shadow-card-hover px-4 py-3 text-[13px] flex items-center gap-2 min-w-[240px] ${toastColors[t.type]}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-ignite shrink-0" />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
