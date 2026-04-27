export type Chain = 'EVM'

export function detectChain(address: string): Chain | null {
  const a = address.trim()
  if (isValidEvmAddress(a)) return 'EVM'
  return null
}

export function isValidEvmAddress(address: string): boolean {
  const a = address.trim()
  return a.startsWith('0x') && a.length === 42
}

export const isValidEthAddress = isValidEvmAddress

export function shortenAddress(address: string, head = 6, tail = 4): string {
  const a = address.trim()
  if (a.length <= head + tail + 3) return a
  return `${a.slice(0, head)}...${a.slice(-tail)}`
}

