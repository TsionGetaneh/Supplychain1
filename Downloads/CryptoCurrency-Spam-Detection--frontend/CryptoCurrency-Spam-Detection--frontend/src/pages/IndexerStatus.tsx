import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCcw } from 'lucide-react'
import { fetchIndexerStatus } from '../lib/endpoints'
import { Skeleton } from '../components/Skeleton'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'

export function IndexerStatusPage() {
  const q = useQuery({
    queryKey: ['indexer-status'],
    queryFn: fetchIndexerStatus,
    refetchInterval: 10_000,
  })

  const status = (q.data ?? {}) as any
  const chains = Array.isArray(status?.chains) ? status.chains : []
  const perf = Array.isArray(status?.performance) ? status.performance : []

  const chartData = useMemo(() => {
    return perf.map((p: any) => ({
      t: p.ts ? new Date(p.ts).toLocaleTimeString() : '',
      blocksPerMin: p.blocksPerMinute ?? 0,
      latencyMs: p.avgLatencyMs ?? 0,
      queueDepth: p.queueDepth ?? 0,
    }))
  }, [perf])

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold text-gray-100">Indexer status</div>
            <div className="mt-1 text-sm text-gray-400">Sync, health, performance, and queue depth.</div>
          </div>
          <button type="button" className="btn-ghost" onClick={() => q.refetch()}>
            <RefreshCcw className={['h-4 w-4', q.isFetching ? 'animate-spin' : ''].join(' ')} />
            Refresh
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass p-4">
            <div className="text-sm font-semibold text-gray-100">Chain health</div>
            <div className="mt-3 grid gap-3">
              {q.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
              ) : chains.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-gray-400">
                  No chain status returned.
                </div>
              ) : (
                chains.map((c: any) => (
                  <div key={c.chain ?? c.id} className="glass glass-hover flex items-center justify-between gap-3 p-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-100">{c.chain}</div>
                      <div className="mt-1 text-xs text-gray-400">
                        Current: {c.currentBlock ?? '—'} • Indexed: {c.lastIndexedBlock ?? '—'} • Behind: {c.behind ?? '—'}
                      </div>
                    </div>
                    <span
                      className={[
                        'rounded-full border px-3 py-1 text-xs',
                        c.healthy ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : 'border-rose-400/20 bg-rose-500/10 text-rose-200',
                      ].join(' ')}
                    >
                      {c.healthy ? 'Healthy' : 'Degraded'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass p-4">
            <div className="text-sm font-semibold text-gray-100">Performance</div>
            <div className="mt-3 h-56">
              {q.isLoading ? (
                <Skeleton className="h-full w-full rounded-2xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="t" tick={{ fill: 'rgba(229,231,235,0.6)', fontSize: 12 }} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(229,231,235,0.6)', fontSize: 12 }} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(0,0,0,0.85)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 12,
                      }}
                    />
                    <Line type="monotone" dataKey="blocksPerMin" stroke="#34d399" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="queueDepth" stroke="#fbbf24" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="latencyMs" stroke="#fb7185" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="glass p-4">
          <div className="text-sm font-semibold text-gray-100">Manual reindex</div>
          <div className="mt-1 text-xs text-gray-400">UI is ready; wire backend to accept commands.</div>
          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input className="input" placeholder="Address (0x…)" />
            <input className="input" placeholder="Block range (e.g. 19000000-19010000)" />
            <button type="button" className="btn-primary">
              Reindex
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

