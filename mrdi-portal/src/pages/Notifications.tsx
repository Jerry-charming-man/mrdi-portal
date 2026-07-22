/**
 * 通知收件箱 — /notifications
 * 显示当前用户的站内通知，支持标记已读 / 全部已读 / 删除
 *
 * A9 接入示例：@mrdi/ui 的 Badge / Button 组件
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Bell, CheckCheck, Trash2, LogIn, Lock, Key,
  UserPlus, UserMinus, Shield, ShieldOff, AlertTriangle,
  FileText, CheckCircle, Clock, Zap
} from 'lucide-react'
import {
  getNotifications, markRead, markAllRead, deleteNotification,
  type MdmNotification, type NotificationType,
} from '../services/mdm'
import { useAuthStore } from '../store/authStore'
import { Badge } from '@mrdi/ui/components/Badge.js'
import { Button } from '@mrdi/ui/components/Button.js'

// ─── 类型图标映射（A9: Badge component variants）─────────────────────

type BadgeVariant = 'admin'|'editor'|'viewer'|'auditor'|'success'|'danger'|'warn'|'neutral'|'info'|'danger-soft'|'warn-soft'|'success-soft'

const TYPE_CONFIG: Record<NotificationType, {
  icon: React.ElementType
  label: string
  badgeVariant: BadgeVariant
}> = {
  auth_login:          { icon: LogIn,       label: '登录提醒',   badgeVariant: 'info' },
  account_locked:       { icon: Lock,        label: '账号锁定',   badgeVariant: 'warn' },
  password_changed:     { icon: Key,         label: '密码变更',   badgeVariant: 'warn' },
  role_assigned:        { icon: UserPlus,    label: '角色分配',   badgeVariant: 'editor' },
  role_revoked:         { icon: UserMinus,   label: '角色撤销',   badgeVariant: 'danger' },
  permission_granted:  { icon: Shield,      label: '权限授予',   badgeVariant: 'info' },
  permission_revoked:  { icon: ShieldOff,   label: '权限撤销',   badgeVariant: 'danger' },
  system_alert:         { icon: AlertTriangle, label: '系统告警', badgeVariant: 'warn' },
  incident_created:     { icon: FileText,    label: '事件创建',   badgeVariant: 'info' },
  request_submitted:    { icon: FileText,    label: '需求提交',   badgeVariant: 'info' },
  approval_needed:       { icon: CheckCircle, label: '待审批',     badgeVariant: 'editor' },
  sla_warning:          { icon: Clock,       label: 'SLA 预警',   badgeVariant: 'warn' },
  sla_breach:           { icon: Zap,         label: 'SLA 超时',   badgeVariant: 'danger' },
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} 小时前`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay} 天前`
  return d.toLocaleDateString('zh-HK', { month: 'short', day: 'numeric' })
}

// ─── 单条通知 ──────────────────────────────────────────────────────────

function NotificationItem({
  n,
  onMarkRead,
  onDelete,
}: {
  n: MdmNotification
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system_alert
  const Icon = cfg.icon
  const isUnread = !n.readAt

  return (
    <div
      className={`flex items-start gap-3 px-5 py-4 border-b border-progress last:border-0 transition-colors ${
        isUnread ? 'bg-ignite/[0.06] hover:bg-ignite/[0.09]' : 'hover:bg-module'
      }`}
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-ink-5">
        <Icon size={17} className="text-ink-3" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-ignite flex-shrink-0" />}
          <span className="text-[13px] font-medium text-ink leading-snug">{n.title}</span>
        </div>
        {n.body && (
          <p className="text-[12px] text-ink-3 leading-relaxed mb-1 line-clamp-2">{n.body}</p>
        )}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-ink-4">{formatTime(n.createdAt)}</span>
          {/* A9 接入示例：@mrdi/ui Badge 组件 */}
          <Badge variant={cfg.badgeVariant}>{cfg.label}</Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* A9 接入示例：@mrdi/ui Button (ghost sm) */}
        {isUnread && (
          <Button variant="ghost" size="sm" onClick={() => onMarkRead(n.id)} title="标记已读" className="text-ink-3 hover:!text-ignite">
            <CheckCheck size={15} />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => onDelete(n.id)} title="删除" className="text-ink-3 hover:!text-danger">
          <Trash2 size={15} />
        </Button>
      </div>
    </div>
  )
}

// ─── 主页面 ─────────────────────────────────────────────────────────────

type Filter = 'all' | 'unread'

export default function Notifications() {
  const refreshUnreadCount = useAuthStore(s => s.refreshUnreadCount)
  const decrementUnread = useAuthStore(s => s.decrementUnread)

  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<MdmNotification[]>([])
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const PAGE_SIZE = 20

  const load = useCallback(async (f: Filter, p: number) => {
    setLoading(true)
    try {
      const r = await getNotifications({ unreadOnly: f === 'unread', page: p, pageSize: PAGE_SIZE })
      setData(r.data)
      setTotal(r.total)
      setUnreadCount(r.unreadCount)
      setTotalPages(r.totalPages)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(filter, page) }, [filter, page, load])

  const handleFilter = (f: Filter) => {
    setFilter(f)
    setPage(1)
  }

  const handleMarkRead = async (id: string) => {
    try {
      await markRead(id)
      setData(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
      decrementUnread()
    } catch {
      // silent
    }
  }

  const handleDelete = async (id: string) => {
    const wasUnread = data.find(n => n.id === id)?.readAt === null
    try {
      await deleteNotification(id)
      setData(prev => prev.filter(n => n.id !== id))
      setTotal(prev => prev - 1)
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1))
        decrementUnread()
      }
    } catch {
      // silent
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await markAllRead()
      setData(prev => prev.map(n => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
      setUnreadCount(0)
      refreshUnreadCount()
      if (filter === 'unread') {
        setData([])
        setTotal(0)
      }
    } catch {
      // silent
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="px-8 py-5 border-b border-progress flex items-center justify-between bg-pure">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ignite/10 flex items-center justify-center">
            <Bell size={20} className="text-ignite" />
          </div>
          <div>
            <h1 className="text-[17px] font-semibold text-ink">通知中心</h1>
            <p className="text-[12px] text-ink-4">
              {unreadCount > 0 ? `${unreadCount} 条未读` : '全部已读'}
            </p>
          </div>
        </div>
        {/* A9 接入示例：@mrdi/ui Button */}
        {unreadCount > 0 && (
          <Button variant="primary" onClick={handleMarkAllRead} loading={markingAll} icon={<CheckCheck size={15} />}>
            全部标为已读
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="px-8 pt-4 pb-2 flex items-center gap-1">
        {(['all', 'unread'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => handleFilter(f)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition ${
              filter === f
                ? 'bg-ignite text-pure'
                : 'text-ink-3 hover:text-ink hover:bg-module'
            }`}
          >
            {f === 'all' ? '全部' : `未读${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-ignite border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-3 text-ink-3">
            <Bell size={40} className="opacity-20" />
            <p className="text-[14px]">
              {filter === 'unread' ? '暂无未读通知' : '暂无任何通知'}
            </p>
          </div>
        ) : (
          data.map(n => (
            <NotificationItem
              key={n.id}
              n={n}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-8 py-3 border-t border-progress flex items-center justify-between bg-pure">
          <span className="text-[12px] text-ink-4">
            第 {page} / {totalPages} 页，共 {total} 条
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-[12px] bg-module hover:bg-progress text-ink disabled:opacity-30 transition"
            >
              上一页
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg text-[12px] bg-module hover:bg-progress text-ink disabled:opacity-30 transition"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
