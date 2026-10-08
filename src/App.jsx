import { useEffect, useMemo, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, ComposedChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import { departments, requests, totalBudget } from './data'
import { allocateBudget, SCORE_WEIGHTS, summarizeDepartments } from './allocation'
import {
  buildPerformanceInsights,
  buildPerformanceRows,
  summarizePerformance,
  summarizePerformanceByDepartment,
} from './performance'
import { formatInstitutionalMoney } from './money'

const icons = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.4" /><rect x="14" y="3" width="7" height="7" rx="1.4" /><rect x="3" y="14" width="7" height="7" rx="1.4" /><rect x="14" y="14" width="7" height="7" rx="1.4" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
  sliders: <><path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M2 14h4m4-6h4m4 8h4" /></>,
  spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" /><path d="m19 14 1 2.5 2.5 1-2.5 1L19 21l-1-2.5-2.5-1 2.5-1L19 14Z" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  arrow: <><path d="M5 12h14m-7-7 7 7-7 7" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
}

function Icon({ name, size = 18, className = '' }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>
}

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'requests', label: 'Requests', icon: 'file', badge: '35' },
  { key: 'simulator', label: 'What-If Simulator', icon: 'sliders' },
  { key: 'insights', label: 'Insights', icon: 'spark' },
  { key: 'audit', label: 'Audit Trail', icon: 'clock' },
]

const pct = (value) => `${Math.round(value)}%`

function StatCard({ label, value, sub, icon, tone = 'blue', trend }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon name={icon} size={19} /></div>
      <div className="stat-copy">
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{trend && <em>{trend}</em>}{sub}</span>
      </div>
    </article>
  )
}

function SectionTitle({ eyebrow, title, description, action }) {
  return <div className="section-title"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>
}

