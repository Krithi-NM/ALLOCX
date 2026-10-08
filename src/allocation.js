export const SCORE_WEIGHTS = {
  impact: 0.35,
  utilization: 0.25,
  urgency: 0.20,
  alignment: 0.20,
}

export const PROTECTED_FLOOR = 0.70

export function getScoreBreakdown(request, maxStudents) {
  const impact = maxStudents > 0 ? (request.studentsAffected / maxStudents) * 100 : 0
  const utilization = request.previousAllocation > 0
    ? Math.min((request.previousSpending / request.previousAllocation) * 100, 100)
    : 0
  const urgency = Math.max(0, Math.min(request.urgency, 5)) * 20
  const alignment = Math.max(0, Math.min(request.alignment, 100))
  const weighted = {
    impact: impact * SCORE_WEIGHTS.impact,
    utilization: utilization * SCORE_WEIGHTS.utilization,
    urgency: urgency * SCORE_WEIGHTS.urgency,
    alignment: alignment * SCORE_WEIGHTS.alignment,
  }
  return { impact, utilization, urgency, alignment, weighted, total: Object.values(weighted).reduce((sum, value) => sum + value, 0) }
}

function distributeWeighted(items, remainingBudget, allocations, scores) {
  let remaining = remainingBudget
  let eligible = items.filter((request) => request.requestedAmount - allocations.get(request.id) > 0)

  while (remaining > 0.001 && eligible.length > 0) {
    const weightTotal = eligible.reduce((sum, request) => sum + scores.get(request.id).total * request.requestedAmount, 0)
    if (weightTotal <= 0) break
    let distributed = 0
    const capped = new Set()

    for (const request of eligible) {
      const current = allocations.get(request.id)
      const capacity = request.requestedAmount - current
      const share = remaining * ((scores.get(request.id).total * request.requestedAmount) / weightTotal)
      const addition = Math.min(capacity, share)
      allocations.set(request.id, current + addition)
      distributed += addition
      if (addition >= capacity - 0.001) capped.add(request.id)
    }

    remaining = Math.max(0, remaining - distributed)
    eligible = eligible.filter((request) => !capped.has(request.id))
    if (distributed < 0.001) break
  }
  return remaining
}

export function allocateBudget(requests, budget) {
  const safeBudget = Math.max(0, Number.isFinite(budget) ? budget : 0)
  const maxStudents = requests.reduce((max, request) => Math.max(max, request.studentsAffected || 0), 0)
  const scores = new Map(requests.map((request) => [request.id, getScoreBreakdown(request, maxStudents)]))
  const allocations = new Map(requests.map((request) => [request.id, 0]))
  const critical = requests.filter((request) => request.critical)
  const totalFloor = critical.reduce((sum, request) => sum + request.requestedAmount * PROTECTED_FLOOR, 0)

  if (totalFloor > safeBudget && totalFloor > 0) {
    const scale = safeBudget / totalFloor
    critical.forEach((request) => allocations.set(request.id, request.requestedAmount * PROTECTED_FLOOR * scale))
  } else {
    critical.forEach((request) => allocations.set(request.id, request.requestedAmount * PROTECTED_FLOOR))
  }

  const protectedAmount = [...allocations.values()].reduce((sum, amount) => sum + amount, 0)
  const remaining = Math.max(0, safeBudget - protectedAmount)
  distributeWeighted(requests, remaining, allocations, scores)

  return requests.map((request) => {
    const recommendedAmount = Math.min(request.requestedAmount, allocations.get(request.id) || 0)
    const percentageFunded = request.requestedAmount > 0 ? (recommendedAmount / request.requestedAmount) * 100 : 0
    const score = scores.get(request.id)
    const reason = request.critical
      ? `Critical status secures a protected 70% floor. Remaining funds are distributed by its ${score.total.toFixed(1)} priority score and request size.`
      : `Recommended from a ${score.total.toFixed(1)} priority score using impact, past utilization, urgency and strategic alignment.`
    return { ...request, score, recommendedAmount, percentageFunded, reason }
  })
}

export function summarizeDepartments(allocations) {
  const totals = new Map()
  allocations.forEach((request) => {
    const department = totals.get(request.department) || { department: request.department, recommended: 0, requested: 0 }
    department.recommended += request.recommendedAmount
    department.requested += request.requestedAmount
    totals.set(request.department, department)
  })
  return [...totals.values()]
}

export function formatMoney(amount, compact = false) {
  const numericValue = Number.isFinite(amount) ? amount : 0
  const value = Math.abs(numericValue)
  const sign = numericValue < 0 ? '−' : ''
  if (compact && value >= 10000000) return `${sign}₹${(value / 10000000).toFixed(value % 10000000 === 0 ? 0 : 1)}Cr`
  if (compact && value >= 100000) return `${sign}₹${(value / 100000).toFixed(value % 100000 === 0 ? 0 : 1)}L`
  return `${sign}₹${Math.round(value).toLocaleString('en-IN')}`
}
