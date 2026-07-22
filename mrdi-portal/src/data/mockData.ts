// ============================================================
// MRDI Portal — Mock Data（示意数据，生产替换）
// ============================================================

export const kpiData = {
  oee: { value: 86.4, delta: +2.1, unit: '%' },
  wipLots: { value: 142, hold: 8, running: 124, done: 10 },
  utilization: { value: 78.9, target: 82 },
  yield: { value: 94.2, delta: +0.3 },
}

export type Area = 'Photo' | 'Etch' | 'Diffusion' | 'CMP' | 'WireBond'

export interface Equipment {
  id: string
  name: string
  area: Area
  status: 'running' | 'idle' | 'down' | 'maintenance'
}

export const equipmentMatrix: Equipment[] = [
  // Photo
  { id: 'P01', name: 'Photo #1', area: 'Photo', status: 'running' },
  { id: 'P02', name: 'Photo #2', area: 'Photo', status: 'running' },
  { id: 'P03', name: 'Photo #3', area: 'Photo', status: 'idle' },
  { id: 'P04', name: 'Photo #4', area: 'Photo', status: 'down' },
  { id: 'P05', name: 'Photo #5', area: 'Photo', status: 'running' },
  // Etch
  { id: 'E01', name: 'Etch #1', area: 'Etch', status: 'running' },
  { id: 'E02', name: 'Etch #2', area: 'Etch', status: 'running' },
  { id: 'E03', name: 'Etch #3', area: 'Etch', status: 'maintenance' },
  { id: 'E04', name: 'Etch #4', area: 'Etch', status: 'down' },
  { id: 'E05', name: 'Etch #5', area: 'Etch', status: 'running' },
  // Diffusion
  { id: 'D01', name: 'Diffusion #1', area: 'Diffusion', status: 'running' },
  { id: 'D02', name: 'Diffusion #2', area: 'Diffusion', status: 'idle' },
  { id: 'D03', name: 'Diffusion #3', area: 'Diffusion', status: 'running' },
  { id: 'D04', name: 'Diffusion #4', area: 'Diffusion', status: 'running' },
  // CMP
  { id: 'C01', name: 'CMP #1', area: 'CMP', status: 'running' },
  { id: 'C02', name: 'CMP #2', area: 'CMP', status: 'maintenance' },
  { id: 'C03', name: 'CMP #3', area: 'CMP', status: 'running' },
  // WireBond
  { id: 'W01', name: 'WireBond #1', area: 'WireBond', status: 'running' },
  { id: 'W02', name: 'WireBond #2', area: 'WireBond', status: 'idle' },
  { id: 'W03', name: 'WireBond #3', area: 'WireBond', status: 'running' },
]

export interface LotItem {
  id: string
  product: string
  steps: { name: string; start: number; end: number; status: 'done' | 'running' | 'pending' }[]
}

export const lotGanttData: LotItem[] = [
  {
    id: 'WIP-2025-0731-A',
    product: '8" Wafer A',
    steps: [
      { name: 'Photo', start: 0, end: 25, status: 'done' },
      { name: 'Etch', start: 25, end: 50, status: 'done' },
      { name: 'Diffusion', start: 50, end: 70, status: 'running' },
      { name: 'CMP', start: 70, end: 90, status: 'pending' },
      { name: 'WB', start: 90, end: 100, status: 'pending' },
    ],
  },
  {
    id: 'WIP-2025-0731-B',
    product: '8" Wafer B',
    steps: [
      { name: 'Photo', start: 10, end: 40, status: 'running' },
      { name: 'Etch', start: 40, end: 65, status: 'pending' },
      { name: 'Diffusion', start: 65, end: 85, status: 'pending' },
      { name: 'CMP', start: 85, end: 100, status: 'pending' },
    ],
  },
  {
    id: 'WIP-2025-0731-C',
    product: '12" Wafer C',
    steps: [
      { name: 'Photo', start: 0, end: 20, status: 'done' },
      { name: 'Etch', start: 20, end: 45, status: 'running' },
      { name: 'Diffusion', start: 45, end: 70, status: 'pending' },
      { name: 'CMP', start: 70, end: 90, status: 'pending' },
      { name: 'WB', start: 90, end: 100, status: 'pending' },
    ],
  },
  {
    id: 'WIP-2025-0730-D',
    product: '8" Wafer D',
    steps: [
      { name: 'Photo', start: 0, end: 100, status: 'done' },
      { name: 'Etch', start: 0, end: 100, status: 'done' },
      { name: 'Diffusion', start: 0, end: 100, status: 'done' },
      { name: 'CMP', start: 0, end: 100, status: 'done' },
      { name: 'WB', start: 60, end: 100, status: 'running' },
    ],
  },
  {
    id: 'WIP-2025-0730-E',
    product: '12" Wafer E',
    steps: [
      { name: 'Photo', start: 30, end: 60, status: 'running' },
      { name: 'Etch', start: 60, end: 85, status: 'pending' },
      { name: 'Diffusion', start: 85, end: 100, status: 'pending' },
    ],
  },
]

