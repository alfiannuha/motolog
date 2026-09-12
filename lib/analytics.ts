export interface AnalyticsLog {
  service_date: string
  odometer: number
  total_cost: number
}

export interface AnalyticsItem {
  item_type: 'part' | 'service_fee'
  cost: number
}

export interface MonthlySpendPoint {
  key: string
  month: string
  total: number
}

export interface ExpenseSummary {
  lifetimeTotal: number
  averageMonthly: number
  averageYearly: number
  costPerKm: number | null
  trackedKm: number
  initialOdometer: number
  partTotal: number
  serviceFeeTotal: number
  serviceFeeRatio: number
  monthlyTrend: MonthlySpendPoint[]
  logCount: number
  firstServiceDate: string | null
}

export interface ExpenseSummaryInput {
  logs: AnalyticsLog[]
  items: AnalyticsItem[]
  currentOdometer: number
  now?: Date
  months?: number
}

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

const DAYS_PER_MONTH = 30.44

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function labelFor(key: string): string {
  const month = Number(key.slice(5, 7))
  return MONTH_LABELS[month - 1] ?? key
}

export function buildExpenseSummary({
  logs,
  items,
  currentOdometer,
  now = new Date(),
  months = 6,
}: ExpenseSummaryInput): ExpenseSummary {
  const lifetimeTotal = logs.reduce((sum, log) => sum + log.total_cost, 0)

  const partTotal = items
    .filter((item) => item.item_type === 'part')
    .reduce((sum, item) => sum + item.cost, 0)
  const serviceFeeTotal = items
    .filter((item) => item.item_type === 'service_fee')
    .reduce((sum, item) => sum + item.cost, 0)
  const categorized = partTotal + serviceFeeTotal

  const dates = logs.map((log) => log.service_date.slice(0, 10)).sort()
  const firstServiceDate = dates[0] ?? null

  let elapsedMonths = 1
  if (firstServiceDate) {
    const first = Date.parse(`${firstServiceDate}T00:00:00Z`)
    const days = (now.getTime() - first) / 86_400_000
    elapsedMonths = Math.max(1, days / DAYS_PER_MONTH)
  }

  const averageMonthly = lifetimeTotal / elapsedMonths
  const averageYearly = averageMonthly * 12

  const initialOdometer = logs.length
    ? logs.reduce((min, log) => Math.min(min, log.odometer), logs[0].odometer)
    : 0
  const trackedKm = logs.length ? Math.max(0, currentOdometer - initialOdometer) : 0
  const costPerKm = trackedKm > 0 ? lifetimeTotal / trackedKm : null

  const window = Math.max(1, months)
  const buckets = new Map<string, number>()
  const cursor = new Date(now)
  cursor.setUTCDate(1)
  for (let offset = window - 1; offset >= 0; offset -= 1) {
    const point = new Date(
      Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - offset, 1),
    )
    buckets.set(monthKey(point), 0)
  }

  for (const log of logs) {
    const key = log.service_date.slice(0, 7)
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + log.total_cost)
    }
  }

  const monthlyTrend = [...buckets.entries()].map(([key, total]) => ({
    key,
    month: labelFor(key),
    total,
  }))

  return {
    lifetimeTotal,
    averageMonthly,
    averageYearly,
    costPerKm,
    trackedKm,
    initialOdometer,
    partTotal,
    serviceFeeTotal,
    serviceFeeRatio: categorized > 0 ? serviceFeeTotal / categorized : 0,
    monthlyTrend,
    logCount: logs.length,
    firstServiceDate,
  }
}

function runSelfCheck() {
  const eq = (actual: unknown, expected: unknown, label: string) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
      )
    }
  }

  const now = new Date('2026-09-15T00:00:00Z')
  const logs: AnalyticsLog[] = [
    { service_date: '2026-04-10', odometer: 10000, total_cost: 100_000 },
    { service_date: '2026-05-10', odometer: 12000, total_cost: 200_000 },
    { service_date: '2026-08-10', odometer: 16000, total_cost: 300_000 },
  ]
  const items: AnalyticsItem[] = [
    { item_type: 'part', cost: 400_000 },
    { item_type: 'service_fee', cost: 200_000 },
  ]

  const summary = buildExpenseSummary({
    logs,
    items,
    currentOdometer: 18000,
    now,
    months: 6,
  })

  eq(summary.lifetimeTotal, 600_000, 'lifetimeTotal')
  eq(summary.logCount, 3, 'logCount')
  eq(summary.partTotal, 400_000, 'partTotal')
  eq(summary.serviceFeeTotal, 200_000, 'serviceFeeTotal')
  eq(summary.serviceFeeRatio, 1 / 3, 'serviceFeeRatio')
  eq(summary.initialOdometer, 10_000, 'initialOdometer')
  eq(summary.trackedKm, 8_000, 'trackedKm')
  eq(summary.costPerKm, 75, 'costPerKm')
  eq(
    summary.monthlyTrend.map((point) => point.key),
    ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'],
    'trend keys',
  )
  eq(
    summary.monthlyTrend.map((point) => point.total),
    [100_000, 200_000, 0, 0, 300_000, 0],
    'trend totals',
  )
  eq(summary.monthlyTrend[0].month, 'Apr', 'month label')
  eq(summary.firstServiceDate, '2026-04-10', 'firstServiceDate')

  const noLogs = buildExpenseSummary({
    logs: [],
    items: [],
    currentOdometer: 5000,
    now,
  })
  eq(noLogs.lifetimeTotal, 0, 'empty lifetime')
  eq(noLogs.costPerKm, null, 'empty costPerKm (no divide by zero)')
  eq(noLogs.initialOdometer, 0, 'empty initialOdometer')
  eq(noLogs.serviceFeeRatio, 0, 'empty ratio')
  eq(noLogs.monthlyTrend.length, 6, 'empty trend length')
  eq(noLogs.averageMonthly, 0, 'empty average')

  const sameOdometer = buildExpenseSummary({
    logs: [{ service_date: '2026-09-01', odometer: 5000, total_cost: 50_000 }],
    items: [],
    currentOdometer: 5000,
    now,
  })
  eq(sameOdometer.trackedKm, 0, 'zero tracked km')
  eq(sameOdometer.costPerKm, null, 'zero tracked costPerKm')

  console.log('analytics self-check passed')
}

const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv?.[1] != null &&
  /analytics\.[cm]?ts$/.test(process.argv[1])

if (isDirectRun) runSelfCheck()
