import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle, Plus, User, Clock, AlertCircle } from 'lucide-react'
import { getIncidents, createIncident } from '../services/cimims'
import type { IncidentUrgency, IncidentType, IncidentImpact } from '../types/cimims'

const SHIFTS = ['A 班', 'B 班', 'C 班']

// Derive current shift from hour: A=07-15, B=15-23, C=23-07
function getCurrentShift(): string {
  const h = new Date().getHours()
  if (h >= 7 && h < 15) return 'A 班'
  if (h >= 15 && h < 23) return 'B 班'
  return 'C 班'
}

const NEXT_SHIFT: Record<string, string> = {
  'A 班': 'B 班',
  'B 班': 'C 班',
  'C 班': 'A 班',
}

interface HandoverItem {
  id: number
  text: string
  priority: 'high' | 'medium'
  done: boolean
}

interface SummaryData {
  oee: number
  lotsCompleted: number
  activeAlarms: number
  pendingItems: number
}

export default function Handover() {
  const currentShift = getCurrentShift()
  const nextShiftDefault = NEXT_SHIFT[currentShift] ?? 'B 班'

  const [summary, setSummary] = useState<SummaryData>({
    oee: 0,
    lotsCompleted: 0,
    activeAlarms: 0,
    pendingItems: 0,
  })
  const [summaryLoading, setSummaryLoading] = useState(true)

  const [items, setItems] = useState<HandoverItem[]>([])
  const [newItem, setNewItem] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [nextShift, setNextShift] = useState(nextShiftDefault)

  // ── Load real active alarm count from cimims-api ───────────────────────
  useEffect(() => {
    let cancelled = false
    setSummaryLoading(true)

    Promise.all([
      // Active incidents (non-closed)
      getIncidents({ status: 'pending_takeover', pageSize: 1 })
        .then(r => ({ pending_takeover: r.total }))
        .catch(() => ({ pending_takeover: 0 })),
      getIncidents({ status: 'processing', pageSize: 1 })
        .then(r => ({ processing: r.total }))
        .catch(() => ({ processing: 0 })),
      getIncidents({ status: 'pending_confirm', pageSize: 1 })
        .then(r => ({ pending_confirm: r.total }))
        .catch(() => ({ pending_confirm: 0 })),
    ])
      .then(([a, b, c]) => {
        if (cancelled) return
        const activeAlarms = a.pending_takeover + b.processing + c.pending_confirm
        setSummary(prev => ({
          ...prev,
          activeAlarms,
          oee: prev.oee || 0,          // OEE: MES 无接入，保持 0/静态
          lotsCompleted: prev.lotsCompleted || 0, // Lot: MES 无接入，保持 0/静态
          pendingItems: activeAlarms,
        }))
        setSummaryLoading(false)
      })
      .catch(() => {
        if (!cancelled) setSummaryLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  // ── Handover items (local state, derived from real alarm count) ────────
  useEffect(() => {
    const defaultItems: HandoverItem[] = [
      { id: 1, text: `${summary.activeAlarms} 条活跃告警需持续跟进`, priority: 'high', done: false },
      { id: 2, text: '本班次值班工程师交接确认', priority: 'medium', done: false },
    ]
    setItems(prev => prev.length === 0 ? defaultItems : prev)
  }, [summary.activeAlarms])

  const addItem = () => {
    if (!newItem.trim()) return
    setItems([...items, { id: Date.now(), text: newItem.trim(), priority: 'medium', done: false }])
    setNewItem('')
  }

  const toggleItem = (id: number) => {
    setItems(items.map(i => i.id === id ? { ...i, done: !i.done } : i))
  }

  // ── Handle confirmation: create handover incident + notify ──────────────
  const handleConfirm = async () => {
    setConfirmLoading(true)
    try {
      const pendingItems = items.filter(i => !i.done)
      const handoverTitle = `[${currentShift}→${nextShift}] 班次交接 · ${new Date().toLocaleDateString('zh-CN')}`
      const handoverDesc = [
        `交班: ${currentShift}`,
        `接班: ${nextShift}`,
        `交接时间: ${new Date().toLocaleString('zh-CN')}`,
        '',
        '待跟进事项:',
        ...pendingItems.map(i => `[${i.priority === 'high' ? '高' : '中'}] ${i.text}`),
      ].join('\n')

      // Create handover incident in cimims-api
      const incident = await createIncident({
        title: handoverTitle,
        description: handoverDesc,
        type: 'other' as IncidentType,
        urgency: 'P3' as IncidentUrgency,
        impact_scope: 'team' as IncidentImpact,
      })

      console.info('[Handover] 交接记录已创建:', {
        incidentNo: incident.incidentNo,
        from: currentShift,
        to: nextShift,
        items: pendingItems.length,
        timestamp: new Date().toISOString(),
      })

      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { msg: `交接完成 · 工单 ${incident.incidentNo}`, type: 'success' },
      }))

      setConfirmLoading(false)
      setSubmitted(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '提交失败'
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { msg: `交接提交失败: ${msg}`, type: 'error' },
      }))
      setConfirmLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-success" />
          </div>
          <h2 className="text-xl font-semibold text-ink">交接完成</h2>
          <p className="text-sm text-ink-3 mt-2">
            已成功交接给 {nextShift} · 系统已通知接班人
          </p>
          <p className="text-xs text-ink-4 mt-1">交接时间：{new Date().toLocaleString('zh-CN')}</p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-6 px-5 py-2.5 bg-ignite text-pure rounded-xl hover:bg-ignite-2 transition-colors text-sm"
          >
            返回交接页面
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
        <div className="flex items-center gap-3">
          <RefreshCw size={22} className="text-ignite" />
          <div>
            <h1 className="text-lg font-semibold text-ink">班次交接</h1>
            <p className="text-sm text-ink-3">本班小结 · 待办交接 · 确认签字</p>
          </div>
          <div className="ml-auto bg-ignite/10 text-ignite text-sm px-3 py-1.5 rounded-xl font-medium">
            {currentShift} 交班
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
        <h2 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
          <Clock size={16} className="text-ignite" />
          本班小结
          {summaryLoading && (
            <span className="ml-2 text-xs text-ink-3">(加载中…)</span>
          )}
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'OEE', value: summary.oee ? `${summary.oee}%` : '—', color: 'text-ignite' },
            { label: '完成 Lot', value: summary.lotsCompleted || '—', color: 'text-ink' },
            {
              label: '活跃告警',
              value: summaryLoading ? '…' : String(summary.activeAlarms),
              color: summary.activeAlarms > 0 ? 'text-danger' : 'text-success',
            },
            { label: '待跟进', value: summaryLoading ? '…' : String(summary.pendingItems), color: 'text-warn' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className={`text-2xl font-semibold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-xs text-ink-3 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Notes — static for now, can be made dynamic later */}
        <div className="mt-4 space-y-2">
          {[
            'E04 设备 SPC 漂移，需接班人持续跟进',
            'C02 CMP 维保已申请，预计明日完成',
            '一批 Lot WIP-2025-0731-A 需在 18:00 前完成 WB 工序',
          ].map((note, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-ink bg-module rounded-xl p-3">
              <AlertCircle size={14} className="text-warn shrink-0 mt-0.5" />
              <span className="text-ink-3">{note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Handover Items */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
        <h2 className="text-base font-semibold text-ink mb-4">待交接事项</h2>

        <div className="space-y-2 mb-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all
                ${item.done ? 'bg-module opacity-60' : 'bg-module/50 hover:bg-module'}`}
            >
              <button
                onClick={() => toggleItem(item.id)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                  ${item.done ? 'bg-ignite border-ignite' : 'border-progress hover:border-ignite'}`}
              >
                {item.done && <CheckCircle size={12} className="text-pure" />}
              </button>
              <span className={`flex-1 text-sm ${item.done ? 'line-through text-ink-3' : 'text-ink'}`}>
                {item.text}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0
                ${item.priority === 'high' ? 'bg-danger/10 text-danger' : 'bg-warn/10 text-warn'}`}>
                {item.priority === 'high' ? '高' : '中'}
              </span>
            </div>
          ))}
        </div>

        {/* Add new */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="添加待交接事项..."
            className="flex-1 text-sm border border-progress rounded-xl px-4 py-2.5 bg-module
              text-ink placeholder:text-ink-4 focus:outline-none focus:border-ignite"
          />
          <button
            onClick={addItem}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-module border border-progress
              rounded-xl text-sm text-ink-3 hover:border-ignite hover:text-ignite transition-all"
          >
            <Plus size={14} /> 添加
          </button>
        </div>
      </div>

      {/* Confirm */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
        <h2 className="text-base font-semibold text-ink mb-4">确认交接</h2>

        <div className="flex items-center gap-4 mb-5">
          <div className="flex items-center gap-2">
            <User size={16} className="text-ink-3" />
            <span className="text-sm text-ink">交接给</span>
          </div>
          <select
            value={nextShift}
            onChange={(e) => setNextShift(e.target.value)}
            className="text-sm border border-progress rounded-xl px-4 py-2 bg-module text-ink
              focus:outline-none focus:border-ignite"
          >
            {SHIFTS.filter(s => s !== currentShift).map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="bg-ignite/5 border border-ignite/20 rounded-xl p-4 text-sm text-ink-3 mb-5">
          确认交接后，系统将自动通知 {nextShift} 值班人员，并在 CIM-IMS 创建交接记录。
        </div>

        <button
          onClick={handleConfirm}
          disabled={confirmLoading}
          className="w-full py-3 bg-ignite text-pure rounded-xl hover:bg-ignite-2 transition-colors
            font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {confirmLoading ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              提交中…
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              确认交接
            </>
          )}
        </button>
      </div>
    </div>
  )
}
