import { useState } from 'react'
import type { RegisteredSystem } from '../../types/mdm'

const systems: RegisteredSystem[] = [
  { id: 'cimrms', name: 'CIM-RMS', description: 'Normal Change 需求管理', apiBase: '/cimrms-api', version: 'v1.0.0', activeUsers: 86, weeklyChange: 5, status: 'healthy' },
  { id: 'cimims', name: 'CIM-IMS', description: '报案 / 工单管理', apiBase: '/cimims-api', version: 'v0.9.2', activeUsers: 64, weeklyChange: 0, status: 'partial' },
  { id: 'mrdi-portal', name: 'MRDI Portal', description: '统一入口', apiBase: '/portal-api', version: 'v2.3.0', activeUsers: 1028, weeklyChange: 0, status: 'healthy' },
]

export default function MdmSystems() {
  const [regs] = useState(systems)

  return (
    <div className="px-8 py-6 space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">系统注册</h1>
          <p className="text-[13px] text-ink-3 mt-1">已注册系统 · API Key 管理</p>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg: '注册系统功能在 Sprint 2 上线', type: 'info' } }))}
          className="px-4 py-2 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2 flex items-center gap-1.5 shadow-card"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          注册新系统
        </button>
      </div>

      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-module text-ink-3 text-[11.5px] uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5 text-left font-medium">系统</th>
              <th className="px-5 py-3.5 text-left font-medium">描述</th>
              <th className="px-5 py-3.5 text-left font-medium">API Base</th>
              <th className="px-5 py-3.5 text-center font-medium">活跃用户</th>
              <th className="px-5 py-3.5 text-center font-medium">状态</th>
              <th className="px-5 py-3.5 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-progress">
            {regs.map((sys) => (
              <tr key={sys.id} className="row-hover">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-ignite/10 flex items-center justify-center text-[13px] font-bold text-ignite">
                      {sys.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-ink">{sys.name}</div>
                      <div className="text-[11px] text-ink-3 font-mono">v{sys.version}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-ink-3">{sys.description}</td>
                <td className="px-5 py-3.5 font-mono text-[12px] text-ink-2">{sys.apiBase}</td>
                <td className="px-5 py-3.5 text-center">
                  <div className="text-[18px] font-semibold font-mono text-ink">{sys.activeUsers.toLocaleString()}</div>
                  {sys.weeklyChange > 0 && <div className="text-[11px] text-success">↑ {sys.weeklyChange} 本周</div>}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${sys.status === 'healthy' ? 'bg-success pulse-dot' : 'bg-warn pulse-dot'}`}></span>
                    <span className={`text-[12px] ${sys.status === 'healthy' ? 'text-ink-3' : 'text-warn'}`}>
                      {sys.status === 'healthy' ? '健康' : '部分离线'}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg: `${sys.name} 配置（功能开发中）`, type: 'info' } }))}
                    className="text-ignite font-medium hover:underline text-[12.5px]"
                  >
                    配置
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="py-4 border-t border-progress text-[11.5px] text-ink-3 flex items-center justify-between">
        <div>MRDI · MDM · 主数据管理子系统 v2.2</div>
        <div className="flex items-center gap-4"><span>Build 2026.07.15</span></div>
      </footer>
    </div>
  )
}
