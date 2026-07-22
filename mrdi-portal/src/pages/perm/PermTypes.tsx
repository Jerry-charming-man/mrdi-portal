import { Link } from 'react-router-dom'
import { PERM_TYPE } from '../../types/cimperm'

// Icons per design spec (unique per type)
const TYPE_ICONS: Record<string, { path: string; color: string }> = {
  system_access: {
    path: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1',
    color: '#307FE2',
  },
  functional: {
    path: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    color: '#00B388',
  },
  data_export: {
    path: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
    color: '#EF60A3',
  },
  temporary: {
    path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    color: '#B45309',
  },
  batch: {
    path: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    color: '#6A6DCD',
  },
}

export default function PermTypes() {
  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-[24px] font-semibold tracking-tight text-ink">权限类型</h2>
        <p className="text-[13px] text-ink-3 mt-1">5 类权限类型说明及有效期配置 · admin 可配置</p>
      </div>

      {/* 3-column grid — per design */}
      <div className="grid grid-cols-3 gap-5">
        {Object.entries(PERM_TYPE).map(([k, v]) => {
          const icon = TYPE_ICONS[k]
          return (
            <div key={k} className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5 hover:shadow-card-hover transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${icon.color}15` }}>
                  <svg width="20" height="20" fill="none" stroke={icon.color} strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
                  </svg>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10.5px] font-medium ${v.bg} ${v.text}`}>{v.label}</span>
              </div>
              <h3 className="text-[14px] font-semibold text-ink mb-1">{v.label}</h3>
              <p className="text-[11.5px] text-ink-3 leading-relaxed mb-3">{v.desc}</p>
              <div className="text-[11px] text-ink-3 space-y-1 pt-3 border-t border-progress">
                <div className="flex justify-between">
                  <span>默认</span>
                  <span className="font-mono text-ink-2">{v.defaultDuration}</span>
                </div>
                <div className="flex justify-between">
                  <span>范围</span>
                  <span className="font-mono text-ink-2">{v.min} ~ {v.max}</span>
                </div>
              </div>
            </div>
          )
        })}

        {/* Empty 6th card — per design */}
        <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5 flex items-center justify-center">
          <div className="text-center text-ink-3">
            <svg className="w-12 h-12 mx-auto mb-3 text-ink-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <div className="text-[12.5px]">自定义权限类型</div>
            <div className="text-[11px] text-ink-4 mt-1">admin 配置</div>
          </div>
        </div>
      </div>

      {/* Admin config hint */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-5">
        <h3 className="text-[14px] font-semibold text-ink mb-2">Admin 配置入口</h3>
        <p className="text-[13px] text-ink-3 mb-3">如需修改权限类型的默认有效期、范围或启用状态，请前往</p>
        <Link to="/perm/settings" className="text-[13px] text-research hover:underline">
          设置 → 权限类型配置 →
        </Link>
      </div>
    </div>
  )
}
