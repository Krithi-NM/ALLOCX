import test from 'node:test'
import assert from 'node:assert/strict'
import { departments, requests, totalBudget } from './data.js'
import { allocateBudget, formatMoney, getScoreBreakdown, SCORE_WEIGHTS } from './allocation.js'

const scenarios = [6000000, 8000000, totalBudget, 12000000]

test('seeded portfolio covers the requested institutional scope', () => {
  assert.equal(requests.length, 35)
  assert.equal(departments.length, 10)
  const requested = requests.reduce((sum, request) => sum + request.requestedAmount, 0)
  assert.ok(requested >= 15000000 && requested <= 17000000, `unexpected total requested: ${requested}`)
  assert.deepEqual(SCORE_WEIGHTS, { impact: 0.35, utilization: 0.25, urgency: 0.2, alignment: 0.2 })
})

test('allocations stay within each tested budget and request cap', () => {
  for (const budget of scenarios) {
    const results = allocateBudget(requests, budget)
    const allocated = results.reduce((sum, request) => sum + request.recommendedAmount, 0)
    assert.ok(allocated <= budget + 0.01, `allocated ${allocated} above budget ${budget}`)
    assert.ok(allocated >= Math.min(budget, requests.reduce((sum, request) => sum + request.requestedAmount, 0)) - 0.01)
    for (const request of results) {
      assert.ok(request.recommendedAmount >= 0)
      assert.ok(request.recommendedAmount <= request.requestedAmount + 0.01)
      assert.ok(request.percentageFunded >= 0 && request.percentageFunded <= 100.01)
      assert.ok(request.score.total >= 0 && request.score.total <= 100)
    }
    for (const request of results.filter((item) => item.critical)) {
      assert.ok(request.recommendedAmount + 0.01 >= request.requestedAmount * 0.7)
    }
  }
})

test('ECE prior allocation and spend are seeded to the specified utilization', () => {
  const ece = requests.filter((request) => request.department === 'ECE')
  const allocation = ece.reduce((sum, request) => sum + request.previousAllocation, 0)
  const spending = ece.reduce((sum, request) => sum + request.previousSpending, 0)
  assert.equal(allocation, 1800000)
  assert.equal(spending, 1098000)
  assert.equal(Math.round(spending / allocation * 100), 61)
})

test('priority score breakdown matches the weighted scoring formula', () => {
  const request = requests.find((item) => item.id === 'AX-031')
  const score = getScoreBreakdown(request, 4200)
  assert.equal(score.impact, 100)
  assert.equal(score.utilization, 98)
  assert.equal(score.urgency, 100)
  assert.equal(score.alignment, 97)
  assert.equal(score.total, 98.9)
})

test('critical floors scale proportionally when they exceed the budget', () => {
  const results = allocateBudget(requests, 1000000)
  const critical = results.filter((item) => item.critical)
  const allocated = results.reduce((sum, item) => sum + item.recommendedAmount, 0)
  assert.ok(Math.abs(allocated - 1000000) < 0.01)
  const fundedPercentages = critical.map((item) => item.percentageFunded)
  assert.ok(fundedPercentages.every((value) => Math.abs(value - fundedPercentages[0]) < 0.01))
})

test('zero values and empty portfolios are safe', () => {
  assert.deepEqual(allocateBudget([], 0), [])
  assert.equal(formatMoney(0), '₹0')
  assert.equal(formatMoney(-120000, true), '−₹1.2L')
  assert.equal(allocateBudget(requests, 0).reduce((sum, item) => sum + item.recommendedAmount, 0), 0)
})
