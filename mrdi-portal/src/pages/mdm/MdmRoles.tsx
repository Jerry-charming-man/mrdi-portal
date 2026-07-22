import { useState } from 'react'
import type { MdmRole } from '../../types/mdm'

const roles = [
  { code: 'mdm-admin' as MdmRole, name: 'mdm-admin', desc: 'MDM 系统管理员', users: 3, permissions: ['user:read', 'user:write', 'user:delete', 'role:assign', 'audit:read', 'perm:query', 'resource:read', 'resource:write'] },
  { code: 'mdm-editor' as MdmRole, name: 'mdm-editor', desc: '读写用户/资源', users: 16, permissions: ['user:read', 'user:write', 'perm:query', 'resource:read', 'resource:write'] },
  { code: 'mdm-viewer' as MdmRole, name: 'mdm-viewer', desc: '只读', users: 1008, permissions: ['user:read', 'perm:query', 'resource:read'] },
  { code: 'mdm-auditor' as MdmRole, name: 'mdm-auditor', desc: '审计', users: 3, permissions: ['user:read', 'audit:read', 'perm:query'] },
]

const permissions = [
  { name: 'user:read', label: '查看用户', admin: true, editor: true, viewer: true, auditor: true },
  { name: 'user:write', label: '修改用户', admin: true, editor: true, viewer: false, auditor: false },
  { name: 'user:delete', label: '删除用户', admin: true, editor: false, viewer: false, auditor: false },
  { name: 'role:assign', label: '赋予角色', admin: true, editor: false, viewer: false, auditor: false },
  { name: 'audit:read', label: '审计日志', admin: true, editor: false, viewer: false, auditor: true },
  { name: 'resource:read', label: '读资源', admin: true, editor: true, viewer: true, auditor: false },
  { name: 'resource:write', label: '写资源', admin: true, editor: true, viewer: false, auditor: false },
  { name: 'perm:query', label: '权限查询', admin: true, editor: true, viewer: true, auditor: true },
]

const ROLE_COLORS: Record<MdmRole, { bg: string; text: string }> = {
  'mdm-admin': { bg: 'bg-ink text-pure', text: 'text-pure' },
  'mdm-editor': { bg: 'bg-ignite/10 text-ignite-2', text: 'text-ignite' },
  'mdm-viewer': { bg: 'bg-module text-ink-3', text: 'text-ink-3' },
  'mdm-auditor': { bg: 'bg-research/10 text-research', text: 'text-research' },
}

export default function MdmRoles() {
  const [activeTab, setActiveTab] = useState<'roles' | 'matrix'>('roles')
  return (
    <div className="px-8 py-6 space-y-5">

      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">角色 & 权限</h1>
        <p className="text-[13px] text-ink-3 mt-1">全局角色定义 + 权限矩阵</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-progress">
        {(['roles', 'matrix'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-[13.5px] font-medium border-b-2 transition-all ${activeTab === tab ? 'text-ignite border-ignite' : 'text-ink-3 border-transparent hover:text-ink'}`}
          >
            {tab === 'roles' ? '角色定义' : '权限矩阵'}
          </button>
        ))}
      </div>

      {activeTab === 'roles' && (
        <div className="grid grid-cols-2 gap-5">
          {roles.map((role) => (
            <div key={role.code} className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-1 rounded-lg text-[12.5px] font-semibold ${ROLE_COLORS[role.code].bg} ${ROLE_COLORS[role.code].text}`}>
                      {role.name}
                    </span>
                  </div>
                  <div className="text-[11.5px] text-ink-3 mt-1">{role.desc}</div>
                </div>
                <div className="text-right">
                  <div className="text-[22px] font-semibold font-mono text-ink">{role.users.toLocaleString()}</div>
                  <div className="text-[11px] text-ink-3">人</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map((p) => (
                  <span key={p} className="px-2 py-0.5 bg-module rounded text-[10.5px] font-mono text-ink-3">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'matrix' && (
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-module text-ink-3 text-[11.5px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left font-medium">权限</th>
                <th className="px-4 py-3 text-center font-medium w-24">admin</th>
                <th className="px-4 py-3 text-center font-medium w-24">editor</th>
                <th className="px-4 py-3 text-center font-medium w-24">viewer</th>
                <th className="px-4 py-3 text-center font-medium w-24">auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-progress">
              {permissions.map((p) => (
                <tr key={p.name} className="row-hover">
                  <td className="px-4 py-3">
                    <div className="font-mono text-[12.5px] text-ink">{p.name}</div>
                    <div className="text-[11px] text-ink-3">{p.label}</div>
                  </td>
                  {[p.admin, p.editor, p.viewer, p.auditor].map((val, i) => (
                    <td key={i} className="px-4 py-3 text-center">
                      {val
                        ? <span className="text-ignite font-bold text-lg">✓</span>
                        : <span className="text-ink-4 text-lg">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <footer className="py-4 border-t border-progress text-[11.5px] text-ink-3 flex items-center justify-between">
        <div>MRDI · MDM · 主数据管理子系统 v2.2</div>
        <div className="flex items-center gap-4"><span>Build 2026.07.15</span></div>
      </footer>
    </div>
  )
}
