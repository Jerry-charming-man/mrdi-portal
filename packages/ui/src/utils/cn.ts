import clsx, { type ClassValue } from 'clsx';

/**
 * 合并 className — Tailwind 推荐用法
 * `cn('p-2', condition && 'bg-red')` 比模板字符串更可控
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
