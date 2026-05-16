export function formatNumber(value) {
  return Number(value || 0).toLocaleString()
}

export function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`
}

export function formatMoneyCompact(value) {
  const num = Number(value || 0)

  if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)}B`
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`
  return `$${num.toFixed(0)}`
}

export function formatPercent(value, decimals = 1) {
  return `${Number(value || 0).toFixed(decimals)}%`
}