export interface Alarm {
  id: string
  level: 'red' | 'yellow'
  equipment: string
  area: Area
  rule: string
  since: string
  duration: string
  owner: string
  status: 'active' | 'acknowledged' | 'closed'
}

export const alarmTop5: Alarm[] = [
  {
    id: 'ALM-001',
    level: 'red',
    equipment: 'E04',
    area: 'Etch',
    rule: 'SPC 漂移 · CD > UCL',
    since: '08:23',
    duration: '2h 12m',
    owner: '陈工',
    status: 'active',
  },
  {
    id: 'ALM-002',
    level: 'yellow',
    equipment: 'P04',
    area: 'Photo',
    rule: '设备真空异常',
    since: '09:15',
    duration: '1h 20m',
    owner: '李工',
    status: 'active',
  },
  {
    id: 'ALM-003',
    level: 'red',
    equipment: 'C02',
    area: 'CMP',
    rule: 'Platen 温度超限',
    since: '10:02',
    duration: '0h 33m',
    owner: '张工',
    status: 'acknowledged',
  },
  {
    id: 'ALM-004',
    level: 'yellow',
    equipment: 'E03',
    area: 'Etch',
    rule: 'SPC 趋势偏移 · 3σ',
    since: '10:30',
    duration: '0h 05m',
    owner: '王工',
    status: 'active',
  },
  {
    id: 'ALM-005',
    level: 'yellow',
    equipment: 'W02',
    area: 'WireBond',
    rule: '焊线张力偏低',
    since: '10:48',
    duration: '0h 02m',
    owner: '赵工',
    status: 'active',
  },
]

export interface SubSystemCard {
  id: string
  name: string
  icon: string
  color: string
  url: string
  stats: { label: string; value: string | number; highlight?: boolean }[]
  onlineCount: number
  recentActivity: string
}

export const subSystemCards: SubSystemCard[] = [
  {
    id: 'cimrms',
    name: 'CIM-RMS',
    icon: 'FileText',
    color: 'bg-ignite',
    url: 'http://localhost:8089/cimrms',
    stats: [
      { label: '待办需求', value: 12, highlight: true },
      { label: '本周新增', value: 27 },
      { label: '平均处理', value: '3.2d' },
    ],
    onlineCount: 8,
    recentActivity: 'NC-2026-0142 刚提交',
  },
  {
    id: 'cimims',
    name: 'CIM-IMS',
    icon: 'AlertTriangle',
    color: 'bg-warn',
    url: 'http://localhost:8089/cimims',
    stats: [
      { label: '进行中', value: 5, highlight: true },
      { label: '今日新报', value: 9 },
      { label: 'SLA 超时', value: 2, highlight: true },
    ],
    onlineCount: 6,
    recentActivity: 'E04 设备告障已登记',
  },
  {
    id: 'mdm',
    name: 'MDM 主数据',
    icon: 'Cpu',
    color: 'bg-research',
    url: 'http://localhost:8089/mdm',
    stats: [
      { label: '设备主数据', value: '1,842' },
      { label: 'Recipe 库', value: 324 },
      { label: '待审核变更', value: 3 },
    ],
    onlineCount: 4,
    recentActivity: 'E04 设备主数据更新',
  },
]

// ---- Yield Sparkline (7 days) ----
export const yieldSparkline = [
  { date: '07/08', value: 93.1 },
  { date: '07/09', value: 93.5 },
  { date: '07/10', value: 92.8 },
  { date: '07/11', value: 93.9 },
  { date: '07/12', value: 94.0 },
  { date: '07/13', value: 93.9 },
  { date: '07/14', value: 94.2 },
]
