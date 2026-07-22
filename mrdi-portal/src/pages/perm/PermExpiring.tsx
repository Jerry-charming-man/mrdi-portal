import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MOCK_EXPIRING, PERM_TYPE } from '../../types/cimperm'

function getExpiryHours(expiresAt: string) {
  return Math.max(0, (new Date(expiresAt).getTime() - Date.now()) / 3600000)
}

function showToast(msg: string, type = 'info') {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, type } }))
}

export default function PermExpiring() {
  const [showRevokeId, setShowRevokeId] = useState<string | null>(null)
  const [showRenewId, setShowRenewId] = useState<string | null>(null)
  const [revokeReason, setRevokeReason] = useState('')

  // Bucket by hours per design
  const bucketLT8 = MOCK_EXPIRING.filter(r => getExpiryHours(r.expiresAt) < 8)
  const bucketLT16 = MOCK_EXPIRING.filter(r => {
    const h = getExpiryHours(r.expiresAt)
    return h >= 8 && h < 16
  })
  const bucketLT24 = MOCK_EXPIRING.filter(r => {
    const h = getExpiryHours(r.expiresAt)
    return h >= 16 && h < 24
  })

  function formatExpiry(hours: number) {
    if (hours < 1) return `${Math.round(hours * 60)}min`
    if (hours < 24) return `${Math.round(hours)}h`
    return `${Math.round(hours / 24)}d`
  }

  function getBorderColor(hours: number) {
    if (hours < 8) return 'border-l-danger'
    if (hours < 16) return 'border-l-warn'
    return 'border-l-ink-3'
  }

  function getBgColor(hours: number) {
    if (hours < 8) return 'bg-danger-soft/30'
    if (hours < 16) return 'bg-warn-soft/30'
    return 'bg-module/50'
  }

  function handleRenew(_id: string) {
    showToast('续期成功', 'success')
    setShowRenewId(null)
  }

  function handleRevoke(_id: string) {
    if (!revokeReason.trim()) return
    showToast('权限已撤销', 'success')
    setShowRevokeId(null)
    setRevokeReason('')
  }

  const DURATIONS: Record<string, string[]> = {
    'temporary': ['1h', '2h', '4h', '8h', '24h'],
    'data_export': ['1d', '7d', '14d', '30d'],
    'functional': ['7d', '14d', '30d', '60d', '90d'],
    'system_access': ['30d', '90d', '180d', '365d'],
    'batch': ['7d', '30d', '90d', '365d'],
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-[24px] font-semibold tracking-tight text-ink">即将过期</h2>
        <p className="text-[13px] text-ink-3 mt-1">24h 即将过期的权限 · 需续期或撤销</p>
      </div>

      {/* 3 KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '< 8h', count: bucketLT8.length, color: 'text-danger', bg: 'bg-danger-soft border-danger/30' },
          { label: '8–16h', count: bucketLT16.length, color: 'text-danger', bg: 'bg-danger-soft border-danger/30' },
          { label: '16–24h', count: bucketLT24.length, color: 'text-warn', bg: 'bg-warn-soft border-warn/30' },
        ].map(b => (
          <div key={b.label} className={`rounded-2xl border p-4 text-center ${b.bg}`}>
            <div className={`text-[11.5px] font-medium mb-1 ${b.color}`}>{b.label}</div>
            <div className={`text-[24px] font-semibold font-mono text-ink`}>{b.count}</div>
          </div>
        ))}
      </div>

      {/* Expiring list */}
      <div className="space-y-2">
        {MOCK_EXPIRING.map(r => {
          const hours = getExpiryHours(r.expiresAt)
          const typeCfg = PERM_TYPE[r.permissionType]
          const durations = DURATIONS[r.permissionType] || DURATIONS.functional

          return (
            <div key={r.id} className={`p-3 rounded-lg border-l-4 ${getBgColor(hours)} ${getBorderColor(hours)} flex items-center gap-3`}>
              {/* Time tag */}
              <span className="tag-red px-2 py-0.5 rounded text-[10px] font-bold min-w-[50px] text-center">
                🔴 {formatExpiry(hours)}
              </span>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-ink font-medium">{r.targetSystem} {r.resourceId.split(':').pop()}</div>
                <div className="text-[11px] text-ink-3 mt-0.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] mr-1 ${typeCfg.bg} ${typeCfg.text}`}>{typeCfg.label}</span>
                  <Link to={`/perm/perm/${r.id}`} className="font-mono text-[11px] hover:text-research transition-colors">{r.requestNo}</Link>
                  <span className="ml-2">{r.requestedDuration}</span>
                  <span className="ml-2">· {r.applicantName}</span>
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2">
                <button onClick={() => setShowRevokeId(r.id)} className="px-3 py-1.5 rounded-lg border border-progress text-[12px] hover:bg-pure transition-colors">
                  撤销
                </button>
                <div className="relative">
                  <button onClick={() => setShowRenewId(showRenewId === r.id ? null : r.id)} className="px-3 py-1.5 bg-research text-pure rounded-lg text-[12px] font-medium hover:bg-research/90 transition-colors">
                    续期
                  </button>
                  {showRenewId === r.id && (
                    <div className="absolute right-0 top-full mt-1 bg-pure border border-progress rounded-lg shadow-card p-2 z-10 w-[120px]">
                      {durations.map(d => (
                        <button key={d} onClick={() => handleRenew(r.id)} className="block w-full text-left px-3 py-1.5 text-[12px] hover:bg-module rounded transition-colors">
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Revoke confirm modal */}
      {showRevokeId && (
        <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50">
          <div className="bg-pure rounded-2xl p-6 w-[420px] shadow-xl border border-progress">
            <h3 className="text-[16px] font-bold text-danger mb-4">撤销权限</h3>
            <p className="text-[13px] text-ink-3 mb-4">确定撤销此权限？此操作不可逆。</p>
            <textarea
              rows={3}
              value={revokeReason}
              onChange={e => setRevokeReason(e.target.value)}
              placeholder="撤销原因（必填）..."
              className="w-full px-4 py-2.5 bg-module border border-progress rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-danger/30 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowRevokeId(null); setRevokeReason('') }} className="flex-1 py-2.5 border border-progress rounded-lg text-[13px] hover:bg-module transition-colors">
                取消
              </button>
              <button
                disabled={!revokeReason.trim()}
                onClick={() => handleRevoke(showRevokeId)}
                className="flex-1 py-2.5 bg-danger text-pure rounded-lg text-[13px] font-medium hover:bg-danger/90 disabled:opacity-50 transition-colors"
              >
                确认撤销
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
