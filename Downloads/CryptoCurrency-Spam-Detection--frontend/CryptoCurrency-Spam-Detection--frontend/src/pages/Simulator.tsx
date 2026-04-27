import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Play, Wallet } from 'lucide-react'
import { simulateTransaction } from '../lib/endpoints'

type Form = {
  txHash?: string
  contract?: string
  scenario?: string
}

export function SimulatorPage() {
  const { register, handleSubmit } = useForm<Form>()
  const [history, setHistory] = useState<any[]>([])

  const mutation = useMutation({
    mutationFn: (payload: unknown) => simulateTransaction(payload),
    onSuccess: (data) => {
      toast.success('Simulation complete')
      setHistory((prev) => [{ at: new Date().toISOString(), data }, ...prev].slice(0, 20))
    },
    onError: () => toast.error('Simulation failed'),
  })

  const onSubmit = handleSubmit((f) => {
    if (!f.txHash && !f.contract) {
      toast.error('Paste a tx hash or contract address')
      return
    }
    mutation.mutate({ txHash: f.txHash, contract: f.contract, scenario: f.scenario })
  })

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-2xl font-semibold text-gray-100">DApp interaction simulator</div>
          <div className="mt-1 text-sm text-gray-400">
            Simulate before sending, estimate gas/approvals, and warn on malicious contracts.
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass p-4">
            <form className="grid gap-3" onSubmit={onSubmit}>
              <input className="input" placeholder="Transaction hash (optional)" {...register('txHash')} />
              <input className="input" placeholder="Contract address (optional)" {...register('contract')} />
              <textarea className="input h-28 resize-none py-3" placeholder="What would happen if… (optional)" {...register('scenario')} />
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="btn-primary" disabled={mutation.isPending}>
                  <Play className="h-4 w-4" />
                  {mutation.isPending ? 'Simulating…' : 'Simulate'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => toast('WalletConnect can be wired here.')}>
                  <Wallet className="h-4 w-4" />
                  Connect wallet
                </button>
              </div>
            </form>
          </div>

          <div className="glass p-4">
            <div className="text-sm font-semibold text-gray-100">Result</div>
            <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-gray-300">
              {mutation.isPending
                ? 'Running simulation…'
                : mutation.data
                  ? JSON.stringify(mutation.data, null, 2)
                  : 'No result yet.'}
            </div>
          </div>
        </div>

        <div className="glass p-4">
          <div className="text-sm font-semibold text-gray-100">History</div>
          <div className="mt-3 grid gap-2">
            {history.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-gray-400">
                No simulations yet.
              </div>
            ) : (
              history.map((h, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="text-xs text-gray-500">{new Date(h.at).toLocaleString()}</div>
                  <pre className="mt-2 max-h-40 overflow-auto text-xs text-gray-300">
{JSON.stringify(h.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

