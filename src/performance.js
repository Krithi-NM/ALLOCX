import { formatInstitutionalMoney } from './money.js'

export function calculateVariance(planned, actual) {
  const safePlanned = Number.isFinite(planned) ? planned : 0
  const safeActual = Number.isFinite(actual) ? actual : 0
  const variance = safeActual - safePlanned
  const variancePercent = safePlanned > 0 ? (variance / safePlanned) * 100 : null
  const status = variance > 0 ? 'Overspent' : variancePercent !== null && variancePercent <= -10 ? 'Under plan' : 'On track'

  return { variance, variancePercent, status }
}

export function buildPerformanceRows(requests) {
  return requests.map((request) => {
    const planned = Number.isFinite(request.previousAllocation) ? request.previousAllocation : 0
    const actual = Number.isFinite(request.previousSpending) ? request.previousSpending : 0
    const { variance, variancePercent, status } = calculateVariance(planned, actual)
    return {
      id: request.id,
      project: request.project,
      department: request.department,
      allocated: planned,
      planned,
      actual,
      remaining: planned - actual,
      variance,
      variancePercent,
      status,
      utilization: planned > 0 ? (actual / planned) * 100 : 0,
    }
  })
}

export function summarizePerformance(rows) {
  return rows.reduce((summary, row) => ({
    planned: summary.planned + row.planned,
    actual: summary.actual + row.actual,
    remaining: summary.remaining + row.remaining,
    variance: summary.variance + row.variance,
  }), { planned: 0, actual: 0, remaining: 0, variance: 0 })
}

export function summarizePerformanceByDepartment(rows) {
  const departments = new Map()
  rows.forEach((row) => {
    const department = departments.get(row.department) || {
      department: row.department,
      planned: 0,
      actual: 0,
      remaining: 0,
      variance: 0,
    }
    department.planned += row.planned
    department.actual += row.actual
    department.remaining += row.remaining
    department.variance += row.variance
    departments.set(row.department, department)
  })
  return [...departments.values()]
}

export function buildPerformanceInsights(rows) {
  const departments = summarizePerformanceByDepartment(rows)
  const insights = departments
    .filter((department) => department.planned > 0 && department.actual / department.planned < 0.65)
    .map((department) => ({
      type: 'Underutilization',
      subject: department.department,
      amount: department.remaining,
      message: `${department.department} used ${Math.round((department.actual / department.planned) * 100)}% of its prior-year allocation.`,
      action: 'Review delivery constraints and phase next-year funding against achievable milestones.',
      confidence: 'historical',
    }))

  rows.filter((row) => row.planned > 0 && row.utilization < 65).forEach((row) => {
    insights.push({
      type: 'Underutilized project',
      subject: row.project,
      amount: row.remaining,
      message: `${row.department} spent ${Math.round(row.utilization)}% of the ${row.project} allocation.`,
      action: 'Confirm delivery status; release unused funds or phase the next request against milestones.',
      confidence: 'historical',
    })
  })

  rows.filter((row) => row.status === 'Overspent').forEach((row) => {
    insights.push({
      type: 'Overspending',
      subject: row.project,
      amount: row.variance,
      message: row.variancePercent === null
        ? `${row.project} recorded actual spending against a zero plan.`
        : `${row.project} exceeded its prior-year plan by ${Math.abs(row.variancePercent).toFixed(1)}%.`,
      action: 'Review vendor and materials costs before approving the next allocation.',
      confidence: 'historical',
    })
  })

  rows.filter((row) => row.remaining >= 280000 && row.utilization < 65).forEach((row) => {
    insights.push({
      type: 'Potential idle funds',
      subject: row.project,
      amount: row.remaining,
      message: `${formatInstitutionalMoney(row.remaining)} remains unspent against the prior allocation for ${row.project}.`,
      action: 'Confirm project completion and deadline before releasing or reallocating the balance.',
      confidence: 'historical',
    })
  })

  return insights
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .slice(0, 5)
}
