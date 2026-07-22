/**
 * Button — 标准按钮
 *
 * 用法：
 *   <Button variant="primary" onClick={fn}>提交</Button>
 *   <Button variant="secondary" disabled>取消</Button>
 *   <Button variant="danger" size="sm">删除</Button>
 *   <Button variant="ghost" loading={isLoading}>加载中</Button>
 */
import React from 'react'
import { cn } from '../utils/cn.js'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
export type ButtonSize    = 'sm' | 'md' | 'lg'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:   'bg-ignite text-pure hover:bg-ignite-2 active:bg-ignite-deep shadow-sm hover:shadow-card',
  secondary: 'bg-module text-ink hover:bg-progress active:bg-progress-strong shadow-sm',
  danger:    'bg-danger text-pure hover:bg-danger/90 active:bg-danger/80 shadow-sm',
  ghost:     'bg-transparent text-ink hover:bg-module active:bg-progress',
  outline:   'bg-transparent text-ignite border border-ignite hover:bg-ignite/10 active:bg-ignite/20',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-base rounded-xl gap-2',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconEnd?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, iconEnd, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ignite/40 focus-visible:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        {...props}
      >
        {loading
          ? <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin" />
          : icon ?? null
        }
        {children}
        {!loading && iconEnd}
      </button>
    )
  },
)
Button.displayName = 'Button'