function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge ${tone}`}>{children}</span>
}

function PriorityMeter({ score }) {
  const color = score >= 75 ? '#3559d8' : score >= 60 ? '#ed9c38' : '#7c8aa6'
  return <div className="priority-meter"><div className="meter-track"><span style={{ width: `${Math.min(score, 100)}%`, background: color }} /></div><b>{score.toFixed(0)} <small>/ 100</small></b></div>
}

function getPriority(score) {
  if (score >= 75) return 'High'
  if (score >= 60) return 'Medium'
  return 'Standard'
}

function Dashboard({ allocations, baseline, onNavigate, onSelect }) {
  const requested = allocations.reduce((sum, item) => sum + item.requestedAmount, 0)
  const recommended = allocations.reduce((sum, item) => sum + item.recommendedAmount, 0)
  const deptData = summarizeDepartments(allocations)
  const topRequests = [...allocations].sort((a, b) => b.recommendedAmount - a.recommendedAmount).slice(0, 5)
  const utilization = baseline > 0 ? (recommended / baseline) * 100 : 0
  const performanceRows = buildPerformanceRows(requests)
  const performanceTotals = summarizePerformance(performanceRows)
  const performanceDepartments = summarizePerformanceByDepartment(performanceRows)
  const performanceInsights = buildPerformanceInsights(performanceRows)

  return (
    <>
      <div className="welcome-row">
        <div><p className="eyebrow">INSTITUTIONAL FINANCE · FY 2026–27</p><h1>Institutional Budget Overview</h1><p className="welcome-sub">See where the institution’s limited budget is going — and why.</p></div>
        <button className="button button-primary" onClick={() => onNavigate('simulator')}><Icon name="sliders" size={16} /> Explore budget scenarios <Icon name="arrow" size={16} /></button>
      </div>
      <div className="stats-grid">
        <StatCard label="Available budget" value={formatInstitutionalMoney(baseline)} sub="Annual institutional ceiling" icon="grid" tone="blue" />
        <StatCard label="Total requested" value={formatInstitutionalMoney(requested)} sub="Across 35 project requests" icon="file" tone="violet" trend="1.6× " />
        <StatCard label="Recommended allocation" value={formatInstitutionalMoney(recommended)} sub={`${utilization.toFixed(0)}% of current budget`} icon="check" tone="green" />
        <StatCard label="Actual spent · FY 2025–26" value={formatInstitutionalMoney(performanceTotals.actual)} sub="Historical actuals · not current-year spend" icon="file" tone="blue" />
        <StatCard label="Remaining · FY 2025–26" value={formatInstitutionalMoney(performanceTotals.remaining)} sub="Prior allocation less actual spend" icon="check" tone="green" />
      </div>
      <section className="budget-pressure" aria-label="Budget pressure">
        <div className="budget-pressure-heading"><span>Budget pressure</span><b>{(requested / baseline).toFixed(2)}× demand against available funds</b></div>
        <div className="budget-pressure-track"><span style={{ width: `${Math.min((baseline / requested) * 100, 100)}%` }} /></div>
        <div className="budget-pressure-values"><span><b>{formatInstitutionalMoney(requested)}</b> requested</span><span><b>{formatInstitutionalMoney(baseline)}</b> available</span></div>
      </section>

      <div className="dashboard-grid">
        <section className="card department-card">
          <div className="card-heading"><div><h3>Recommended allocation</h3><p>By department · current budget scenario</p></div><button className="text-button" onClick={() => onNavigate('requests')}>View requests <Icon name="chevron" size={15} /></button></div>
          <div className="chart-wrap department-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} layout="vertical" margin={{ top: 3, right: 28, left: 8, bottom: 0 }} barSize={12}>
                <CartesianGrid strokeDasharray="3 4" horizontal={false} stroke="#edf0f6" />
                <XAxis type="number" tickFormatter={formatInstitutionalMoney} axisLine={false} tickLine={false} tick={{ fill: '#65728a', fontSize: 11 }} />
                <YAxis type="category" dataKey="department" width={92} axisLine={false} tickLine={false} tick={{ fill: '#536079', fontSize: 11 }} />
                <Tooltip formatter={formatInstitutionalMoney} cursor={{ fill: '#f7f8fc' }} />
                <Bar dataKey="recommended" name="Recommended" radius={[0, 5, 5, 0]} fill="#4664db" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-footer"><span><i className="legend-dot" /> Recommended</span><span>{formatInstitutionalMoney(deptData.reduce((sum, row) => sum + row.recommended, 0))} allocated across all departments</span></div>
        </section>
        <section className="card top-priorities">
          <div className="card-heading"><div><h3>Top funded projects</h3><p>Largest recommended allocations</p></div><button className="icon-button" aria-label="View all requests" onClick={() => onNavigate('requests')}><Icon name="arrow" /></button></div>
          <div className="priority-list">
            {topRequests.map((item, index) => <button key={item.id} className="priority-row" onClick={() => onSelect(item.id)}>
              <span className="rank">{String(index + 1).padStart(2, '0')}</span><span className="priority-project"><b>{item.project}</b><small>{item.department} <span>·</span> Score {item.score.total.toFixed(0)}</small></span><strong>{formatInstitutionalMoney(item.recommendedAmount)}</strong>
            </button>)}
          </div>
          <button className="full-link" onClick={() => onNavigate('requests')}>Review all 35 requests <Icon name="arrow" size={15} /></button>
        </section>
      </div>

      <BudgetPerformance rows={performanceRows} totals={performanceTotals} departments={performanceDepartments} insights={performanceInsights} />
      <ScoringNote />
    </>
  )
}

function BudgetPerformance({ rows, totals, departments: departmentRows, insights }) {
  const chartRows = [...departmentRows].sort((a, b) => b.planned - a.planned)
  const overspentCount = rows.filter((row) => row.status === 'Overspent').length

  return <section className="performance-section">
    <div className="performance-heading">
      <div><span className="eyebrow">EXPENDITURE MONITORING · FY 2025–26</span><h2>Budget Performance</h2><p>Recorded prior allocations are used as the historical plan proxy because the seed has no separate expenditure-plan field. Current-year recommendations remain separate.</p></div>
      <Badge tone="neutral">Historical actuals</Badge>
    </div>
    <div className="performance-kpis">
      <article><span>Planned / prior allocation</span><strong>{formatInstitutionalMoney(totals.planned)}</strong></article>
      <article><span>Actual spent</span><strong>{formatInstitutionalMoney(totals.actual)}</strong></article>
      <article><span>Variance · actual − planned</span><strong className={totals.variance > 0 ? 'variance-over' : 'variance-under'}>{totals.variance > 0 ? '+' : ''}{formatInstitutionalMoney(totals.variance)}</strong></article>
      <article><span>Remaining balance</span><strong>{formatInstitutionalMoney(totals.remaining)}</strong></article>
    </div>
    <div className="performance-visual-grid">
      <section className="card performance-chart-card">
        <div className="card-heading"><div><h3>Planned vs actual expenditure</h3><p>Prior approved allocation compared with recorded spend by department</p></div><div className="chart-legend"><span><i className="legend-dot muted" /> Planned</span><span><i className="legend-dot" /> Actual</span></div></div>
        <div className="chart-wrap performance-chart"><ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartRows} layout="vertical" margin={{ top: 3, right: 25, left: 4, bottom: 0 }} barSize={8} barGap={3}>
            <CartesianGrid strokeDasharray="3 4" horizontal={false} stroke="#edf0f6" />
            <XAxis type="number" tickFormatter={formatInstitutionalMoney} axisLine={false} tickLine={false} tick={{ fill: '#65728a', fontSize: 10 }} />
            <YAxis type="category" dataKey="department" width={96} axisLine={false} tickLine={false} tick={{ fill: '#536079', fontSize: 11 }} />
            <Tooltip formatter={formatInstitutionalMoney} cursor={{ fill: '#f7f8fc' }} />
            <Bar dataKey="planned" name="Planned" fill="#c9d3e2" radius={[0, 4, 4, 0]} />
            <Bar dataKey="actual" name="Actual" fill="#4169aa" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer></div>
      </section>
      <section className="card performance-insights">
        <div className="card-heading"><div><h3>Management attention</h3><p>Rule-based actions from historical utilization and variance</p></div><Badge tone={insights.length ? 'amber' : 'green'}>{insights.length} flags</Badge></div>
        {insights.length ? <div className="performance-insight-list">{insights.map((insight) => <article className="performance-insight" key={`${insight.type}-${insight.subject}`}>
          <div className="performance-insight-top"><Badge tone={insight.type === 'Overspending' ? 'rose' : 'amber'}>{insight.type}</Badge><strong>{insight.subject}</strong></div>
          <p>{insight.message}{insight.type === 'Underutilization' || insight.type === 'Underutilized project' ? ` Unspent balance: ${formatInstitutionalMoney(insight.amount)}.` : ''}</p>
          <small><b>Suggested action</b> · {insight.action}</small>
        </article>)}</div> : <p className="performance-empty">No underutilization or overspending flags in the historical records.</p>}
      </section>
    </div>
    <section className="card performance-table-card">
      <div className="card-heading"><div><h3>Project expenditure register</h3><p>Allocated/planned, actual spent, variance and remaining balance for each seeded request · {rows.length} projects</p></div></div>
      <div className="performance-table-scroll"><table className="performance-table">
        <thead><tr><th>Activity / project</th><th>Department</th><th>Allocated / planned</th><th>Actual</th><th>Variance</th><th>Variance %</th><th>Remaining</th><th>Status</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id}>
          <th scope="row"><span>{row.project}</span><small>{row.id}</small></th><td>{row.department}</td>
          <td className="financial-cell">{formatInstitutionalMoney(row.allocated)}</td><td className="financial-cell">{formatInstitutionalMoney(row.actual)}</td>
          <td className={`financial-cell ${row.variance > 0 ? 'variance-over' : row.variance < 0 ? 'variance-under' : ''}`}>{row.variance > 0 ? '+' : ''}{formatInstitutionalMoney(row.variance)}</td>
          <td className={`financial-cell ${row.variance > 0 ? 'variance-over' : row.variance < 0 ? 'variance-under' : ''}`}>{row.variancePercent === null ? '—' : `${row.variance > 0 ? '+' : ''}${row.variancePercent.toFixed(1)}%`}</td>
          <td className="financial-cell">{formatInstitutionalMoney(row.remaining)}</td>
          <td><Badge tone={row.status === 'Overspent' ? 'rose' : row.status === 'Under plan' ? 'amber' : 'green'}>{row.status}</Badge></td>
        </tr>)}</tbody>
      </table></div>
      <div className="performance-table-note"><span>Variance = actual − planned</span><span>Remaining = prior allocation − actual spend</span><span>{overspentCount ? `${overspentCount} overspent items flagged` : 'No overspend recorded in seeded prior-year actuals'}</span></div>
    </section>
  </section>
}

function ScoringNote() {
  return <div className="scoring-note"><span className="note-icon"><Icon name="spark" size={18} /></span><div><b>Explainable Weighted Scoring Model</b><p>Every recommendation is traceable to measurable inputs: impact (35%), historical utilization (25%), urgency (20%) and strategic alignment (20%).</p></div><span className="note-tag">Transparent by design</span></div>
}

function RequestsPage({ allocations, onSelect }) {
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('All departments')
  const [priority, setPriority] = useState('All priorities')
  const [status, setStatus] = useState('All statuses')
  const [sort, setSort] = useState({ key: 'score', direction: 'desc' })
  const filtered = useMemo(() => allocations.filter((item) => {
    const matchesQuery = `${item.project} ${item.department} ${item.id} ${item.category}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery
      && (department === 'All departments' || item.department === department)
      && (priority === 'All priorities' || getPriority(item.score.total) === priority)
      && (status === 'All statuses' || item.status === status)
  }).sort((a, b) => {
    const av = sort.key === 'project' || sort.key === 'department' || sort.key === 'status'
      ? a[sort.key]
      : sort.key === 'score'
        ? a.score.total
        : sort.key === 'priority'
          ? ({ High: 3, Medium: 2, Standard: 1 })[getPriority(a.score.total)]
          : a[sort.key]
    const bv = sort.key === 'project' || sort.key === 'department' || sort.key === 'status'
      ? b[sort.key]
      : sort.key === 'score'
        ? b.score.total
        : sort.key === 'priority'
          ? ({ High: 3, Medium: 2, Standard: 1 })[getPriority(b.score.total)]
          : b[sort.key]
    return (typeof av === 'string' ? av.localeCompare(bv) : av - bv) * (sort.direction === 'asc' ? 1 : -1)
  }), [allocations, department, priority, query, sort, status])

  function sortBy(key) {
    setSort((current) => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' }))
  }
  const heading = (label, key) => <button className="sort-button" onClick={() => sortBy(key)}>{label}<span className={sort.key === key ? 'sort-active' : ''}>{sort.key === key ? sort.direction === 'asc' ? '↑' : '↓' : '↕'}</span></button>
  const filtersApplied = query || department !== 'All departments' || priority !== 'All priorities' || status !== 'All statuses'
  const clearFilters = () => {
    setQuery('')
    setDepartment('All departments')
    setPriority('All priorities')
    setStatus('All statuses')
  }

  return <>
    <SectionTitle eyebrow="BUDGET REVIEW · FY 2026–27" title="Funding Requests" description="Review institutional requests and understand why each rupee is recommended." action={<div className="request-summary"><b>{filtered.length}</b><span>of {allocations.length} requests</span></div>} />
    <div className="card requests-card">
      <div className="table-tools">
        <label className="search-field"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects or departments" aria-label="Search projects or departments" /></label>
        <label className="select-wrap"><span className="sr-only">Filter by department</span><select value={department} onChange={(event) => setDepartment(event.target.value)}><option>All departments</option>{departments.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label className="select-wrap"><span className="sr-only">Filter by priority</span><select value={priority} onChange={(event) => setPriority(event.target.value)}><option>All priorities</option><option>High</option><option>Medium</option><option value="Standard">Low</option></select></label>
        <label className="select-wrap"><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option>{[...new Set(allocations.map((item) => item.status))].sort().map((value) => <option key={value}>{value}</option>)}</select></label>
        {filtersApplied && <button className="clear-filters" onClick={clearFilters}>Clear filters</button>}
      </div>
      <div className="table-scroll"><table className="request-table"><thead><tr><th>{heading('Request / project', 'project')}</th><th>{heading('Department', 'department')}</th><th>{heading('Amount requested', 'requestedAmount')}</th><th>{heading('Recommended allocation', 'recommendedAmount')}</th><th>{heading('Score', 'score')}</th><th>{heading('Priority', 'priority')}</th><th>{heading('Status', 'status')}</th></tr></thead>
        <tbody>{filtered.map((item) => <tr key={item.id} onClick={() => onSelect(item.id)} tabIndex="0" aria-label={`View ${item.project} request details`} onKeyDown={(event) => event.key === 'Enter' && onSelect(item.id)}>
          <td><div className="project-cell"><span className="project-avatar">{item.department.slice(0, 1)}</span><span><b>{item.project}</b><small>{item.id}{item.critical && <i className="critical-dot" title="Critical request" />}</small></span></div></td>
          <td><span className="department-label">{item.department}</span></td>
          <td className="amount-cell">{formatInstitutionalMoney(item.requestedAmount)}</td>
          <td className="amount-cell recommended-cell">{formatInstitutionalMoney(item.recommendedAmount)}</td>
          <td><PriorityMeter score={item.score.total} /></td>
          <td><Badge tone={item.critical ? 'green' : getPriority(item.score.total) === 'High' ? 'blue' : getPriority(item.score.total) === 'Medium' ? 'amber' : 'neutral'}>{item.critical ? 'Critical' : getPriority(item.score.total) === 'Standard' ? 'Low' : getPriority(item.score.total)}</Badge></td>
          <td><Badge tone={item.status === 'Approved' ? 'green' : 'blue'}>{item.status}</Badge></td>
        </tr>)}
        {filtered.length === 0 && <tr><td colSpan="7" className="empty-state">No requests match these filters. Clear filters or try another search.</td></tr>}</tbody>
      </table></div>
      <div className="table-bottom"><span>Showing {filtered.length} requests · Sorted by {sort.key === 'score' ? 'score' : sort.key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span><span><i className="critical-dot" /> Critical requests receive a protected funding floor</span></div>
    </div>
    <ScoringNote />
  </>
}

function RequestDetail({ item, onClose, onApprove }) {
  if (!item) return null
  const components = [
    ['Impact score', item.score.impact, SCORE_WEIGHTS.impact, 'Students affected relative to the largest request'],
    ['Utilization score', item.score.utilization, SCORE_WEIGHTS.utilization, 'Previous spending as a share of allocation'],
    ['Urgency score', item.score.urgency, SCORE_WEIGHTS.urgency, `Department urgency rating · ${item.urgency}/5`],
    ['Alignment score', item.score.alignment, SCORE_WEIGHTS.alignment, 'Alignment score supplied with the request'],
  ]
  return <div className="drawer-backdrop" onClick={onClose}>
    <aside className="detail-drawer" onClick={(event) => event.stopPropagation()}>
      <div className="drawer-top"><span className="drawer-kicker">{item.id} · {item.department}</span><button className="icon-button" onClick={onClose} aria-label="Close details"><Icon name="close" /></button></div>
      <div className="drawer-title"><Badge tone={item.critical ? 'rose' : 'neutral'}>{item.critical ? 'Critical · protected floor' : 'Non-critical · unprotected'}</Badge><h2>{item.project}</h2><p>{item.category} · {item.studentsAffected.toLocaleString('en-IN')} students affected · {item.status}</p></div>
      <div className="drawer-tabs"><span className="active">Allocation overview</span></div>
        <div className="drawer-comparison">
          <div><span>Requested</span><strong>{formatInstitutionalMoney(item.requestedAmount)}</strong></div>
          <div className="comparison-divider" aria-hidden="true">→</div>
          <div className="recommended-amount"><span>Recommended</span><strong>{formatInstitutionalMoney(item.recommendedAmount)}</strong></div>
          <div className="funded-amount"><strong>{pct(item.percentageFunded)}</strong><span>funded</span></div>
        </div>
        <div className="drawer-rationale"><span>Why this allocation?</span><p>{item.reason}</p></div>
          <div className="score-hero"><div><span>Priority score</span><strong>{item.score.total.toFixed(1)}<small>/ 100</small></strong></div><div className="score-orbit"><span>{item.urgency}/5</span><small>Urgency</small></div></div>
          <div className="drawer-section"><div className="drawer-section-heading"><h3>Explainable score breakdown</h3><span>Raw score × model weight</span></div>{components.map(([label, value, weight, description]) => <div className="breakdown-row" key={label}><div className="breakdown-head"><b>{label}</b><span>{value.toFixed(0)} × {Math.round(weight * 100)}% <strong>{(value * weight).toFixed(1)} pts</strong></span></div><div className="breakdown-track"><span style={{ width: `${value}%` }} /></div><small>{description}</small></div>)}</div>
        <div className="allocation-recommendation"><div className="recommendation-line"><span>Current-year recommendation</span><strong>{formatInstitutionalMoney(item.recommendedAmount)}</strong></div>{item.critical && <div className="protected-explanation"><Icon name="check" size={14} /> 70% protected target; scaled if critical floors exceed budget.</div>}</div>
        <section className="drawer-financial-history">
          <div className="drawer-financial-heading"><div><b>Expenditure & balance</b><small>FY 2025–26 historical record</small></div><Badge tone={item.previousSpending > item.previousAllocation ? 'rose' : 'green'}>{item.previousSpending > item.previousAllocation ? 'Overspent' : 'Within allocation'}</Badge></div>
          <div className="drawer-financial-grid">
            <div><span>Allocated / planned</span><strong>{formatInstitutionalMoney(item.previousAllocation)}</strong></div>
            <div><span>Actual spent</span><strong>{formatInstitutionalMoney(item.previousSpending)}</strong></div>
            <div><span>{item.previousSpending > item.previousAllocation ? 'Overspend' : 'Remaining'}</span><strong className={item.previousSpending > item.previousAllocation ? 'variance-over' : ''}>{formatInstitutionalMoney(Math.abs(item.previousAllocation - item.previousSpending))}</strong></div>
          </div>
        </section>
      <div className="drawer-footer">{item.status !== 'Approved' ? <button className="button button-primary" onClick={() => onApprove(item.id)}>Approve recommendation</button> : <Badge tone="green">Approved in this session</Badge>}<button className="button button-secondary" onClick={onClose}>Close</button></div>
    </aside>
  </div>
}

function Simulator({ allocations, baseline, budget, setBudget }) {
  const baselineAllocations = useMemo(() => allocateBudget(requests, baseline), [baseline])
  const deltaMap = new Map(baselineAllocations.map((item) => [item.id, item.recommendedAmount]))
  const changes = allocations.map((item) => ({ ...item, previousRecommended: deltaMap.get(item.id) || 0, delta: item.recommendedAmount - (deltaMap.get(item.id) || 0) }))
  const deptData = summarizeDepartments(allocations).map((row) => {
    const old = baselineAllocations.filter((item) => item.department === row.department).reduce((sum, item) => sum + item.recommendedAmount, 0)
    return { ...row, previous: old, change: row.recommended - old }
  })
  const totalChange = allocations.reduce((sum, item) => sum + item.recommendedAmount, 0) - baseline
  const reduced = changes.filter((item) => item.delta < -0.01).sort((a, b) => a.delta - b.delta)
  const increased = changes.filter((item) => item.delta > 0.01).sort((a, b) => b.delta - a.delta)
  const protectedItems = allocations.filter((item) => item.critical)
  const scenarioLabel = budget === baseline ? 'Baseline budget' : budget < baseline ? 'Budget reduction' : 'Budget increase'
  const budgetPct = baseline > 0 ? ((budget - baseline) / baseline) * 100 : 0
  const summary = budget < baseline
    ? `At ${formatInstitutionalMoney(budget)}, critical projects retain their protected floors while lower-priority requests absorb the largest reductions.`
    : budget > baseline
      ? `At ${formatInstitutionalMoney(budget)}, the additional budget flows to high-scoring requests first, up to each project’s full ask.`
      : `At the ${formatInstitutionalMoney(baseline)} baseline, critical projects receive protected floors and remaining funds follow transparent priority weights.`
  return <>
    <SectionTitle eyebrow="SCENARIO PLANNING" title="What-if simulator" description="Explore how a changing budget reshapes allocations, instantly and transparently." action={<Badge tone="blue">Live model</Badge>} />
    <section className="sim-hero">
      <div className="sim-copy"><span className="sim-kicker"><i /> SCENARIO CONTROL</span><h2>What happens if the budget changes?</h2><p>Test funding decisions before they are approved. The same allocation engine recalculates every recommendation in real time.</p><div className="sim-budget-readout"><div><small>Scenario budget</small><strong>{formatInstitutionalMoney(budget)}</strong></div><span className={`delta-chip ${budgetPct < 0 ? 'negative' : budgetPct > 0 ? 'positive' : ''}`}>{budgetPct > 0 ? '+' : ''}{budgetPct.toFixed(0)}% vs baseline</span></div></div>
      <div className="sim-control"><div className="control-heading"><span>Available institutional budget</span><b>{formatInstitutionalMoney(6000000)} <i>—</i> {formatInstitutionalMoney(12000000)}</b></div><input className="budget-slider" aria-label="Available institutional budget" type="range" min="6000000" max="12000000" step="100000" value={budget} style={{ '--slider-progress': `${((budget - 6000000) / 6000000) * 100}%` }} onChange={(event) => setBudget(Number(event.target.value))} /><div className="slider-ticks">{[6000000, 8000000, 10000000, 12000000].map((value) => <button key={value} onClick={() => setBudget(value)} aria-label={`Set budget to ${formatInstitutionalMoney(value)}`}>{formatInstitutionalMoney(value)}</button>)}</div>
        <div className="presets"><span>QUICK SCENARIOS</span>{[-10, -20, -30, 10].map((value) => <button key={value} onClick={() => setBudget(Math.max(6000000, Math.min(12000000, baseline * (1 + value / 100))))}>{value > 0 ? '+' : ''}{value}%</button>)}</div>
        <div className="baseline-rule"><span>Baseline budget</span><b>{formatInstitutionalMoney(baseline)}</b><span className="baseline-meter"><i style={{ width: `${Math.min(100, budget / 12000000 * 100)}%` }} /></span></div>
      </div>
    </section>
    <div className="scenario-summary"><span className="summary-star"><Icon name="spark" size={20} /></span><div><b>{scenarioLabel} · {formatInstitutionalMoney(budget)}</b><p>{summary}</p></div><span className={`summary-delta ${totalChange < 0 ? 'negative' : totalChange > 0 ? 'positive' : ''}`}>{totalChange > 0 ? '+' : ''}{formatInstitutionalMoney(totalChange)} allocation change</span></div>
    <div className="sim-stats"><StatCard label="Projects protected" value={`${protectedItems.filter((item) => item.percentageFunded >= 69.9).length} / ${protectedItems.length}`} sub="Critical projects at protected floor" icon="check" tone="green" /><StatCard label="Projects reduced" value={String(reduced.length)} sub="Compared with baseline" icon="sliders" tone="amber" /><StatCard label="Budget reallocated" value={formatInstitutionalMoney(Math.abs(totalChange))} sub={`${budgetPct > 0 ? '+' : ''}${budgetPct.toFixed(0)}% vs baseline budget`} icon="grid" tone="blue" /></div>
    <div className="dashboard-grid sim-charts">
      <section className="card"><div className="card-heading"><div><h3>Department allocation shifts</h3><p>Baseline vs current scenario</p></div><div className="chart-legend"><span><i className="legend-dot muted" /> Baseline</span><span><i className="legend-dot" /> Scenario</span></div></div>
        <div className="chart-wrap sim-chart"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={deptData} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}><CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#edf0f6" /><XAxis dataKey="department" axisLine={false} tickLine={false} interval={0} angle={-25} textAnchor="end" height={54} tick={{ fill: '#68758c', fontSize: 10 }} /><YAxis tickFormatter={formatInstitutionalMoney} axisLine={false} tickLine={false} tick={{ fill: '#8a94a8', fontSize: 10 }} /><Tooltip formatter={formatInstitutionalMoney} /><Bar dataKey="previous" name="Baseline" fill="#d9dfed" radius={[4, 4, 0, 0]} barSize={13} /><Bar dataKey="recommended" name="Scenario" fill="#4563db" radius={[4, 4, 0, 0]} barSize={13} /></ComposedChart></ResponsiveContainer></div>
      </section>
      <section className="card scenario-insight"><div className="insight-icon"><Icon name="spark" size={20} /></div><span className="eyebrow">DECISION INSIGHT</span><h3>{budget < baseline ? 'Focused reductions, protected priorities.' : budget > baseline ? 'New capacity, directed by impact.' : 'Balanced priorities, clearly funded.'}</h3><p>{summary}</p><div className="insight-rule" /><div className="insight-stat"><span>Change from baseline</span><b className={totalChange < 0 ? 'red-text' : 'green-text'}>{totalChange > 0 ? '+' : ''}{formatInstitutionalMoney(totalChange)}</b></div><div className="insight-stat"><span>Highest funded increase</span><b>{increased[0] && increased[0].delta > 0 ? increased[0].department : '—'}</b></div></section>
    </div>
    <section className="card department-comparison">
      <div className="card-heading"><div><h3>Department allocation comparison</h3><p>Baseline allocation versus the selected budget scenario</p></div></div>
      <div className="department-comparison-scroll"><table><thead><tr><th>Department</th><th>Baseline</th><th>Scenario</th><th>Change</th></tr></thead><tbody>
        {deptData.map((row) => <tr key={row.department}><th scope="row">{row.department}</th><td>{formatInstitutionalMoney(row.previous)}</td><td className="department-scenario-value">{formatInstitutionalMoney(row.recommended)}</td><td className={row.change < -0.01 ? 'department-change negative' : row.change > 0.01 ? 'department-change positive' : 'department-change'}>{row.change < -0.01 ? '↓ ' : row.change > 0.01 ? '↑ +' : '— '}{row.change !== 0 ? formatInstitutionalMoney(Math.abs(row.change)) : formatInstitutionalMoney(0)}</td></tr>)}
      </tbody></table></div>
    </section>
    <section className="card changes-card"><div className="card-heading"><div><h3>What changed</h3><p>Request-level movement compared with the {formatInstitutionalMoney(baseline)} baseline</p></div><Badge tone={budget < baseline ? 'amber' : budget > baseline ? 'green' : 'neutral'}>{budget < baseline ? 'Reductions' : budget > baseline ? 'Increases' : 'No change'}</Badge></div>
      <div className="changes-grid"><div className="change-column"><div className="change-column-title"><span className="change-icon down">↓</span><b>Largest reductions</b><small>Lowest priority absorbs more</small></div>{reduced.length ? reduced.slice(0, 4).map((item) => <ChangeRow key={item.id} item={item} />) : <p className="empty-state">No requests are reduced in this scenario.</p>}</div><div className="change-column"><div className="change-column-title"><span className="change-icon up">↑</span><b>Largest increases</b><small>Priority-weighted gains</small></div>{increased.length ? increased.slice(0, 4).map((item) => <ChangeRow key={item.id} item={item} positive />) : <p className="empty-state">No requests increase in this scenario.</p>}</div></div>
    </section>
    <div className="protected-note"><Icon name="check" size={17} /><span><b>What stays protected:</b> {protectedItems.map((item) => item.project).slice(0, 2).join(' and ')}{protectedItems.length > 2 ? ` + ${protectedItems.length - 2} other critical projects` : ''} receive protected minimums first, scaled proportionally only if the critical floors exceed the total budget.</span></div>
  </>
}

function ChangeRow({ item, positive = false }) {
  const deltaPct = item.previousRecommended > 0 ? (item.delta / item.previousRecommended) * 100 : item.delta > 0 ? 100 : 0
  return <div className="change-row"><span className={`change-direction ${positive ? 'up' : 'down'}`}>{positive ? '↗' : '↘'}</span><span className="change-project"><b>{item.project}</b><small>{item.department} · {formatInstitutionalMoney(item.previousRecommended)} → {formatInstitutionalMoney(item.recommendedAmount)}</small></span><span className={`change-value ${positive ? 'positive' : 'negative'}`}>{item.delta > 0 ? '+' : ''}{formatInstitutionalMoney(item.delta)}<small>{deltaPct > 0 ? '+' : ''}{deltaPct.toFixed(0)}%</small></span></div>
}

function InsightsPage({ onSelect }) {
  const rows = buildPerformanceRows(requests)
  const insights = buildPerformanceInsights(rows)
  const overspendCount = rows.filter((row) => row.status === 'Overspent').length
  const categories = [
    {
      title: 'Underutilization',
      tone: 'amber',
      description: 'Prior-year spending below the 65% review threshold.',
      items: insights.filter((insight) => insight.type === 'Underutilization' || insight.type === 'Underutilized project'),
    },
    {
      title: 'Potential idle funds',
      tone: 'amber',
      description: 'Large unspent balances that need deadline/completion confirmation.',
      items: insights.filter((insight) => insight.type === 'Potential idle funds'),
    },
    {
      title: 'Overspending',
      tone: 'rose',
      description: 'Actual expenditure exceeded the historical plan.',
      items: insights.filter((insight) => insight.type === 'Overspending'),
    },
  ]

  return <>
    <SectionTitle eyebrow="RULE-BASED MANAGEMENT REVIEW" title="Budget Insights" description="Evidence from prior-year utilization, expenditure variance and unspent balances—with actions for review." action={<Badge tone="neutral">{insights.length + (overspendCount === 0 ? 1 : 0)} signals</Badge>} />
    <div className="insight-disclaimer">Historical signals use FY 2025–26 actual spending against prior allocations. They are management review prompts, not current-year forecasts.</div>
    <div className="insight-category-grid">
      {categories.map((category) => <section className="card insight-category-card" key={category.title}>
        <div className="card-heading"><div><h3>{category.title}</h3><p>{category.description}</p></div><Badge tone={category.tone}>{category.items.length} {category.items.length === 1 ? 'flag' : 'flags'}</Badge></div>
        {category.items.length ? <div className="insight-action-list">{category.items.map((insight) => {
          const related = rows.find((row) => row.project === insight.subject || row.department === insight.subject)
          return <article className="insight-action-item" key={`${insight.type}-${insight.subject}`}>
            <div><span>{insight.subject}</span><strong>{formatInstitutionalMoney(insight.amount)}</strong></div>
            <p>{insight.message}</p>
            <small><b>Suggested action</b> · {insight.action}</small>
            <button className="text-button" onClick={() => related && onSelect(related.id)}>Review related request <Icon name="arrow" size={14} /></button>
          </article>
        })}</div> : <div className="insight-empty">{category.title === 'Overspending' ? 'No overspending appears in the seeded prior-year records. Variance is calculated as actual minus planned.' : 'No records currently meet this deterministic review rule.'}</div>}
      </section>)}
    </div>
    <section className="card insight-variance-card">
      <div className="card-heading"><div><h3>Planned vs actual variance</h3><p>Prior allocation used as the historical plan proxy · negative variance indicates underspend.</p></div></div>
      <div className="insight-variance-list">{rows.filter((row) => row.variance !== 0).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)).slice(0, 8).map((row) => <button key={row.id} className="insight-variance-row" onClick={() => onSelect(row.id)}>
        <span><b>{row.project}</b><small>{row.department}</small></span><span>{formatInstitutionalMoney(row.planned)}</span><span>{formatInstitutionalMoney(row.actual)}</span><strong className={row.variance > 0 ? 'variance-over' : 'variance-under'}>{row.variance > 0 ? '+' : ''}{formatInstitutionalMoney(row.variance)} · {row.variancePercent === null ? '—' : `${row.variancePercent.toFixed(1)}%`}</strong>
      </button>)}</div>
    </section>
    <ScoringNote />
  </>
}

