/**
 * useWebSocket — S3-7 · 前端 WebSocket client hook
 *
 * 功能：
 * - 自动连接 / 断开（mount/unmount lifecycle）
 * - JWT Bearer token 自动注入
 * - 指数退避重连（max 30s）
 * - 连接状态暴露
 * - 事件订阅
 * - React Query cache invalidation 集成
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'

export type WsStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

export interface WsEventHandlers {
  [event: string]: (data: unknown) => void
}

interface UseWebSocketOptions {
  /** Event → handler map. Handler receives the `data` field of the WS message. */
  events?: WsEventHandlers
  /** Max reconnect attempts (default 10). Set to 0 to disable reconnect. */
  maxRetries?: number
  /** Base delay ms for exponential backoff (default 500). */
  baseDelay?: number
  /** Max delay ms (default 30000). */
  maxDelay?: number
}

interface WsMessage {
  event: string
  data: unknown
  ts: string
}

const DEFAULT_OPTIONS: Required<UseWebSocketOptions> = {
  events: {},
  maxRetries: 10,
  baseDelay: 500,
  maxDelay: 30_000,
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const token = useAuthStore(s => s.token)
  const [status, setStatus] = useState<WsStatus>('idle')
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const clearRetry = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (!mountedRef.current) return
    if (!token) {
      setStatus('idle')
      return
    }

    // Build WS URL with token
    const wsUrl = `${url}?token=${encodeURIComponent(token)}`
    setStatus('connecting')

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return }
        retryCountRef.current = 0
        setStatus('connected')
      }

      ws.onmessage = (ev) => {
        if (!mountedRef.current) return
        try {
          const msg: WsMessage = JSON.parse(ev.data as string)

          // Built-in events
          if (msg.event === 'connected') {
            // welcome — already handled by onopen
          } else if (msg.event === 'error') {
            const err = msg.data as { code?: string; message?: string }
            console.warn('[ws] server error:', err)
          } else if (msg.event === 'pong') {
            // heartbeat response — silent
          }

          // User-defined event handlers
          const handler = opts.events[msg.event]
          if (handler) {
            handler(msg.data)
          }

          setLastMessage(msg)
        } catch {
          // ignore parse errors
        }
      }

      ws.onclose = (ev) => {
        if (!mountedRef.current) return
        wsRef.current = null

        // Don't reconnect on normal close (code 1000)
        if (ev.code === 1000) {
          setStatus('disconnected')
          return
        }

        // Retry with exponential backoff
        if (retryCountRef.current < opts.maxRetries) {
          const delay = Math.min(
            opts.baseDelay * 2 ** retryCountRef.current,
            opts.maxDelay,
          )
          retryCountRef.current++
          setStatus('disconnected')
          retryTimerRef.current = setTimeout(() => {
            if (mountedRef.current) connect()
          }, delay)
        } else {
          setStatus('error')
        }
      }

      ws.onerror = () => {
        if (!mountedRef.current) return
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }, [url, token, opts.events, opts.maxRetries, opts.baseDelay, opts.maxDelay])

  const disconnect = useCallback(() => {
    clearRetry()
    if (wsRef.current) {
      wsRef.current.onclose = null // prevent reconnect
      wsRef.current.close(1000, 'manual disconnect')
      wsRef.current = null
    }
    setStatus('disconnected')
  }, [clearRetry])

  // Ping every 20s to keep alive
  useEffect(() => {
    if (status !== 'connected') return
    const ping = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }))
      }
    }, 20_000)
    return () => clearInterval(ping)
  }, [status])

  // Mount → connect; unmount → disconnect
  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      clearRetry()
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close(1000, 'unmount')
        wsRef.current = null
      }
      setStatus('idle')
    }
  }, [connect, clearRetry])

  return { status, lastMessage, connect, disconnect }
}
