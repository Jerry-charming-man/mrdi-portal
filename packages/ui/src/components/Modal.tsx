/**
 * Modal — 模态对话框
 *
 * 用法：
 *   <Modal open={show} onClose={fn} title="确认操作">
 *     <p>确定要关闭这个告警吗？</p>
 *   </Modal>
 *
 *   <ConfirmModal
 *     open={show}
 *     onConfirm={fn}
 *     onCancel={fn}
 *     title="删除确认"
 *     message="此操作不可恢复"
 *     confirmLabel="删除"
 *     variant="danger"
 *   />
 */
import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '../utils/cn.js'
import { Button, type ButtonVariant } from './Button.js'

// ─── Base Modal ────────────────────────────────────────────────────────────────

export interface ModalProps {
  open: boolean
  onClose?: () => void
  title?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick?: boolean
  showClose?: boolean
  className?: string
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  showClose = true,
  className,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Lock scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={closeOnOverlayClick ? (e) => { if (e.target === overlayRef.current) onClose?.() } : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Panel */}
      <div
        className={cn(
          'relative w-full bg-pure rounded-2xl shadow-card-hover border border-progress/60',
          'animate-in slide-in-from-bottom-4 fade-in duration-200',
          SIZE_CLASSES[size],
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-progress/60">
            {title && (
              <h2 id="modal-title" className="text-base font-semibold text-ink">
                {title}
              </h2>
            )}
            {showClose && onClose && (
              <button
                onClick={onClose}
                className="ml-auto p-1 rounded-lg text-ink-3 hover:text-ink hover:bg-module transition-colors"
                aria-label="关闭"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-4 text-sm text-ink-2">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 px-5 pb-5 pt-2 border-t border-progress/60">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────

export interface ConfirmModalProps {
  open: boolean
  title?: string
  message?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'danger'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
  children?: React.ReactNode
}

const VARIANT_MAP: Record<string, ButtonVariant> = {
  primary: 'primary',
  danger: 'danger',
}

export function ConfirmModal({
  open,
  title = '确认操作',
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  variant = 'primary',
  loading,
  onConfirm,
  onCancel,
  children,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm" closeOnOverlayClick={!loading}>
      <div className="space-y-4">
        {message && <p className="text-ink-2">{message}</p>}
        {children}
      </div>
      <div className="flex justify-end gap-3 mt-5">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={VARIANT_MAP[variant] ?? 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
