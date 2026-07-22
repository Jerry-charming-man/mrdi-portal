/**
 * Parse duration string to seconds
 * e.g. "30d" → 2592000, "48h" → 172800, "1h" → 3600
 */
export function parseDuration(d: string): number {
  if (d.endsWith('d')) return parseInt(d) * 86400
  if (d.endsWith('h')) return parseInt(d) * 3600
  return parseInt(d) * 60 // minutes fallback
}

/**
 * Format seconds to duration string
 */
export function formatDuration(seconds: number): string {
  if (seconds >= 86400) return `${Math.round(seconds / 86400)}d`
  if (seconds >= 3600)  return `${Math.round(seconds / 3600)}h`
  return `${Math.round(seconds / 60)}m`
}
