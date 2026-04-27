import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchOrganizationKeys } from '../lib/endpoints'
import { Skeleton } from '../components/Skeleton'
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { KeyRound, Plus, TriangleAlert } from 'lucide-react'

export function OrganizationPage() {
  const q = useQuery({
    queryKey: ['org-keys'],
    queryFn: fetchOrganizationKeys,
  })

  const data = (q.data ?? {}) as any
  const keys = Array.isArray(data?.keys) ? data.keys : []
  const usage = Array.isArray(data?.usage) ? data.usage : []

  const chart = useMemo(
    () =>
      usage.map((u: any) => ({
        day: u.day ?? '',
        calls: u.calls ?? 0,
      })),
    [usage],
  )

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-2xl font-semibold text-gray-100">Organization</div>
          <div className="mt-1 text-sm text-gray-400">API keys, permissions, usage analytics, and webhooks.</div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-100">
                  <KeyRound className="h-4 w-4 text-violet-300" />
                  API keys
                </div>
                <div className="mt-1 text-xs text-gray-400">Read/Write/Admin + expiration.</div>
              </div>
              <button type="button" className="btn-primary">
                <Plus className="h-4 w-4" />
                Create key
              </button>
            </div>

            <div className="mt-4 w-full overflow-x-auto">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Permissions</th>
                    <th className="px-4 py-3">Expires</th>
                    <th className="px-4 py-3">Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {q.isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 4 }).map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-28" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : keys.length === 0 ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-sm text-gray-400" colSpan={4}>
                        No keys returned.
                      </td>
                    </tr>
                  ) : (
                    keys.map((k: any) => (
                      <tr key={k.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-gray-100">{k.name ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-300">{k.permissions ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-300">{k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-gray-200">
                            {k.tier ?? '—'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass p-4">
            <div className="text-sm font-semibold text-gray-100">Usage analytics</div>
            <div className="mt-1 text-xs text-gray-400">API calls per day + rate limit warnings.</div>
            <div className="mt-3 h-56">
              {q.isLoading ? (
                <Skeleton className="h-full w-full rounded-2xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart}>
                    <defs>
                      <linearGradient id="calls" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(124, 58, 237)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="rgb(124, 58, 237)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: 'rgba(229,231,235,0.6)', fontSize: 12 }} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(229,231,235,0.6)', fontSize: 12 }} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(0,0,0,0.85)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 12,
                      }}
                    />
                    <Area type="monotone" dataKey="calls" stroke="rgb(124, 58, 237)" fill="url(#calls)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {(data?.rateLimitWarning ?? null) ? (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                <div className="flex items-center gap-2 font-semibold">
                  <TriangleAlert className="h-4 w-4" />
                  Rate limit warning
                </div>
                <div className="mt-1 text-xs text-amber-200/70">{String(data.rateLimitWarning)}</div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="glass p-4">
          <div className="text-sm font-semibold text-gray-100">Webhooks</div>
          <div className="mt-1 text-xs text-gray-400">Configure event delivery and secrets.</div>
          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input className="input" placeholder="Webhook URL" />
            <button type="button" className="btn-primary">Test webhook</button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-200">
              <span>address.update</span>
              <input type="checkbox" className="h-4 w-4 accent-violet-500" defaultChecked />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-200">
              <span>alert.triggered</span>
              <input type="checkbox" className="h-4 w-4 accent-violet-500" defaultChecked />
            </label>
          </div>
          <div className="mt-3 grid gap-2">
            <label className="text-xs font-medium text-gray-400">Secret key</label>
            <input className="input" placeholder="••••••••" />
          </div>
        </div>
      </div>
    </div>
  )
}

