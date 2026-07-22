import { useState } from 'react'
import { Bell, Search, CheckCircle, Clock, User } from 'lucide-react'
import { useAlarmStore } from '../store'

type Tab = 'red' | 'yellow' | 'closed' | 'all'

const alarmMeta = [
  { id: 'ALM-001', level: 'red', equipment: 'E04', area: 'Etch', rule: 'SPC 漂移 · CD > UCL', since: '08:23', duration: '2h 12m', owner: '陈工' },
  { id: 'ALM-002', level: 'yellow', equipment: 'P04', area: 'Photo', rule: '设备真空异常', since: '09:15', duration: '1h 20m', owner: '李工' },
  { id: 'ALM-003', level: 'red', equipment: 'C02', area: 'CMP', rule: 'Platen 温度超限', since: '10:02', duration: '0h 33m', owner: '张工' },
  { id: 'ALM-004', level: 'yellow', equipment: 'E03', area: 'Etch', rule: 'SPC 趋势偏移 · 3σ', since: '10:30', duration: '0h 05m', owner: '王工' },
  { id: 'ALM-005', level: 'yellow', equipment: 'W02', area: 'WireBond', rule: '焊线张力偏低', since: '10:48', duration: '0h 02m', owner: '赵工' },
  { id: 'ALM-006', level: 'red', equipment: 'P01', area: 'Photo', rule: '曝光剂量偏低', since: '07:00', duration: '3h 35m', owner: '陈工' },
  { id: 'ALM-007', level: 'yellow', equipment: 'D01', area: 'Diffusion', rule: '温区温度漂移', since: '06:30', duration: '4h 05m', owner: '李工' },
]

export default function Alarms() {
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const alarms = useAlarmStore(s => s.alarms)
  const acknowledgeAlarm = useAlarmStore(s => s.acknowledgeAlarm)
  const closeAlarm = useAlarmStore(s => s.closeAlarm)

  // Merge store status with static metadata
  const alarmsWithMeta = alarms.map(a => ({
    ...a,
    ...alarmMeta.find(m => m.id === a.id),
  }))

  const filtered = alarmsWithMeta.filter((a: any) => {
    if (activeTab === 'red') return a.level === 'red'
    if (activeTab === 'yellow') return a.level === 'yellow'
    if (activeTab === 'closed') return a.status === 'closed'
    return true
  }).filter((a: any) =>
    !search || a.equipment?.includes(search) || a.rule?.includes(search) || a.area?.includes(search)
  )

  const activeCount = alarms.filter((a: any) => a.status === 'active').length

  // Dynamic tab counts from store
  const tabs = [
    { id: 'red' as Tab, label: '红灯', count: alarms.filter((a: any) => a.level === 'red' && a.status !== 'closed').length },
    { id: 'yellow' as Tab, label: '黄灯', count: alarms.filter((a: any) => a.level === 'yellow' && a.status !== 'closed').length },
    { id: 'closed' as Tab, label: '已关闭', count: alarms.filter((a: any) => a.status === 'closed').length },
    { id: 'all' as Tab, label: '全部', count: alarms.length },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
        <div className="flex items-center gap-3">
          <Bell size={22} className="text-danger" />
          <div>
            <h1 className="text-lg font-semibold text-ink">告警中心</h1>
            <p className="text-sm text-ink-3">红灯/黄灯告警列表 · 实时推送</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm text-ink-3">
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse-dot" />
            {activeCount} 条活跃告警
          </div>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                  ${activeTab === t.id
                    ? 'bg-ignite text-pure shadow-sm'
                    : 'text-ink-3 hover:bg-module'
                  }`}
              >
                {t.label}
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full
                  ${activeTab === t.id ? 'bg-pure/20 text-pure' : 'bg-module text-ink-3'}`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
            <input
              type="text"
              placeholder="搜索设备/规则/Area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-progress rounded-xl bg-module
                text-ink placeholder:text-ink-4 focus:outline-none focus:border-ignite w-56"
            />
          </div>
        </div>
      </div>

      {/* Alarm Table */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-module text-xs text-ink-4 font-medium border-b border-progress">
          <div className="col-span-1">等级</div>
          <div className="col-span-1">设备</div>
          <div className="col-span-1">Area</div>
          <div className="col-span-3">告警规则</div>
          <div className="col-span-1">出现时间</div>
          <div className="col-span-1">持续</div>
          <div className="col-span-2">责任人</div>
          <div className="col-span-2 text-right">操作</div>
        </div>

        <div className="divide-y divide-progress/60">
          {filtered.map((alarm: any) => (
            <div
              key={alarm.id}
              className={`grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-module/50 transition-all
                ${alarm.status === 'closed' ? 'opacity-50' : ''}`}
            >
              <div className="col-span-1">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full
                  ${alarm.level === 'red' ? 'bg-danger/10 text-danger' : 'bg-warn/10 text-warn'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${alarm.level === 'red' ? 'bg-danger animate-pulse-dot' : 'bg-warn'}`} />
                  {alarm.level === 'red' ? '红灯' : '黄灯'}
                </span>
              </div>

              <div className="col-span-1">
                <span className="font-mono font-semibold text-sm text-ink">{alarm.equipment}</span>
              </div>

              <div className="col-span-1 text-sm text-ink-3">{alarm.area}</div>

              <div className="col-span-3">
                <span className="text-sm text-ink">{alarm.rule}</span>
              </div>

              <div className="col-span-1">
                <div className="flex items-center gap-1 text-xs text-ink-3">
                  <Clock size={11} />
                  {alarm.since}
                </div>
              </div>

              <div className="col-span-1">
                <span className={`font-mono text-sm ${alarm.status !== 'closed' ? 'text-danger font-semibold' : 'text-ink-3'}`}>
                  {alarm.duration}
                </span>
              </div>

              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-ink/10 flex items-center justify-center">
                    <User size={12} className="text-ink-3" />
                  </div>
                  <span className="text-sm text-ink">{alarm.owner}</span>
                </div>
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2">
                {alarm.status !== 'closed' && (
                  <>
                    {alarm.status === 'active' && (
                      <button
                        onClick={() => acknowledgeAlarm(alarm.id)}
                        className="text-xs px-3 py-1.5 border border-progress rounded-lg text-ink-3
                          hover:border-ignite hover:text-ignite transition-colors"
                      >
                        确认
                      </button>
                    )}
                    <button
                      onClick={() => closeAlarm(alarm.id, 'Portal 告警页面关闭')}
                      className="text-xs px-3 py-1.5 bg-success/10 text-success border border-success/20
                        rounded-lg hover:bg-success/20 transition-colors"
                    >
                      关闭
                    </button>
                  </>
                )}
                {alarm.status === 'closed' && (
                  <span className="text-xs text-success flex items-center gap-1">
                    <CheckCircle size={12} /> 已关闭
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-ink-3 text-sm">暂无告警记录</div>
        )}
      </div>
    </div>
  )
}
