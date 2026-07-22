/**
 * @mrdi/ui — barrel exports
 *
 * MRDI 前端共享 UI 组件库：
 *   - cn utility（className 合并）
 *   - Badge / StatusBadge（角色/状态/紧急度标签）
 *   - Button（标准按钮，含 loading/disabled/icon 支持）
 *   - Modal / ConfirmModal（对话框/确认框）
 *
 * 后续 sprint 添加：
 *   - Input / Select / Checkbox / Radio
 *   - KpiCard / Card / Table / Pagination / EmptyState
 *   - DurationPicker / ExpiringCountdown / Timeline
 *   - Sidebar / Header / AppShell
 */

export { cn } from './utils/cn.js'
export { Badge, type BadgeProps } from './components/Badge.js'
export { StatusBadge, type StatusBadgeProps } from './components/StatusBadge.js'
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './components/Button.js'
export { Modal, ConfirmModal, type ModalProps, type ConfirmModalProps } from './components/Modal.js'
