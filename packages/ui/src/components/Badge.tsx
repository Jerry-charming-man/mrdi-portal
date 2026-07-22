/**
 * Badge — 通用标签组件
 *
 * 用法：
 *   <Badge variant="admin">admin</Badge>
 *   <Badge variant="system">RMS</Badge>
 *   <Badge variant="success">已关闭</Badge>
 *   <Badge variant="danger">P1</Badge>
 */
import { cn } from '../utils/cn.js'

type BadgeVariant =
  | 'admin'           // 凝绿底黑字
  | 'editor'          // 凝绿淡底深绿字
  | 'viewer'          // 浅灰底深灰字
  | 'auditor'         // 研蓝淡底深蓝字
  | 'success'         // 成功 / 已关闭
  | 'danger'          // 危险 / P1
  | 'warn'            // 警告 / P2
  | 'neutral'         // 中性 / P3
  | 'info'            // 信息
  | 'danger-soft'     // 淡红底深红字
  | 'warn-soft'       // 淡黄底深黄字
  | 'success-soft'    // 淡绿底深绿字

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  admin:         'bg-ignite text-pure',
  editor:        'bg-ignite/10 text-ignite-2',
  viewer:        'bg-module text-ink-3',
  auditor:       'bg-research/10 text-research',
  success:       'bg-success/10 text-success',
  danger:        'bg-danger/10 text-danger',
  warn:          'bg-warn/10 text-warn',
  neutral:       'bg-module text-ink-3',
  info:          'bg-research/10 text-research',
  'danger-soft': 'bg-danger-soft text-danger',
  'warn-soft':   'bg-warn-soft text-warn',
  'success-soft':'bg-success-soft text-success',
}

export interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  dot?: boolean        // 显示左侧小圆点
}

export function Badge({ children, variant = 'neutral', className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      )}
      {children}
    </span>
  )
}
