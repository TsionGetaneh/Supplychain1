import type { AlertItem } from '../types/api'

export type AlertsSocketOptions = {
  url: string
  onAlert: (a: AlertItem) => void
  onStatus?: (s: 'connecting' | 'open' | 'closed' | 'error') => void
}

// API-ready websocket listener (expects JSON AlertItem messages)
export function connectAlertsSocket(opts: AlertsSocketOptions) {
  const ws = new WebSocket(opts.url)
  opts.onStatus?.('connecting')

  ws.addEventListener('open', () => opts.onStatus?.('open'))
  ws.addEventListener('close', () => opts.onStatus?.('closed'))
  ws.addEventListener('error', () => opts.onStatus?.('error'))
  ws.addEventListener('message', (ev) => {
    try {
      const data = JSON.parse(String(ev.data)) as AlertItem
      if (data && typeof data.id === 'string') opts.onAlert(data)
    } catch {
      // ignore malformed messages
    }
  })

  return () => ws.close()
}

