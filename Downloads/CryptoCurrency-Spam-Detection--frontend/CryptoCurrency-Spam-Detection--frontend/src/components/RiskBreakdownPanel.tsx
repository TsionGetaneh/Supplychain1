import { ChevronDown, RefreshCcw, ShieldAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { RiskFactor } from '../types/api'

type Props = {
  factors: RiskFactor[]
  onSelectFactor: (factor: RiskFactor) => void
  onRecalculate: () => void
  loading?: boolean
}

function sevPill(severity: RiskFactor['severity']) {
  if (severity === 'High') return 'border-rose-400/20 bg-rose-500/10 text-rose-200'
  if (severity === 'Medium') return 'border-amber-400/20 bg-amber-500/10 text-amber-200'
  return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
}

export function RiskBreakdownPanel({ factors, onSelectFactor, onRecalculate, loading }: Props) {
  const [open, setOpen] = useState(false)

  const hasFactors = factors.length > 0
  const summary = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0 } as Record<RiskFactor['severity'], number>
    for (const f of factors) counts[f.severity] = (counts[f.severity] ?? 0) + 1
    return counts
  }, [factors])

  return (
    <div className="glass w-full overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 border-b border-white/10 p-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2">
            <ShieldAlert className="h-5 w-5 text-violet-300" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-100">Risk breakdown</div>
            <div className="mt-1 text-xs text-gray-400">
              {hasFactors
                ? `${summary.High} high • ${summary.Medium} medium • ${summary.Low} low`
                : 'No factors returned yet'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={(e) => {
              e.stopPropagation()
              onRecalculate()
            }}
            disabled={loading}
          >
            <RefreshCcw className={['h-4 w-4', loading ? 'animate-spin' : ''].join(' ')} />
            Recalculate Risk
          </button>
          <ChevronDown className={['h-4 w-4 text-gray-400 transition', open ? 'rotate-180' : ''].join(' ')} />
        </div>
      </button>

      {open ? (
        <div className="p-4">
          {factors.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-gray-400">
              Nothing to show yet. This panel will populate from `GET /api/v1/address/{'{address}'}/risk`.
            </div>
          ) : (
            <div className="grid gap-3">
              {factors.map((f, idx) => (
                <button
                  key={f.id ?? `${f.title}-${idx}`}
                  type="button"
                  className="glass glass-hover flex w-full items-start justify-between gap-4 p-4 text-left"
                  onClick={() => onSelectFactor(f)}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-gray-100">{f.title}</div>
                    <div className="mt-1 text-xs text-gray-400">
                      {f.description ?? 'Click to filter transactions'}
                    </div>
                  </div>
                  <div className={`shrink-0 rounded-full border px-3 py-1 text-xs ${sevPill(f.severity)}`}>
                    {f.severity}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

