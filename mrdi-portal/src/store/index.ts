import { create } from 'zustand'
import { takeOver, forceCloseIncident } from '../services/cimims'

export interface AlarmItem {
  id: string
  incidentNo: string
  urgency: 'P1' | 'P2' | 'P3'
  title: string
  status: 'pending_takeover' | 'processing' | 'transferred' | 'pending_confirm' | 'closed'
}

const POLL_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

async function fetchIncidents(): Promise<AlarmItem[]> {
  try {
    const url = `http://localhost:3002/v1/incidents?pageSize=50&page=1&dev_login=true&email=zhang.zh@mrdi.example&role=editor`
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) return []
    const data = await res.json() as { data?: Array<{
      id: string
      incident_no: string
      urgency: string
      title: string
      status: AlarmItem['status']
    }> }
    return (data.data ?? []).map(i => ({
      id: i.id,
      incidentNo: i.incident_no,
      urgency: i.urgency as AlarmItem['urgency'],
      title: i.title,
      status: i.status as AlarmItem['status'],
    }))
  } catch {
    return []
  }
}

interface AlarmStore {
  alarms: AlarmItem[]
  loading: boolean
  fetchAlarms: () => Promise<void>
  acknowledgeAlarm: (id: string) => Promise<void>
  closeAlarm: (id: string, reason?: string) => Promise<void>
}

export const useAlarmStore = create<AlarmStore>((set, get) => ({
  alarms: [],
  loading: false,

  fetchAlarms: async () => {
    set({ loading: true })
    const alarms = await fetchIncidents()
    set({ alarms, loading: false })
  },

  // 确认告警 → 通知 cimims-api 接手
  acknowledgeAlarm: async (id: string) => {
    // Optimistic update
    set(s => ({
      alarms: s.alarms.map(a =>
        a.id === id ? { ...a, status: 'processing' as const } : a
      ),
    }))
    try {
      await takeOver(id, { comment: 'Portal Alarm 页面确认' })
    } catch (err) {
      // Revert on failure
      const msg = err instanceof Error ? err.message : '确认失败'
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { msg: `确认失败: ${msg}`, type: 'error' },
      }))
      // Refresh to get server truth
      await get().fetchAlarms()
    }
  },

  // 关闭告警 → 通知 cimims-api 强制关闭
  closeAlarm: async (id: string, reason = 'Portal Alarm 页面关闭') => {
    // Optimistic update
    set(s => ({
      alarms: s.alarms.map(a =>
        a.id === id ? { ...a, status: 'closed' as const } : a
      ),
    }))
    try {
      await forceCloseIncident(id, reason)
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { msg: '告警已关闭', type: 'success' },
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : '关闭失败'
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { msg: `关闭失败: ${msg}`, type: 'error' },
      }))
      await get().fetchAlarms()
    }
  },
}))

// Start polling when imported (singleton — runs once per app lifecycle)
let pollingTimer: ReturnType<typeof setInterval> | null = null

export function startAlarmPolling() {
  if (pollingTimer) return
  const { fetchAlarms } = useAlarmStore.getState()
  fetchAlarms() // immediate fetch
  pollingTimer = setInterval(fetchAlarms, POLL_INTERVAL_MS)
}

export function stopAlarmPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}
