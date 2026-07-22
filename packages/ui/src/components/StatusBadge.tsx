/**
 * StatusBadge — 状态到 Badge 的自动映射
 *
 * 用法：
 *   <StatusBadge status="pending_manager" labels={REQUEST_STATUS_LABELS} />
 *   <StatusBadge status="pending_takeover" labels={INCIDENT_STATUS_LABELS} />
 */
import { Badge, type BadgeProps } from './Badge.js'

/** 通用标签映射类型 */
type StatusLabelMap = Record<string, string>

/** 根据 status 自动推断 Badge variant */
function inferVariant(status: string): BadgeProps['variant'] {
  const s = status.toLowerCase()
  if (s.includes('closed') || s.includes('granted') || s.includes('resolved') || s.includes('completed')) return 'success'
  if (s.includes('pending') || s.includes('in_progress') || s.includes('processing')) return 'warn'
  if (s.includes('rejected') || s.includes('expired') || s.includes('cancelled') || s.includes('failed')) return 'danger'
  if (s.includes('draft') || s.includes('draft')) return 'neutral'
  if (s.includes('submitted') || s.includes('active')) return 'info'
  return 'neutral'
}

export interface StatusBadgeProps {
  status: string
  labels?: StatusLabelMap
  className?: string
  dot?: boolean
}

export function StatusBadge({ status, labels, className, dot }: StatusBadgeProps) {
  const label = labels ? (labels[status] ?? status) : status
  const variant = inferVariant(status)
  return (
    <Badge variant={variant} className={className} dot={dot}>
      {label}
    </Badge>
  )
}
