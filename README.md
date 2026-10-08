# ALLOCX — Institutional Budget Intelligence

An explainable institutional budget allocation and decision-support system that helps institutions allocate limited budgets transparently and simulate financial scenarios.

## Problem

Colleges have limited annual budgets, while departments submit requests that can exceed available funds. Traditional allocation can be difficult to justify, compare and adapt when budgets change.

## Solution

ALLOCX provides a transparent decision workflow:

**REQUEST → SCORE → ALLOCATE → EXPLAIN → SIMULATE → FLAG**

Seeded request data is evaluated with a weighted scoring model, allocated against a configurable budget scenario, and accompanied by explanations and rule-based expenditure review signals.

## Key Features

- Explainable weighted scoring for project requests
- Priority-based proportional budget allocation
- Protected funding floors for critical requests
- What-If budget simulator using the same allocation engine
- Department-level allocation and scenario comparisons
- Historical underutilization, unspent-balance and expenditure-variance insights
- Request-level allocation explanations and score breakdowns
- Client-side audit register with demo-session approval activity

Historical expenditure views use seeded prior allocations and spending; they are labeled as historical records and are not presented as current-year forecasts. The seeded records do not currently show overspending.

## Scoring Model

- **Impact — 35%**
- **Utilization — 25%**
- **Urgency — 20%**
- **Alignment — 20%**

The weights are configurable policy parameters in the scoring module. Scores explain how request inputs contribute to a priority score; they are not AI/ML-generated.

## Allocation Engine

ALLOCX uses **priority-weighted proportional allocation with protected floors**. Critical requests receive protected funding first. The remaining available budget is distributed proportionally using request priority and requested amount, subject to request caps.

## Tech Stack

- React
- Vite
- Tailwind CSS
- Recharts
- JavaScript
- Client-side seeded data

## Architecture

The React interface presents seeded requests and scenarios. The scoring engine evaluates request priorities; the allocation engine calculates recommendations; the What-If simulator reruns that same allocation engine for the selected budget. Historical expenditure rules produce management review signals.

**UI → scoring engine → allocation engine → scenario simulation**

## Demo Flow

1. View the institutional budget and recommended allocations.
2. Review and filter funding requests.
3. Open a request to inspect its score and allocation explanation.
4. Change the budget in the What-If Simulator.
5. Compare department allocations and see protected or reduced projects.
6. Review historical expenditure and management-attention signals.

## Running Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Testing

```bash
npm test
```

## Future Scope

- Supabase/PostgreSQL persistence
- Role-based approvals
- Historical institutional data
- Multi-institution deployment
- Advanced optimization models
