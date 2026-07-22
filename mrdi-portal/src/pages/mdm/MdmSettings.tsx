export default function MdmSettings() {
  const showToast = () => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg: '设置已保存（Mock）', type: 'success' } }))
  }

  return (
    <div className="px-8 py-6 space-y-5">

      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">系统设置</h1>
        <p className="text-[13px] text-ink-3 mt-1">M365 SSO 配置 + 系统信息</p>
      </div>

      <div className="grid grid-cols-12 gap-5">

        {/* SSO Config */}
        <div className="col-span-8 bg-pure rounded-2xl shadow-card border border-progress/60 p-6">
          <h3 className="text-[15px] font-semibold text-ink mb-4">M365 SSO 配置</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[12px] text-ink-3 mb-1 block">Tenant ID</label>
              <input defaultValue="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="w-full px-3 py-2 bg-module rounded-lg text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-ignite/30" />
            </div>
            <div>
              <label className="text-[12px] text-ink-3 mb-1 block">Client ID</label>
              <input defaultValue="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="w-full px-3 py-2 bg-module rounded-lg text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-ignite/30" />
            </div>
            <div>
              <label className="text-[12px] text-ink-3 mb-1 block">同步频率</label>
              <select className="w-full px-3 py-2 bg-module rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-ignite/30">
                <option>实时 Webhook（推荐）</option>
                <option>每 5 分钟</option>
                <option>每 30 分钟</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-[12px] text-ink-3 mb-2 block">Entra Group → MDM 角色映射</label>
            <div className="space-y-2">
              {[
                { group: 'MRDI-All-Employees', role: 'viewer' },
                { group: 'MRDI-Engineers', role: 'editor' },
                { group: 'MRDI-Admins', role: 'admin' },
              ].map((m) => (
                <div key={m.group} className="flex items-center gap-3 px-3 py-2 bg-module rounded-lg text-[13px]">
                  <span className="font-mono text-ink-2 flex-1">{m.group}</span>
                  <span className="text-ink-3">→</span>
                  <span className="px-2 py-0.5 bg-ignite/10 text-ignite rounded text-[11px] font-medium">{m.role}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg: '同步完成（Mock）', type: 'success' } }))} className="px-4 py-2 rounded-lg border border-progress text-[13px] hover:bg-module">立即同步</button>
            <button onClick={showToast} className="px-5 py-2 rounded-lg bg-ignite text-pure text-[13px] font-medium hover:bg-ignite-2">保存</button>
          </div>
        </div>

        {/* System info + danger zone */}
        <div className="col-span-4 space-y-5">
          <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
            <h3 className="text-[14px] font-semibold text-ink mb-3">系统信息</h3>
            <div className="space-y-2 text-[12.5px]">
              {[
                ['版本', 'v2.2.0'],
                ['数据库', 'PostgreSQL 16'],
                ['API 版本', 'v1'],
                ['部署环境', 'Azure East Asia'],
                ['最后同步', '2026-07-15 11:30'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-ink-3">{k}</span>
                  <span className="font-mono text-ink">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-pure rounded-2xl shadow-card border border-danger/20 p-5">
            <h3 className="text-[14px] font-semibold text-danger mb-3">危险操作</h3>
            <div className="space-y-2">
              {[
                { label: '导出全部数据', sub: '下载完整数据 JSON' },
                { label: '清空会话', sub: '强制所有用户登出' },
                { label: '重置 MDM', sub: '⚠ 清空所有数据，不可恢复' },
              ].map((d) => (
                <button
                  key={d.label}
                  onClick={() => window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg: `${d.label}（功能开发中）`, type: 'info' } }))}
                  className="w-full text-left px-3 py-2.5 rounded-lg bg-danger-soft border border-danger/20 hover:bg-danger/10 transition-colors"
                >
                  <div className="text-[12.5px] font-medium text-danger">{d.label}</div>
                  <div className="text-[11px] text-danger/70">{d.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="py-4 border-t border-progress text-[11.5px] text-ink-3 flex items-center justify-between">
        <div>MRDI · MDM · 主数据管理子系统 v2.2</div>
        <div className="flex items-center gap-4"><span>Build 2026.07.15</span></div>
      </footer>
    </div>
  )
}
