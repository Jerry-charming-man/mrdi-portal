import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown } from 'lucide-react'

// ---- Static data matching prototype exactly ----

const kpis = [
  {
    label: 'OEE',
    value: 86.4,
    unit: '%',
    delta: '+2.1%',
    deltaDir: 'up',
    sub: 'vs 昨日',
    color: 'ignite',
    progress: 86.4,
    progressColor: 'bg-ignite',
    icon: 'chart',
  },
  {
    label: '在制 Lot',
    value: 142,
    unit: '个',
    delta: null,
    deltaDir: null,
    sub: null,
    color: 'ink',
    progress: null,
    progressColor: null,
    stats: [
      { dot: 'bg-ignite', label: 'Running', val: 124 },
      { dot: 'bg-warn', label: 'Hold', val: 8 },
      { dot: 'bg-progress-strong', label: 'Done', val: 10 },
    ],
    icon: 'box',
  },
  {
    label: '设备稼动率',
    value: 78.9,
    unit: '%',
    delta: '−3.1%',
    deltaDir: 'down',
    sub: '目标 82.0%',
    color: 'warn',
    progress: 78.9,
    progressColor: 'bg-warn',
    icon: 'alert',
  },
  {
    label: '本班 Yield',
    value: 94.2,
    unit: '%',
    delta: '+0.6%',
    deltaDir: 'up',
    sub: 'vs 目标 93.5%',
    color: 'success',
    progress: 94.2,
    progressColor: 'bg-success',
    icon: 'check',
  },
]

const equipmentAreas = [
  {
    name: 'Photo · 光刻区',
    label: 'Photo',
    ratio: '3/4',
    cells: [
      { id: 'P01', status: 'running' },
      { id: 'P02', status: 'running' },
      { id: 'P03', status: 'idle' },
      { id: 'P04', status: 'down' },
    ],
  },
  {
    name: 'Etch · 蚀刻区',
    label: 'Etch',
    ratio: '3/5',
    cells: [
      { id: 'E01', status: 'running' },
      { id: 'E02', status: 'down' },
      { id: 'E03', status: 'running' },
      { id: 'E04', status: 'running' },
      { id: 'E05', status: 'maintenance' },
    ],
  },
  {
    name: 'Diffusion · 扩散区',
    label: 'Diffusion',
    ratio: '4/4',
    cells: [
      { id: 'D01', status: 'running' },
      { id: 'D02', status: 'running' },
      { id: 'D03', status: 'running' },
      { id: 'D04', status: 'running' },
    ],
  },
  {
    name: 'CMP · 化学机械抛光',
    label: 'CMP',
    ratio: '2/3',
    cells: [
      { id: 'C01', status: 'running' },
      { id: 'C02', status: 'idle' },
      { id: 'C03', status: 'running' },
    ],
  },
  {
    name: 'Wire Bond · 键合区',
    label: 'WireBond',
    ratio: '3/3',
    cells: [
      { id: 'W01', status: 'running' },
      { id: 'W02', status: 'running' },
      { id: 'W03', status: 'running' },
    ],
  },
]

const statusStyle: Record<string, string> = {
  running: 'bg-success-soft border border-success/30 text-success',
  idle: 'bg-warn-soft border border-warn/30 text-warn',
  down: 'bg-danger-soft border border-danger/30 text-danger',
  maintenance: 'bg-module border border-progress-strong text-ink-3',
}

const lots = [
  { id: 'WIP-0731-A', bars: [
    { w: '15%', bg: 'bg-ignite rounded-l', label: '' },
    { w: '35%', bg: 'bg-ignite-dim', label: '' },
    { w: '25%', bg: 'bg-research/80', label: '' },
    { w: '20%', bg: 'bg-pink/80 rounded-r', label: '' },
  ]},
  { id: 'WIP-0731-B', bars: [
    { w: '10%', bg: 'bg-ignite rounded-l', label: '' },
    { w: '20%', bg: 'bg-ignite-dim', label: '' },
    { w: '30%', bg: 'bg-research/80', label: '' },
    { w: '15%', bg: 'bg-warn/80', label: '' },
  ]},
  { id: 'WIP-0731-C', bars: [
    { w: '5%', bg: 'bg-ignite-dim rounded-l', label: '' },
    { w: '40%', bg: 'bg-research/80', label: '' },
    { w: '30%', bg: 'bg-pink/80 rounded-r', label: '' },
  ]},
  { id: 'WIP-0731-D', bars: [
    { w: '45%', bg: 'bg-danger-soft border border-danger/40 rounded-l', label: '' },
    { w: '10%', bg: 'bg-ignite-dim rounded-r', label: '' },
  ]},
  { id: 'WIP-0731-E', bars: [
    { w: '15%', bg: 'bg-ignite-dim rounded-l', label: '' },
    { w: '35%', bg: 'bg-research/80 rounded-r', label: '' },
  ]},
  { id: 'WIP-0731-F', bars: [
    { w: '15%', bg: 'bg-ignite rounded-l', label: '' },
    { w: '25%', bg: 'bg-ignite-dim rounded-r', label: '' },
  ]},
]

