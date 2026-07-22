import { useState, useEffect } from 'react'
import { BarChart3, Download, Filter, RefreshCw, AlertTriangle } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine,
} from 'recharts'
import { getSpcTrend, type SpcDataPoint } from '../services/cimrms'

const AREAS = ['Photo', 'Etch', 'Diffusion', 'CMP', 'WireBond']
const PARAMS = ['CD', 'Thickness', 'Resistance', 'Voltage', 'Current']
const EQUIPS = ['P01', 'P02', 'P03', 'P04', 'P05', 'E01', 'E02', 'E03', 'E04', 'E05']

// ---- Western Electric Rules ----
type Rule = { rule: number; label: string; short: string; index: number; value: number }

function detectRules(values: number[], ucl: number, cl: number, lcl: number): Rule[] {
  const rules: Rule[] = []
  const n = values.length

  // Rule 1: Single point outside UCL/LCL
  values.forEach((v, i) => {
    if (v > ucl || v < lcl) rules.push({ rule: 1, label: '单点超出控制限', short: 'Rule 1', index: i, value: v })
  })

  // Rule 2: 9 consecutive points on same side of CL
  for (let i = 8; i < n; i++) {
    const slice = values.slice(i - 8, i + 1)
    if (slice.every(v => v > cl)) rules.push({ rule: 2, label: '连续9点在CL上方', short: 'Rule 2', index: i, value: slice[8] })
    if (slice.every(v => v < cl)) rules.push({ rule: 2, label: '连续9点在CL下方', short: 'Rule 2', index: i, value: slice[8] })
  }

  // Rule 3: 6 consecutive points increasing or decreasing
  for (let i = 5; i < n; i++) {
    const slice = values.slice(i - 5, i + 1)
    const increasing = slice.every((v, j) => j === 0 || v > slice[j - 1])
    const decreasing = slice.every((v, j) => j === 0 || v < slice[j - 1])
    if (increasing) rules.push({ rule: 3, label: '连续6点递增', short: 'Rule 3', index: i, value: slice[5] })
    if (decreasing) rules.push({ rule: 3, label: '连续6点递减', short: 'Rule 3', index: i, value: slice[5] })
  }

  // Rule 4: 14 consecutive points alternating up/down
  for (let i = 13; i < n; i++) {
    const slice = values.slice(i - 13, i + 1)
    const alternating = slice.every((v, j) => j < 2 || (j % 2 === 0 ? v > slice[j - 2] : v < slice[j - 2]))
    if (alternating) rules.push({ rule: 4, label: '连续14点交替', short: 'Rule 4', index: i, value: slice[13] })
  }

  // Rule 5: 2 of 3 consecutive points beyond 2σ (between UCL±2σ and UCL)
  const ucl2 = cl + (ucl - cl) * 2 / 3
  const lcl2 = cl - (cl - lcl) * 2 / 3
  for (let i = 2; i < n; i++) {
    const slice = values.slice(i - 2, i + 1)
    // Rule 5: 2 of 3 consecutive points in outer third
    // Simplified: check if at least 2 of 3 points are beyond ucl2 or lcl2
    if (slice.filter(v => v > ucl2).length >= 2 || slice.filter(v => v < lcl2).length >= 2) {
      rules.push({ rule: 5, label: '2/3点超出2σ区', short: 'Rule 5', index: i, value: slice[2] })
    }
  }

  // Deduplicate by rule+index
  const seen = new Set<string>()
  return rules.filter(r => {
    const key = `${r.rule}-${r.index}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ---- Data generation ----
// (removed: was mock generateData + annotateRules)
// Real data is now loaded via getSpcTrend() + useEffect

// ---- CSV Export ----
function exportCSV(data: EnrichedPoint[]) {
  const header = '时间,实测值,UCL,CL,LCL,超出控制限,违反规则'
  const rows = data.map(d => [
    d.time, d.value, d.ucl, d.cl, d.lcl,
    d.ooc ? '是' : '否',
    d.rules.map((r: Rule) => `${r.short}(${r.label})`).join('; ') || '-',
  ].join(','))
  const csv = [header, ...rows].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `spc-trend-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ---- Custom Tooltip ----
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload
    return (
      <div className="bg-ink text-pure text-xs rounded-xl p-3 shadow-card">
        <div className="font-mono mb-1">{d.time}</div>
        <div className="flex gap-3">
          <span>实测: <b className={d.ooc ? 'text-danger' : 'text-ignite'}>{d.value}</b></span>
          <span>UCL: <b>{d.ucl}</b></span>
          <span>CL: <b>{d.cl}</b></span>
          <span>LCL: <b>{d.lcl}</b></span>
        </div>
        {d.ooc && (
          <div className="mt-1 space-y-0.5">
            {d.rules.map((r: Rule) => (
              <div key={r.rule} className="text-danger">⚠ {r.short} · {r.label}</div>
            ))}
          </div>
        )}
      </div>
    )
  }
  return null
}

const RULE_COLORS: Record<number, string> = {
  1: 'bg-danger/10 text-danger border-danger/30',
  2: 'bg-warn/10 text-warn border-warn/30',
  3: 'bg-research/10 text-research border-research/30',
  4: 'bg-indigo/10 text-indigo border-indigo/30',
}

// Enriched data point with client-side rule annotations
interface EnrichedPoint extends SpcDataPoint {
  ooc: boolean
  rules: Rule[]
}

export default function SpcTrend() {
  const [selectedArea, setSelectedArea] = useState('Etch')
  const [selectedEquip, setSelectedEquip] = useState('E04')
  const [selectedParam, setSelectedParam] = useState('CD')

  const [spcData, setSpcData] = useState<EnrichedPoint[]>([])
  const [limits, setLimits] = useState({ ucl: 108, cl: 100, lcl: 92 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Load SPC trend from cimrms-api ────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getSpcTrend(selectedArea, selectedEquip, selectedParam, 30)
      .then(result => {
        if (cancelled) return
        const values = result.data.map(d => d.value)
        const { ucl, cl, lcl } = result.limits
        setLimits({ ucl, cl, lcl })

        const rules = detectRules(values, ucl, cl, lcl)
        const enriched: EnrichedPoint[] = result.data.map((d, i) => ({
          ...d,
          ooc: d.ruleViolations.length > 0 || d.value > ucl || d.value < lcl,
          rules: rules.filter(r => r.index === i),
        }))
        setSpcData(enriched)
        setLoading(false)
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载失败')
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [selectedArea, selectedEquip, selectedParam])

  const oocCount = spcData.filter(d => d.ooc).length
  const allViolations = spcData.flatMap(d => d.rules.map((r) => ({ ...r, time: d.time, value: d.value })))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
        <div className="flex items-center gap-3">
          <BarChart3 size={22} className="text-ignite" />
          <div>
            <h1 className="text-lg font-semibold text-ink">SPC 趋势监控</h1>
            <p className="text-sm text-ink-3">实时参数控制图 · Western Electric Rules 1–8</p>
          </div>
          {oocCount > 0 && (
            <div className="ml-auto flex items-center gap-2 bg-danger/10 text-danger text-sm px-3 py-1.5 rounded-xl">
              <AlertTriangle size={14} />
              {oocCount} 点超出控制限
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-ink-3">
          <Filter size={14} />
          <span>筛选条件</span>
        </div>

        <div>
          <label className="text-xs text-ink-4 mr-2">Area:</label>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="text-sm border border-progress rounded-lg px-3 py-1.5 bg-module text-ink
              focus:outline-none focus:border-ignite"
          >
            {AREAS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-ink-4 mr-2">设备:</label>
          <select
            value={selectedEquip}
            onChange={(e) => setSelectedEquip(e.target.value)}
            className="text-sm border border-progress rounded-lg px-3 py-1.5 bg-module text-ink
              focus:outline-none focus:border-ignite font-mono"
          >
            {EQUIPS.map((e) => <option key={e}>{e}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-ink-4 mr-2">参数:</label>
          <select
            value={selectedParam}
            onChange={(e) => setSelectedParam(e.target.value)}
            className="text-sm border border-progress rounded-lg px-3 py-1.5 bg-module text-ink
              focus:outline-none focus:border-ignite"
          >
            {PARAMS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => exportCSV(spcData)}
            className="flex items-center gap-1.5 text-sm text-ink-3 border border-progress
              rounded-lg px-3 py-1.5 hover:bg-module transition-colors"
          >
            <Download size={14} /> 导出 CSV
          </button>
          <button
            onClick={() => getSpcTrend(selectedArea, selectedEquip, selectedParam, 30).then(r => {
              const values = r.data.map(d => d.value)
              const { ucl, cl, lcl } = r.limits
              setLimits({ ucl, cl, lcl })
              const rules = detectRules(values, ucl, cl, lcl)
              setSpcData(r.data.map((d, i) => ({ ...d, ooc: d.ruleViolations.length > 0 || d.value > ucl || d.value < lcl, rules: rules.filter(rr => rr.index === i) })))
            }).catch(() => {})}
            className="flex items-center gap-1.5 text-sm text-ignite border border-ignite/30
              rounded-lg px-3 py-1.5 hover:bg-ignite/5 transition-colors"
          >
            <RefreshCw size={14} /> 刷新
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="font-semibold text-ink">{selectedArea} · {selectedEquip} · {selectedParam}</span>
            <span className="text-sm text-ink-3 ml-3">最近 30 个数据点</span>
          </div>
          <div className="flex gap-4 text-xs text-ink-3">
            <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-research" /> 实测值</span>
            <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-ignite/50" /> UCL/CL/LCL</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={360}>
          {loading && !spcData.length ? (
            <div className="flex items-center justify-center h-full text-ink-3 text-sm">
              <RefreshCw size={18} className="animate-spin mr-2" /> 加载中…
            </div>
          ) : error && !spcData.length ? (
            <div className="flex items-center justify-center h-full text-danger text-sm">{error}</div>
          ) : (
          <LineChart data={spcData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D9D9D6" />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#9C9C9C' }} />
            <YAxis domain={[limits.lcl - 10, limits.ucl + 10]} tick={{ fontSize: 11, fill: '#9C9C9C' }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={limits.ucl} stroke="#B91C1C" strokeDasharray="5 5" strokeWidth={1.5} label={{ value: 'UCL', fill: '#B91C1C', fontSize: 10 }} />
            <ReferenceLine y={limits.cl} stroke="#00B388" strokeDasharray="5 5" strokeWidth={1.5} label={{ value: 'CL', fill: '#00B388', fontSize: 10 }} />
            <ReferenceLine y={limits.lcl} stroke="#B45309" strokeDasharray="5 5" strokeWidth={1.5} label={{ value: 'LCL', fill: '#B45309', fontSize: 10 }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#307FE2"
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, payload } = props
                if (payload.ooc) {
                  return <circle key={cx} cx={cx} cy={cy} r={5} fill="#B91C1C" stroke="#fff" strokeWidth={2} />
                }
                return <circle key={cx} cx={cx} cy={cy} r={3} fill="#307FE2" />
              }}
              activeDot={{ r: 5, fill: '#307FE2' }}
            />
          </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Rules violations */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
        <h2 className="text-base font-semibold text-ink mb-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-danger" />
          Western Electric Rules 违反清单
          <span className="ml-2 text-xs bg-module text-ink-3 rounded-full px-2 py-0.5">
            共 {allViolations.length} 条
          </span>
        </h2>

        {allViolations.length === 0 ? (
          <div className="text-center py-8 text-ink-3 text-sm flex items-center justify-center gap-2">
            <span className="text-success">✓</span> 所有数据点在控制限内，无规则违反
          </div>
        ) : (
          <div className="space-y-2">
            {allViolations.map((v: Rule & { time: string; value: number }, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-xl border ${RULE_COLORS[v.rule] || 'bg-module text-ink'}`}
              >
                <span className="font-mono font-bold text-xs w-6 text-center shrink-0">
                  R{v.rule}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{v.label}</span>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-mono text-ink-3">{v.time}</div>
                  <div className="text-xs font-mono text-danger font-semibold">{v.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