function AuditPage({ allocations, events, onSelect }) {
  const approvedCount = allocations.filter((item) => item.status === 'Approved').length
  const stages = ['Requested', 'Evaluated', 'Recommended', 'Approved']

  return <>
    <SectionTitle eyebrow="DECISION TRACEABILITY" title="Audit Trail" description="Inspect request inputs, explainable evaluations, recommendations and demo approvals." action={<Badge tone="blue">Client-side demo</Badge>} />
    <div className="audit-disclaimer">Seeded request/evaluation/recommendation records are derived from the current portfolio. Approval actions are held in frontend state for this session; no backend audit store is connected.</div>
    <section className="card audit-lifecycle-card">
      <div className="card-heading"><div><h3>Allocation decision lifecycle</h3><p>Each request can be opened for detailed review; approval is recorded in this demo session.</p></div></div>
      <div className="audit-lifecycle-steps">{stages.map((stage, index) => <div className="audit-lifecycle-step" key={stage}><span>{index + 1}</span><b>{stage}</b>{index < stages.length - 1 && <i />}</div>)}</div>
    </section>
    <section className="card audit-record-card">
      <div className="card-heading"><div><h3>Request decision register</h3><p>{allocations.length} records · current recommendations are calculated by the existing allocation engine</p></div><Badge tone="green">{approvedCount} approved</Badge></div>
      <div className="audit-register-scroll"><table className="audit-register"><thead><tr><th>Request</th><th>Department</th><th>Requested</th><th>Score</th><th>Recommended</th><th>Approval</th><th>Review</th></tr></thead><tbody>
        {allocations.map((item) => <tr key={item.id}>
          <th scope="row"><span>{item.project}</span><small>{item.id}</small></th><td>{item.department}</td><td className="financial-cell">{formatInstitutionalMoney(item.requestedAmount)}</td>
          <td>{item.score.total.toFixed(1)} / 100</td><td className="financial-cell recommended-cell">{formatInstitutionalMoney(item.recommendedAmount)}</td>
          <td><Badge tone={item.status === 'Approved' ? 'green' : 'amber'}>{item.status === 'Approved' ? 'Approved' : 'Awaiting approval'}</Badge></td>
          <td><button className="small-action" onClick={() => onSelect(item.id)}>Open record</button></td>
        </tr>)}
      </tbody></table></div>
    </section>
    <section className="card audit-events-card">
      <div className="card-heading"><div><h3>Session approval activity</h3><p>Events recorded by demo approvals since this page was opened</p></div><Badge tone="neutral">{events.length} events</Badge></div>
      {events.length ? <ol className="audit-event-list">{events.map((event) => <li key={event.id}><span className="audit-event-dot" /><div><b>{event.project}</b><p>{event.action} · {event.department}</p><small>{event.timestamp}</small></div><strong>{formatInstitutionalMoney(event.amount)}</strong></li>)}</ol> : <p className="audit-no-events">No approval actions in this session yet. Open a request from the register to inspect it; recommendations can be approved in the detail drawer.</p>}
    </section>
  </>
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [budget, setBudget] = useState(totalBudget)
  const [selectedId, setSelectedId] = useState(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [approvedRequests, setApprovedRequests] = useState({})
  const [auditEvents, setAuditEvents] = useState([])
  const allocations = useMemo(
    () => allocateBudget(requests, budget).map((item) => ({
      ...item,
      status: approvedRequests[item.id] ? 'Approved' : item.status,
    })),
    [approvedRequests, budget],
  )
  const selected = allocations.find((item) => item.id === selectedId)
  const pageTitle = navItems.find((item) => item.key === activePage)?.label || 'Dashboard'

  useEffect(() => {
    if (!selectedId) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [selectedId])

  function navigate(page) {
    setActivePage(page)
    setMobileNavOpen(false)
    setSelectedId(null)
  }
  function approveRequest(id) {
    const item = allocations.find((request) => request.id === id)
    if (!item || item.status === 'Approved') return
    setApprovedRequests((current) => ({ ...current, [id]: true }))
    setAuditEvents((current) => [{
      id: `${id}-${Date.now()}`,
      requestId: id,
      project: item.project,
      department: item.department,
      amount: item.recommendedAmount,
      action: 'Recommendation approved',
      timestamp: new Date().toLocaleString('en-IN'),
    }, ...current])
  }
  function openRequest(id) {
    setSelectedId(id)
  }
  const pages = {
    dashboard: <Dashboard allocations={allocations} baseline={totalBudget} onNavigate={navigate} onSelect={setSelectedId} />,
    requests: <RequestsPage allocations={allocations} onSelect={setSelectedId} />,
    simulator: <Simulator allocations={allocations} baseline={totalBudget} budget={budget} setBudget={setBudget} />,
    insights: <InsightsPage onSelect={openRequest} />,
    audit: <AuditPage allocations={allocations} events={auditEvents} onSelect={openRequest} />,
  }

  return <div className="app-shell">
    {mobileNavOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
    <aside className={`sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
      <div className="brand"><span className="brand-mark"><span>A</span><i /></span><span className="brand-name">ALLOC<span>X</span><small>INSTITUTIONAL BUDGET INTELLIGENCE</small></span><button className="mobile-close icon-button" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"><Icon name="close" /></button></div>
      <div className="institution-switch"><span className="institution-avatar">N</span><span><b>Northbridge Institute</b><small>Institutional workspace</small></span></div>
      <div className="nav-caption">WORKSPACE</div>
      <nav className="main-nav" aria-label="Main navigation">{navItems.map((item) => <button key={item.key} className={`nav-link ${activePage === item.key ? 'active' : ''}`} onClick={() => navigate(item.key)}><Icon name={item.icon} size={18} /><span>{item.label}</span>{item.key === 'requests' && <small>{allocations.length}</small>}{item.key === 'audit' && auditEvents.length > 0 && <small>{auditEvents.length}</small>}</button>)}</nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-budget"><div className="sidebar-budget-top"><span>FY 2026–27 BUDGET</span><span className="budget-status"><i /> ACTIVE</span></div><strong>{formatInstitutionalMoney(totalBudget)}</strong><div className="sidebar-progress"><i style={{ width: '100%' }} /></div><div className="sidebar-budget-foot"><span>Annual allocation ceiling</span><b>100%</b></div></div>
      <div className="sidebar-user"><span className="user-avatar">FM</span><span><b>Finance Manager</b><small>Institutional finance</small></span></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Icon name="menu" /></button><div className="topbar-heading"><b>{pageTitle}</b><span>{activePage === 'dashboard' ? 'Institutional budget overview and allocation intelligence' : activePage === 'requests' ? 'Review requests against transparent recommendations' : activePage === 'simulator' ? 'Test funding decisions before they are approved' : activePage === 'insights' ? 'Rule-based review signals and management actions' : 'Request evaluations and approval activity'}</span></div></div><div className="topbar-right"><div className="fiscal-chip"><i /> FY 2026–27</div><span className="topbar-divider" /><span className="topbar-date">Updated today</span></div></header>
      <div className="content-wrap">{pages[activePage]}</div>
      <footer className="app-footer"><span>ALLOCX <i>·</i> Strategic Institutional Budget Allocation</span><span>Explainable. Transparent. Accountable.</span></footer>
    </main>
    <RequestDetail item={selected} onClose={() => setSelectedId(null)} onApprove={approveRequest} />
  </div>
}

export default App