const alarms = [
  { level: 'P1', levelColor: 'bg-danger text-pure', equip: 'E02 · Etch', time: '12 min', title: '腔体压力超上限 1.8×10⁻⁷ Torr', owner: '李工 (EE)' },
  { level: 'P1', levelColor: 'bg-danger text-pure', equip: 'P04 · Photo', time: '38 min', title: '灯管寿命到期, 自动停机', owner: '王工 (EE)' },
  { level: 'P2', levelColor: 'bg-warn text-pure', equip: 'C02 · CMP', time: '1.2h', title: '抛光垫厚度低于阈值 2.1mm', owner: '未指派' },
  { level: 'P2', levelColor: 'bg-warn text-pure', equip: 'D02 · Diffusion', time: '2.4h', title: 'SPC 漂移 (CD 偏差 +3σ)', owner: '陈工 (PE)' },
  { level: 'P3', levelColor: 'bg-ink-3 text-pure', equip: 'W02 · WB', time: '4.1h', title: 'Wire Pull 强度低于规格下限', owner: null },
]



function KpiIcon({ type }: { type: string }) {
  if (type === 'chart') return (
    <svg className="w-4 h-4 text-ignite" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
    </svg>
  )
  if (type === 'box') return (
    <svg className="w-4 h-4 text-ignite" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
    </svg>
  )
  if (type === 'alert') return (
    <svg className="w-4 h-4 text-warn" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
    </svg>
  )
  if (type === 'check') return (
    <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  )
  return null
}


function handleCellClick(id: string) {
  const status = document.querySelector(`[data-eq="${id}"]`)?.getAttribute('data-status') || ''
  const label = status === 'down' ? '故障' : status === 'idle' ? '待机' : status === 'maintenance' ? '维护中' : '运行中'
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg: `${id} · 当前状态: ${label}`, type: 'info' } }))
}

