export default function MdmPermissionApi() {
  const apis = [
    { method: 'GET', path: '/health', desc: '健康检查' },
    { method: 'GET', path: '/users', desc: '用户列表' },
    { method: 'GET', path: '/users/by-email/:email', desc: '用户详情' },
    { method: 'GET', path: '/roles', desc: '角色列表' },
    { method: 'POST', path: '/users/by-email/:email/roles', desc: '赋予角色' },
    { method: 'POST', path: '/permissions/check', desc: '权限检查' },
    { method: 'POST', path: '/permissions/grant', desc: '授予资源权限' },
    { method: 'GET', path: '/todos/users/by-email/:email/todos', desc: '待办列表' },
    { method: 'GET', path: '/sync/logs', desc: '审计日志' },
  ]

  const METHOD_COLORS: Record<string, string> = {
    GET: 'method-get',
    POST: 'method-post',
    DELETE: 'method-del',
  }

  return (
    <div className="px-8 py-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">权限 API 文档</h1>
        <p className="text-[13px] text-ink-3 mt-1">Base URL: <span className="font-mono">http://localhost:3000/mdm-api/v1</span></p>
      </div>

      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
        <div className="code-block m-5">
          {apis.map((api, i) => (
            <div key={i} className="flex items-center gap-4 mb-2">
              <span className={`method-badge ${METHOD_COLORS[api.method] || 'method-get'}`}>{api.method}</span>
              <span className="text-pure font-mono flex-1">{api.path}</span>
              <span className="text-pure/50 text-[12px]">{api.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <footer className="py-4 border-t border-progress text-[11.5px] text-ink-3 flex items-center justify-between">
        <div>MRDI · MDM · 主数据管理子系统 v2.2</div>
        <div className="flex items-center gap-4"><span>Build 2026.07.15</span></div>
      </footer>
    </div>
  )
}
