export type HealthStatus = 'critical' | 'warning' | 'healthy'

export interface HealthRuleInput {
  ruleId: string
  partName: string
  intervalKm: number | null
  intervalMonths: number | null
  lastServiceOdometer: number
  lastServiceDate: string
}

export interface PartStatus extends HealthRuleInput {
  status: HealthStatus
  remainingKm: number | null
  remainingDays: number | null
  percentageRemaining: number
}

const DAY_MS = 86_400_000
const WARNING_KM_RATIO = 0.15
const WARNING_DAYS = 14
const DAYS_PER_MONTH = 30

const SEVERITY: Record<HealthStatus, number> = {
  critical: 0,
  warning: 1,
  healthy: 2,
}

function parseDateOnly(value: string): number {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

function todayUtc(now: Date): number {
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
}

function addMonths(fromMs: number, months: number): number {
  const date = new Date(fromMs)
  const originalDay = date.getUTCDate()
  date.setUTCMonth(date.getUTCMonth() + months)
  if (date.getUTCDate() < originalDay) date.setUTCDate(0)
  return date.getTime()
}

export function calculatePartStatus(
  rule: HealthRuleInput,
  currentOdometer: number,
  now: Date = new Date(),
): PartStatus {
  const remainingKm =
    rule.intervalKm == null
      ? null
      : rule.lastServiceOdometer + rule.intervalKm - currentOdometer

  const remainingDays =
    rule.intervalMonths == null
      ? null
      : Math.ceil(
          (addMonths(parseDateOnly(rule.lastServiceDate), rule.intervalMonths) -
            todayUtc(now)) /
            DAY_MS,
        )

  const isCritical =
    (remainingKm != null && remainingKm <= 0) ||
    (remainingDays != null && remainingDays <= 0)

  const isWarning =
    (remainingKm != null &&
      rule.intervalKm != null &&
      remainingKm <= rule.intervalKm * WARNING_KM_RATIO) ||
    (remainingDays != null && remainingDays <= WARNING_DAYS)

  const status: HealthStatus = isCritical
    ? 'critical'
    : isWarning
      ? 'warning'
      : 'healthy'

  const ratios: number[] = []
  if (remainingKm != null && rule.intervalKm) {
    ratios.push(remainingKm / rule.intervalKm)
  }
  if (remainingDays != null && rule.intervalMonths) {
    ratios.push(remainingDays / (rule.intervalMonths * DAYS_PER_MONTH))
  }

  const percentageRemaining =
    ratios.length === 0
      ? 100
      : Math.max(0, Math.min(100, Math.round(Math.min(...ratios) * 100)))

  return { ...rule, status, remainingKm, remainingDays, percentageRemaining }
}

export function sortByUrgency(parts: PartStatus[]): PartStatus[] {
  return [...parts].sort(
    (a, b) =>
      SEVERITY[a.status] - SEVERITY[b.status] ||
      a.percentageRemaining - b.percentageRemaining,
  )
}

function runSelfCheck() {
  const eq = (actual: unknown, expected: unknown, label: string) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
      )
    }
  }

  const now = new Date('2026-09-11T00:00:00Z')
  const base = {
    ruleId: 'r1',
    partName: 'Oli Mesin',
    intervalKm: 2000,
    intervalMonths: 2,
    lastServiceOdometer: 1000,
    lastServiceDate: '2026-09-11',
  }

  eq(calculatePartStatus(base, 1500, now).status, 'healthy', 'healthy')
  eq(calculatePartStatus(base, 1500, now).remainingKm, 1500, 'remainingKm')
  eq(calculatePartStatus(base, 1500, now).percentageRemaining, 75, 'percent')
  eq(calculatePartStatus(base, 2700, now).status, 'warning', 'warning at 15%')
  eq(calculatePartStatus(base, 3000, now).status, 'critical', 'critical km')
  eq(calculatePartStatus(base, 3500, now).percentageRemaining, 0, 'floor 0')

  const timeOnly = { ...base, intervalKm: null }
  eq(calculatePartStatus(timeOnly, 99999, now).remainingDays, 61, 'days 2mo')
  eq(calculatePartStatus(timeOnly, 99999, now).status, 'healthy', 'days healthy')
  eq(
    calculatePartStatus(
      { ...timeOnly, intervalMonths: 1, lastServiceDate: '2026-08-21' },
      0,
      now,
    ).status,
    'warning',
    'days warning',
  )
  eq(
    calculatePartStatus(
      { ...timeOnly, intervalMonths: 1, lastServiceDate: '2026-08-01' },
      0,
      now,
    ).status,
    'critical',
    'days critical',
  )

  eq(parseDateOnly('2026-01-31'), Date.UTC(2026, 0, 31), 'parse date')
  eq(
    new Date(addMonths(Date.UTC(2026, 0, 31), 1)).toISOString().slice(0, 10),
    '2026-02-28',
    'month clamp',
  )

  const sorted = sortByUrgency([
    calculatePartStatus(base, 1500, now),
    calculatePartStatus(base, 3500, now),
    calculatePartStatus(base, 2700, now),
  ])
  eq(sorted.map((p) => p.status), ['critical', 'warning', 'healthy'], 'sort')

  console.log('maintenance-health self-check passed')
}

const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv?.[1] != null &&
  /maintenance-health\.[cm]?ts$/.test(process.argv[1])

if (isDirectRun) runSelfCheck()
