import test from 'node:test'
import assert from 'node:assert/strict'
import { requests } from './data.js'
import {
  buildPerformanceInsights,
  buildPerformanceRows,
  calculateVariance,
  summarizePerformance,
} from './performance.js'
import { formatInstitutionalMoney } from './money.js'

test('planned versus actual variance and statuses are calculated safely', () => {
  assert.deepEqual(calculateVariance(20000, 24000), {
    variance: 4000,
    variancePercent: 20,
    status: 'Overspent',
  })
  assert.deepEqual(calculateVariance(30000, 27000), {
    variance: -3000,
    variancePercent: -10,
    status: 'Under plan',
  })
  assert.deepEqual(calculateVariance(15000, 14250), {
    variance: -750,
    variancePercent: -5,
    status: 'On track',
  })
  assert.deepEqual(calculateVariance(0, 0), {
    variance: 0,
    variancePercent: null,
    status: 'On track',
  })
  assert.deepEqual(calculateVariance(0, 100), {
    variance: 100,
    variancePercent: null,
    status: 'Overspent',
  })
})

test('institutional currency formatting uses consistent Indian financial units', () => {
  assert.equal(formatInstitutionalMoney(10000000), '₹1.00 Cr')
  assert.equal(formatInstitutionalMoney(1800000), '₹18.00 L')
  assert.equal(formatInstitutionalMoney(20000), '₹20.00 K')
  assert.equal(formatInstitutionalMoney(-4000), '−₹4.00 K')
})

test('overspending is surfaced as an actionable rule-based insight', () => {
  const [row] = buildPerformanceRows([{
    id: 'DEMO-001',
    project: 'Workshop',
    department: 'MBA',
    previousAllocation: 20000,
    previousSpending: 24000,
  }])
  const [insight] = buildPerformanceInsights([row])

  assert.equal(row.variance, 4000)
  assert.equal(row.variancePercent, 20)
  assert.equal(row.remaining, -4000)
  assert.equal(row.status, 'Overspent')
  assert.equal(insight.type, 'Overspending')
  assert.match(insight.action, /vendor and materials costs/)

  const [zeroPlanRow] = buildPerformanceRows([{
    id: 'DEMO-002',
    project: 'Unplanned purchase',
    department: 'MBA',
    previousAllocation: 0,
    previousSpending: 100,
  }])
  const [zeroPlanInsight] = buildPerformanceInsights([zeroPlanRow])
  assert.equal(zeroPlanRow.variancePercent, null)
  assert.match(zeroPlanInsight.message, /against a zero plan/)
})

test('seeded performance reconciles with request history and flags ECE utilization', () => {
  const rows = buildPerformanceRows(requests)
  const totals = summarizePerformance(rows)
  const ece = rows.filter((row) => row.department === 'ECE')
  const insights = buildPerformanceInsights(rows)

  assert.equal(rows.length, 35)
  assert.equal(totals.planned, requests.reduce((sum, request) => sum + request.previousAllocation, 0))
  assert.equal(totals.actual, requests.reduce((sum, request) => sum + request.previousSpending, 0))
  assert.equal(totals.remaining, totals.planned - totals.actual)
  assert.equal(ece.reduce((sum, row) => sum + row.planned, 0), 1800000)
  assert.equal(ece.reduce((sum, row) => sum + row.actual, 0), 1098000)
  assert.ok(insights.some((insight) => insight.subject === 'ECE' && insight.message.includes('61%')))
})
