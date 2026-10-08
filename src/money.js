export function formatInstitutionalMoney(amount) {
  const numericValue = Number.isFinite(amount) ? amount : 0
  const absoluteValue = Math.abs(numericValue)
  const sign = numericValue < 0 ? '−' : ''
  if (absoluteValue >= 10000000) return `${sign}₹${(absoluteValue / 10000000).toFixed(2)} Cr`
  if (absoluteValue >= 100000) return `${sign}₹${(absoluteValue / 100000).toFixed(2)} L`
  if (absoluteValue >= 1000) return `${sign}₹${(absoluteValue / 1000).toFixed(2)} K`
  return `${sign}₹${Math.round(absoluteValue).toLocaleString('en-IN')}`
}