export default function Dashboard() {
  return (
    <div className="px-8 py-6">

      {/* ===== GREETING ===== */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-ink">早班运营总览</h1>
          <p className="text-[13px] text-ink-3 mt-1">实时反映 Fab-1 · MEC 厂区生产状态 · 数据 5 秒刷新</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3.5 py-2 rounded-lg border border-progress text-[13px] hover:bg-module flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            本班日报
          </button>
          <button className="px-4 py-2 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2 flex items-center gap-1.5 shadow-card">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            新建工单
          </button>
        </div>
      </div>

      {/* ===== KPI STRIP ===== */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="kpi-card bg-pure rounded-2xl shadow-card p-5 border border-progress/60">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[12px] text-ink-3 font-medium uppercase tracking-wider">{kpi.label}</div>
              <div className="w-7 h-7 rounded-lg bg-ignite-soft flex items-center justify-center">
                <KpiIcon type={kpi.icon} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <div className={`text-[32px] font-semibold tracking-tight font-mono ${kpi.color === 'warn' ? 'text-danger' : 'text-ink'}`}>
                {kpi.value}<span className="text-[18px] text-ink-3">{kpi.unit}</span>
              </div>
              {kpi.label === '设备稼动率' && (
                <div className="text-[12px] text-danger font-medium ml-1">低于目标</div>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[12px]">
              {kpi.delta && (
                <>
                  {kpi.deltaDir === 'up' ? (
                    <TrendingUp size={12} className="text-success" />
                  ) : (
                    <TrendingDown size={12} className="text-danger" />
                  )}
                  <span className={kpi.deltaDir === 'up' ? 'text-success font-medium' : 'text-danger font-medium'}>{kpi.delta}</span>
                  {kpi.sub && <span className="text-ink-3">{kpi.sub}</span>}
                </>
              )}
              {kpi.stats && kpi.stats.map((s, j) => (
                <span key={j} className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
                  <span className="text-ink-3">{s.label}</span>
                  <span className="font-mono font-medium text-ink">{s.val}</span>
                </span>
              ))}
            </div>
            {kpi.progress !== null && (
              <div className="mt-3 h-1 bg-module rounded-full overflow-hidden">
                <div className={`h-full ${kpi.progressColor} rounded-full`} style={{ width: `${kpi.progress}%` }}></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ===== 3-COL GRID ===== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-6">

        {/* ---- LEFT · Equipment Matrix ---- */}
        <div className="md:col-span-5 bg-pure rounded-2xl shadow-card border border-progress/60">
          <div className="px-5 py-4 border-b border-progress flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-ink">产线状态矩阵</h3>
              <p className="text-[11.5px] text-ink-3 mt-0.5">19 台关键设备 · 点击查看详情</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-ink-3">
              {[['bg-success','运行'],['bg-warn','待机'],['bg-danger','故障'],['bg-progress-strong','维护']].map(([c,l]) => (
                <span key={l} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${c}`}></span>{l}
                </span>
              ))}
            </div>
          </div>
          <div className="p-5 space-y-4">
            {equipmentAreas.map((area) => (
              <div key={area.name}>
                <div className="text-[11.5px] text-ink-3 font-medium mb-2 flex items-center justify-between">
                  <span>{area.name}</span>
                  <span className="font-mono text-ink-2">{area.ratio} 运行</span>
                </div>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${area.cells.length}, 1fr)` }}>
                  {area.cells.map((cell) => (
                    <div
                      key={cell.id}
                      data-eq={cell.id}
                      data-status={cell.status}
                      onClick={() => handleCellClick(cell.id)}
                      className={`eq-cell aspect-square rounded-lg flex items-center justify-center text-[11px] font-mono font-medium ${statusStyle[cell.status]}`}
                      title={cell.status === 'running' ? '正常运行' : cell.status === 'idle' ? '待机中 - 换 Lot' : cell.status === 'down' ? '故障' : '维护中'}
                    >
                      {cell.id}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---- MIDDLE · Lot Gantt ---- */}
        <div className="md:col-span-5 bg-pure rounded-2xl shadow-card border border-progress/60 flex flex-col">
          <div className="px-5 py-4 border-b border-progress flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-ink">今日 Lot 进度</h3>
              <p className="text-[11.5px] text-ink-3 mt-0.5">08:00 — 16:00 · 早班</p>
            </div>
            <Link to="/spc" className="text-[12px] text-ignite font-medium hover:underline">查看全部 →</Link>
          </div>
          <div className="p-5 flex-1">
            {/* Time axis */}
            <div className="flex items-center text-[10px] text-ink-3 font-mono mb-2 pl-[88px]">
              <div className="flex-1 text-left">08</div>
              <div className="flex-1 text-center">10</div>
              <div className="flex-1 text-center">12</div>
              <div className="flex-1 text-center">14</div>
              <div className="flex-1 text-right">16</div>
            </div>
            {/* Gantt rows */}
            <div className="space-y-1.5">
              {lots.map((lot) => (
                <div key={lot.id} className="flex items-center gap-2 h-7">
                  <div className="w-[80px] text-[11px] font-mono font-medium text-ink-2 truncate">{lot.id}</div>
                  <div className="flex-1 h-6 bg-module rounded relative overflow-hidden">
                    {/* Now line */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-[50%] -translate-x-1/2 w-0.5 h-7 bg-ink z-10" />
                    {lot.bars.map((bar, bi) => (
                      <div key={bi} className={`gantt-bar absolute top-0 bottom-0 ${bar.bg}`}
                        style={{ left: bi === 0 ? '0' : undefined, width: bar.w }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="mt-5 pt-4 border-t border-progress flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-ink-3">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-ignite"></span>Photo</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-ignite-dim"></span>Etch</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-research/80"></span>Diffusion</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-pink/80"></span>CMP</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-warn/80"></span>Hold</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-danger-soft border border-danger/40"></span>Rework</span>
            </div>
          </div>
        </div>

        {/* ---- RIGHT · Alarms ---- */}
        <div className="md:col-span-2 bg-pure rounded-2xl shadow-card border border-progress/60 flex flex-col">
          <div className="px-5 py-4 border-b border-progress flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-ink flex items-center gap-2">
                实时告警
                <span className="w-5 h-5 rounded-full bg-danger text-pure text-[10px] font-bold flex items-center justify-center pulse-once">3</span>
              </h3>
              <p className="text-[11.5px] text-ink-3 mt-0.5">按严重度排序</p>
            </div>
          </div>
          <div className="flex-1 p-3 space-y-2">
            {alarms.map((a, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg ${
                  a.level === 'P1' ? 'bg-danger-soft border border-danger/20' :
                  a.level === 'P2' ? 'bg-warn-soft border border-warn/20' :
                  'bg-module border border-progress'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${a.levelColor}`}>{a.level}</span>
                  <span className="text-[11px] font-mono text-ink-2">{a.equip}</span>
                  <span className="ml-auto text-[10.5px] text-ink-3">{a.time}</span>
                </div>
                <div className="text-[12.5px] text-ink leading-snug">{a.title}</div>
                {a.owner && <div className="text-[11px] text-ink-3 mt-1">责任人: <span className="text-ink-2 font-medium">{a.owner}</span></div>}
              </div>
            ))}
          </div>
          <div className="px-3 pb-3">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg: '告警中心在 Sprint 2 上线', type: 'info' } }))}
              className="block w-full text-center py-2 text-[12.5px] text-ignite font-medium hover:bg-ignite-soft rounded-lg transition"
            >
              查看全部告警 →
            </button>
          </div>
        </div>
      </div>

      {/* ===== P0-1: 今日目标达成 (col-span-12, mb-5) ===== */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[14px] font-semibold text-ink">今日目标达成</h3>
            <p className="text-[11.5px] text-ink-3 mt-0.5">截至 10:42 · 距下班交接还剩 5h 18m</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-ink-3">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success"></span>已达</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-warn"></span>接近</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-danger"></span>未达</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {/* OEE · 已达 */}
          <div className="p-4 rounded-xl border border-progress/60">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11.5px] text-ink-3 font-medium">OEE</div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-soft text-success font-medium">已达</span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-2.5">
              <div className="text-[24px] font-semibold font-mono text-ink">86.4<span className="text-[13px] text-ink-3">%</span></div>
              <div className="text-[11.5px] text-ink-3">/ 90%</div>
            </div>
            <div className="h-1.5 bg-module rounded-full overflow-hidden">
              <div className="h-full bg-ignite rounded-full" style={{ width: '95.9%' }}></div>
            </div>
            <div className="text-[10.5px] text-ink-3 mt-1.5">达成率 95.9% · 差 3.6 pp</div>
          </div>

          {/* 在制 Lot · 接近 */}
          <div className="p-4 rounded-xl border border-progress/60">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11.5px] text-ink-3 font-medium">在制 Lot</div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-warn-soft text-warn font-medium">接近</span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-2.5">
              <div className="text-[24px] font-semibold font-mono text-ink">142<span className="text-[13px] text-ink-3"></span></div>
              <div className="text-[11.5px] text-ink-3">/ 150</div>
            </div>
            <div className="h-1.5 bg-module rounded-full overflow-hidden">
              <div className="h-full bg-warn rounded-full" style={{ width: '94.7%' }}></div>
            </div>
            <div className="text-[10.5px] text-ink-3 mt-1.5">达成率 94.7% · 差 8 个</div>
          </div>

          {/* Yield · 已达 */}
          <div className="p-4 rounded-xl border border-progress/60">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11.5px] text-ink-3 font-medium">本班 Yield</div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-soft text-success font-medium">已达</span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-2.5">
              <div className="text-[24px] font-semibold font-mono text-ink">94.2<span className="text-[13px] text-ink-3">%</span></div>
              <div className="text-[11.5px] text-ink-3">/ 95.0%</div>
            </div>
            <div className="h-1.5 bg-module rounded-full overflow-hidden">
              <div className="h-full bg-ignite rounded-full" style={{ width: '99.2%' }}></div>
            </div>
            <div className="text-[10.5px] text-ink-3 mt-1.5">达成率 99.2% · 差 0.8 pp</div>
          </div>

          {/* 稼动率 · 未达 */}
          <div className="p-4 rounded-xl border border-progress/60">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11.5px] text-ink-3 font-medium">设备稼动率</div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger-soft text-danger font-medium">未达</span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-2.5">
              <div className="text-[24px] font-semibold font-mono text-ink">78.9<span className="text-[13px] text-ink-3">%</span></div>
              <div className="text-[11.5px] text-ink-3">/ 82.0%</div>
            </div>
            <div className="h-1.5 bg-module rounded-full overflow-hidden">
              <div className="h-full bg-danger rounded-full" style={{ width: '96.2%' }}></div>
            </div>
            <div className="text-[10.5px] text-ink-3 mt-1.5">达成率 96.2% · 差 3.1 pp</div>
          </div>
        </div>

        {/* 7-day Yield sparkline */}
        <div className="pt-5 border-t border-progress">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[13px] font-semibold text-ink">最近 7 天 Yield 趋势</div>
              <div className="text-[11px] text-ink-3 mt-0.5">本厂 Fab-1 · 单位 %</div>
            </div>
            <div className="text-right">
              <div className="text-[20px] font-semibold font-mono text-ink">93.6<span className="text-[12px] text-ink-3">%</span></div>
              <div className="text-[11px] text-success font-medium">周环比 +0.8%</div>
            </div>
          </div>
          <svg viewBox="0 0 600 80" className="w-full h-20" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00B388" stopOpacity="0.25"/>
                <stop offset="100%" stopColor="#00B388" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d="M0,55 L86,42 L172,48 L258,30 L344,38 L430,22 L516,18 L600,12 L600,80 L0,80 Z" fill="url(#grad)"/>
            <path d="M0,55 L86,42 L172,48 L258,30 L344,38 L430,22 L516,18 L600,12" fill="none" stroke="#00B388" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="600" cy="12" r="4" fill="#00B388"/>
            <circle cx="600" cy="12" r="8" fill="#00B388" fillOpacity="0.2"/>
          </svg>
          <div className="flex justify-between text-[10.5px] text-ink-3 font-mono mt-1">
            <span>07/08</span><span>07/09</span><span>07/10</span><span>07/11</span><span>07/12</span><span>07/13</span><span>07/14</span>
          </div>
        </div>
      </div>

      {/* ===== P0-1: 待办 (col-span-8) + 系统消息 (col-span-4) ===== */}
      <div className="grid grid-cols-12 gap-5">

        {/* My todos */}
        <div className="col-span-12 md:col-span-8 bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold text-ink">我的待办</h3>
            <Link to="/cimrms" className="text-[11.5px] text-ignite font-medium hover:underline">查看全部 →</Link>
          </div>
          <div className="grid grid-cols-3 gap-3">

            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-progress/60 hover:border-ignite hover:bg-ignite-soft/30 cursor-pointer transition">
              <input type="checkbox" className="mt-1 w-3.5 h-3.5 accent-ignite shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-pure bg-research">CIM-RMS</span>
                  <span className="text-[10.5px] text-ink-3">2h 前</span>
                </div>
                <div className="text-[12.5px] text-ink leading-snug">审批 Normal Change #NC-2026-0142</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-progress/60 hover:border-ignite hover:bg-ignite-soft/30 cursor-pointer transition">
              <input type="checkbox" className="mt-1 w-3.5 h-3.5 accent-ignite shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-pure bg-danger">告警</span>
                  <span className="text-[10.5px] text-ink-3">38 min 前</span>
                </div>
                <div className="text-[12.5px] text-ink leading-snug">确认 E02 腔体维修后 SPC 复测</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-progress/60 hover:border-ignite hover:bg-ignite-soft/30 cursor-pointer transition">
              <input type="checkbox" className="mt-1 w-3.5 h-3.5 accent-ignite shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-pure bg-ink-3">系统</span>
                  <span className="text-[10.5px] text-ink-3">5h 18min 后到期</span>
                </div>
                <div className="text-[12.5px] text-ink leading-snug">签收班次交接 (16:00)</div>
              </div>
            </div>

          </div>
        </div>

        {/* System messages */}
        <div className="col-span-12 md:col-span-4 bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold text-ink">系统消息</h3>
            <span className="text-[11px] text-ink-3">2 条</span>
          </div>
          <div className="space-y-3 text-[12.5px]">
            <div className="flex gap-2.5">
              <div className="w-1 self-stretch bg-ignite rounded-full"></div>
              <div>
                <div className="text-ink font-medium">Sprint 1 已完成 Review</div>
                <div className="text-ink-3 text-[11px] mt-0.5">07/12 · CIM-IMS 工单模块 V0 上线</div>
              </div>
            </div>
            <div className="flex gap-2.5">
              <div className="w-1 self-stretch bg-progress-strong rounded-full"></div>
              <div>
                <div className="text-ink-2 font-medium">Etch 区 E05 PM 维护</div>
                <div className="text-ink-3 text-[11px] mt-0.5">07/14 14:00 — 16:00</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ===== FOOTER ===== */}
      <footer className="mt-6 py-4 border-t border-progress text-[11.5px] text-ink-3 flex items-center justify-between">
        <div>© 2026 MRDI · Smart Fab Portal · v1.0.0-demo</div>
        <div className="flex items-center gap-4">
          <span>Data refresh: 5s</span>
          <span>·</span>
          <span>Build 2026.07.14</span>
        </div>
      </footer>
    </div>
  )
}
