export default function MdmAccessMatrix() {
  return (
    <div className="px-8 py-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">访问矩阵</h1>
        <p className="text-[13px] text-ink-3 mt-1">角色 × 系统 访问控制</p>
      </div>
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-8 text-center">
        <div className="text-[14px] font-medium text-ink-2 mb-1">访问矩阵配置</div>
        <div className="text-[12px] text-ink-3">功能在 Sprint 2 实现，当前为占位页面</div>
      </div>
      <footer className="py-4 border-t border-progress text-[11.5px] text-ink-3 flex items-center justify-between">
        <div>MRDI · MDM · 主数据管理子系统 v2.2</div>
        <div className="flex items-center gap-4"><span>Build 2026.07.15</span></div>
      </footer>
    </div>
  )
}
