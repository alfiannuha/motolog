import type { HealthStatus } from '@/lib/maintenance-health'

const DAY_MS = 86_400_000
const LEGAL_WARNING_DAYS = 30
const MIN_SPAN_DAYS = 7

export interface OdometerReading {
  date: string
  odometer: number
}

export interface LegalStatus {
  daysRemaining: number
  status: HealthStatus
}

export function daysUntil(date: string, now: Date = new Date()): number {
  const [year, month, day] = date.slice(0, 10).split('-').map(Number)
  const target = Date.UTC(year, month - 1, day)
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.ceil((target - today) / DAY_MS)
}

export function getLegalStatus(
  dueDate: string | null | undefined,
  now: Date = new Date(),
  warningDays = LEGAL_WARNING_DAYS,
): LegalStatus | null {
  if (!dueDate) return null

  const daysRemaining = daysUntil(dueDate, now)
  const status: HealthStatus =
    daysRemaining <= 0 ? 'critical' : daysRemaining <= warningDays ? 'warning' : 'healthy'

  return { daysRemaining, status }
}

// Average km/day over all available odometer readings. Needs at least two
// readings spanning MIN_SPAN_DAYS to beat the fallback estimate.
export function estimateDailyKm(
  readings: OdometerReading[],
  fallback = 20,
  minSpanDays = MIN_SPAN_DAYS,
): number {
  const sorted = [...readings]
    .map((item) => ({
      date: Date.parse(`${item.date.slice(0, 10)}T00:00:00Z`),
      odometer: item.odometer,
    }))
    .filter((item) => Number.isFinite(item.date))
    .sort((a, b) => a.date - b.date)

  if (sorted.length < 2) return fallback

  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const spanDays = (last.date - first.date) / DAY_MS
  const distance = last.odometer - first.odometer

  if (spanDays < minSpanDays || distance <= 0) return fallback

  return distance / spanDays
}

export interface PartForecastInput {
  remainingKm: number | null
  remainingDays: number | null
}

export interface PartForecast {
  dailyKm: number
  dueDate: string | null
  daysUntilDue: number | null
  limitingFactor: 'km' | 'time' | null
}

function addDays(from: Date, days: number): string {
  const base = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  return new Date(base + days * DAY_MS).toISOString().slice(0, 10)
}

export function forecastPart(
  part: PartForecastInput,
  dailyKm: number,
  now: Date = new Date(),
): PartForecast {
  const daysFromKm =
    part.remainingKm != null && dailyKm > 0
      ? Math.floor(part.remainingKm / dailyKm)
      : null
  const daysFromTime = part.remainingDays

  const candidates: { days: number; factor: 'km' | 'time' }[] = []
  if (daysFromKm != null) candidates.push({ days: daysFromKm, factor: 'km' })
  if (daysFromTime != null) candidates.push({ days: daysFromTime, factor: 'time' })

  if (candidates.length === 0) {
    return { dailyKm, dueDate: null, daysUntilDue: null, limitingFactor: null }
  }

  const next = candidates.reduce((min, item) => (item.days < min.days ? item : min))

  return {
    dailyKm,
    dueDate: addDays(now, next.days),
    daysUntilDue: next.days,
    limitingFactor: next.factor,
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

  const now = new Date('2026-09-11T00:00:00Z')

  eq(daysUntil('2026-09-21', now), 10, 'daysUntil forward')
  eq(daysUntil('2026-09-01', now), -10, 'daysUntil past')
  eq(daysUntil('2026-09-11', now), 0, 'daysUntil today')

  eq(getLegalStatus(null, now), null, 'no due date')
  eq(getLegalStatus('2026-12-01', now)?.status, 'healthy', 'legal healthy')
  eq(getLegalStatus('2026-10-01', now)?.status, 'warning', 'legal within 30d')
  eq(getLegalStatus('2026-09-11', now)?.status, 'critical', 'legal due today')
  eq(getLegalStatus('2026-01-01', now)?.status, 'critical', 'legal overdue')

  eq(estimateDailyKm([], 20), 20, 'empty fallback')
  eq(
    estimateDailyKm([{ date: '2026-09-01', odometer: 1000 }], 20),
    20,
    'single reading fallback',
  )
  eq(
    estimateDailyKm(
      [
        { date: '2026-09-01', odometer: 1000 },
        { date: '2026-09-11', odometer: 1300 },
      ],
      20,
    ),
    30,
    'estimated 30 km/day',
  )
  eq(
    estimateDailyKm(
      [
        { date: '2026-09-01', odometer: 1000 },
        { date: '2026-09-03', odometer: 1600 },
      ],
      20,
    ),
    20,
    'short span falls back',
  )
  eq(
    estimateDailyKm(
      [
        { date: '2026-09-11', odometer: 1300 },
        { date: '2026-09-01', odometer: 1000 },
      ],
      20,
    ),
    30,
    'unsorted readings handled',
  )

  const byKm = forecastPart({ remainingKm: 300, remainingDays: null }, 30, now)
  eq(byKm.daysUntilDue, 10, 'km forecast days')
  eq(byKm.dueDate, '2026-09-21', 'km forecast date')
  eq(byKm.limitingFactor, 'km', 'km limiting factor')

  const byTime = forecastPart({ remainingKm: 5000, remainingDays: 5 }, 30, now)
  eq(byTime.limitingFactor, 'time', 'time wins when sooner')
  eq(byTime.daysUntilDue, 5, 'time forecast days')

  const overdue = forecastPart({ remainingKm: -30, remainingDays: null }, 30, now)
  eq(overdue.daysUntilDue, -1, 'overdue km negative days')

  const none = forecastPart({ remainingKm: null, remainingDays: null }, 30, now)
  eq(none.dueDate, null, 'no forecast without constraints')

  const zeroSpeed = forecastPart({ remainingKm: 300, remainingDays: null }, 0, now)
  eq(zeroSpeed.dueDate, null, 'zero daily km cannot forecast km')

  console.log('prediction self-check passed')
}

const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv?.[1] != null &&
  /prediction\.[cm]?ts$/.test(process.argv[1])

if (isDirectRun) runSelfCheck()
