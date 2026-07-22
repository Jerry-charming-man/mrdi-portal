import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getRequests } from '../../services/permApi'
import { PERM_STATUS, PERM_TYPE, PERM_LEVEL } from '../../types/cimperm'
import type { PermissionStatus, PermissionType } from '../../types/cimperm'

const VIEWS = ['全部', '我的', '待 IT 审', '待 Owner 核', '即将过期'] as const
type View = typeof VIEWS[number]

type PermRequestParams = NonNullable<Parameters<typeof getRequests>[0]>

const VIEW_MAP: Record<View, PermRequestParams['view']> = {
  '全部': 'all',
  '我的': 'mine',
  '待 IT 审': 'it_review',
  '待 Owner 核': 'owner_review',
  '即将过期': 'expiring',
}

const PAGE_SIZE = 8

export default function PermList() {
  const navigate = useNavigate()
  const [view, setView] = useState<View>('全部')
  const [typeFilter, setTypeFilter] = useState<PermissionType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<PermissionStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['perm', 'requests', VIEW_MAP[view], typeFilter, statusFilter, search, page],
    queryFn: () => getRequests({
      view: VIEW_MAP[view],
      type: typeFilter !== 'all' ? typeFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: search || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
  })

  let filtered = data?.data ?? []

  const grantedCount = filtered.filter(r => r.status === 'granted' || r.status === 'expiring_soon').length
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Status counts for tabs
  const { data: allData } = useQuery({
    queryKey: ['perm', 'requests', 'all'],
    queryFn: () => getRequests({ view: 'all', pageSize: 1 }),
    enabled: view === '全部',
  })
  const { data: mineData } = useQuery({
    queryKey: ['perm', 'requests', 'mine'],
    queryFn: () => getRequests({ view: 'mine', pageSize: 1 }),
  })
  const { data: itData } = useQuery({
    queryKey: ['perm', 'requests', 'it_review'],
    queryFn: () => getRequests({ view: 'it_review', pageSize: 1 }),
  })
  const { data: ownerData } = useQuery({
    queryKey: ['perm', 'requests', 'owner_review'],
    queryFn: () => getRequests({ view: 'owner_review', pageSize: 1 }),
  })
  const { data: expiringData } = useQuery({
    queryKey: ['perm', 'requests', 'expiring'],
    queryFn: () => getRequests({ view: 'expiring', pageSize: 1 }),
  })

  const counts: Record<View, number> = {
    '全部': allData?.total ?? total,
    '我的': mineData?.total ?? 0,
    '待 IT 审': itData?.total ?? 0,
    '待 Owner 核': ownerData?.total ?? 0,
    '即将过期': expiringData?.total ?? 0,
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight text-ink">申请列表</h2>
          <p className="text-[13px] text-ink-3 mt-1">
            {isLoading ? '加载中...' : `共 ${total} 项申请 · ${grantedCount} 项已授予（生效中）`}
          </p>
        </div>
        <Link
          to="/perm/perm/new"
          className="px-4 py-2 bg-research text-pure text-[13px] font-medium rounded-lg hover:bg-research/90 flex items-center gap-1.5 shadow-card transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          提交新申请
        </Link>
      </div>

      {/* View tabs */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 p-4">
        <div className="flex items-center gap-2 mb-3">
          {VIEWS.map(v => {
            const isActive = view === v
            return (
              <button
                key={v}
                onClick={() => { setView(v); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all ${
                  isActive
                    ? 'bg-ink text-pure'
                    : 'hover:bg-module text-ink-2'
                }`}
              >
                {v} ({counts[v]})
              </button>
            )
          })}
        </div>

        {/* Search + filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="搜申请编号 / 资源对象 / 申请人..."
              className="w-full pl-10 pr-3 py-2 bg-module rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-research/30"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value as PermissionType | 'all'); setPage(1) }}
            className="px-3 py-2 bg-module rounded-lg text-[13px]"
          >
            <option value="all">所有类型</option>
            {Object.entries(PERM_TYPE).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as PermissionStatus | 'all'); setPage(1) }}
            className="px-3 py-2 bg-module rounded-lg text-[13px]"
          >
            <option value="all">所有状态</option>
            {Object.entries(PERM_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-pure rounded-2xl shadow-card border border-progress/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-module text-ink-3 text-[11.5px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left font-medium">编号</th>
                <th className="px-3 py-3 text-left font-medium">目标</th>
                <th className="px-3 py-3 text-center font-medium">类型</th>
                <th className="px-3 py-3 text-center font-medium">级别</th>
                <th className="px-3 py-3 text-left font-medium">申请人</th>
                <th className="px-3 py-3 text-left font-medium">有效期</th>
                <th className="px-3 py-3 text-left font-medium">状态</th>
                <th className="px-3 py-3 text-left font-medium">更新</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-progress">
              {isLoading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[13px] text-ink-3">加载中...</td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[13px] text-danger">数据加载失败，请稍后重试</td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && !isError && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[13px] text-ink-3">暂无申请</td>
                </tr>
              )}
              {!isLoading && filtered.map(r => {
                const sc = PERM_STATUS[r.status]
                const tc = PERM_TYPE[r.permissionType]
                const lc = PERM_LEVEL[r.permissionLevel]
                const diffMs = Date.now() - new Date(r.updatedAt).getTime()
                const diffH = diffMs / 3600000
                const timeAgo = diffH < 1 ? `${Math.round(diffH * 60)}min` : diffH < 24 ? `${Math.round(diffH)}h` : `${Math.round(diffH / 24)}d`
                return (
                  <tr key={r.id} className="row-hover cursor-pointer"
                    onClick={() => navigate(`/perm/perm/${r.id}`)}>
                    <td className="px-5 py-3 font-mono text-ink-2">{r.requestNo}</td>
                    <td className="px-3 py-3 text-ink font-medium">
                      {r.targetSystem} <span className="text-ink-3">/</span>{' '}
                      <span className="font-mono text-[12px] text-ink-3">{r.resourceId.split(':').pop()}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${tc.bg} ${tc.text}`}>{tc.label}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${lc.bg} ${lc.text}`}>{lc.label}</span>
                    </td>
                    <td className="px-3 py-3 text-ink-2">{r.applicantName}</td>
                    <td className="px-3 py-3 text-ink-2 font-mono text-[12px]">{r.requestedDuration}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${sc.bg} ${sc.text} ${sc.pulse ? 'sla-pulse' : ''}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-ink-3 font-mono text-[12px]">{timeAgo}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-ink-3">第 {page} / {totalPages} 页，共 {total} 条</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 bg-pure border border-progress rounded-lg text-[12px] disabled:opacity-40 hover:bg-module transition-colors">
              上一页
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 bg-pure border border-progress rounded-lg text-[12px] disabled:opacity-40 hover:bg-module transition-colors">
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
