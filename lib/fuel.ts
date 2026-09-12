export interface FuelLogInput {
  odometer: number
  liters: number
  total_cost: number
  is_full_tank: boolean
  log_date: string
}

export interface FuelSegment {
  date: string
  odometer: number
  distance: number
  liters: number
  kmPerLiter: number
}

export interface FuelStats {
  entries: number
  totalLiters: number
  totalCost: number
  trackedKm: number
  segments: FuelSegment[]
  averageKmPerLiter: number | null
  lastKmPerLiter: number | null
  bestKmPerLiter: number | null
  worstKmPerLiter: number | null
  costPerKm: number | null
}

const round2 = (value: number) => Math.round(value * 100) / 100

export function buildFuelStats(logs: FuelLogInput[]): FuelStats {
  const sorted = [...logs].sort(
    (a, b) => a.odometer - b.odometer || a.log_date.localeCompare(b.log_date),
  )

  const totalLiters = round2(sorted.reduce((sum, log) => sum + log.liters, 0))
  const totalCost = round2(sorted.reduce((sum, log) => sum + log.total_cost, 0))

  const trackedKm =
    sorted.length >= 2
      ? sorted[sorted.length - 1].odometer - sorted[0].odometer
      : 0
  const costPerKm = trackedKm > 0 ? totalCost / trackedKm : null

  // Full-to-full method: fuel consumed between two full tanks is every liter
  // added after the first full tank, measured against the distance covered.
  const segments: FuelSegment[] = []
  let lastFull: FuelLogInput | null = null
  let litersSinceFull = 0

  for (const log of sorted) {
    if (!lastFull) {
      if (log.is_full_tank) lastFull = log
      continue
    }

    litersSinceFull += log.liters
    if (!log.is_full_tank) continue

    const distance = log.odometer - lastFull.odometer
    if (distance > 0 && litersSinceFull > 0) {
      segments.push({
        date: log.log_date,
        odometer: log.odometer,
        distance,
        liters: round2(litersSinceFull),
        kmPerLiter: round2(distance / litersSinceFull),
      })
    }

    lastFull = log
    litersSinceFull = 0
  }

  const segmentDistance = segments.reduce((sum, item) => sum + item.distance, 0)
  const segmentLiters = segments.reduce((sum, item) => sum + item.liters, 0)
  const ratios = segments.map((item) => item.kmPerLiter)

  return {
    entries: sorted.length,
    totalLiters,
    totalCost,
    trackedKm,
    segments,
    averageKmPerLiter:
      segmentLiters > 0 ? round2(segmentDistance / segmentLiters) : null,
    lastKmPerLiter: ratios.length ? ratios[ratios.length - 1] : null,
    bestKmPerLiter: ratios.length ? Math.max(...ratios) : null,
    worstKmPerLiter: ratios.length ? Math.min(...ratios) : null,
    costPerKm,
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

  const log = (
    odometer: number,
    liters: number,
    isFull: boolean,
    log_date: string,
  ): FuelLogInput => ({
    odometer,
    liters,
    total_cost: liters * 10_000,
    is_full_tank: isFull,
    log_date,
  })

  const logs = [
    log(1000, 5, true, '2026-01-01'),
    log(1300, 2, false, '2026-01-10'),
    log(1500, 4, true, '2026-01-20'),
    log(1800, 5, true, '2026-02-01'),
  ]

  const stats = buildFuelStats(logs)
  eq(stats.entries, 4, 'entries')
  eq(stats.totalLiters, 16, 'totalLiters')
  eq(stats.totalCost, 160_000, 'totalCost')
  eq(stats.trackedKm, 800, 'trackedKm')
  eq(stats.costPerKm, 200, 'costPerKm')
  eq(stats.segments.length, 2, 'segment count')
  eq(stats.segments[0].liters, 6, 'segment 1 liters includes partial')
  eq(stats.segments[0].kmPerLiter, round2(500 / 6), 'segment 1 km/L')
  eq(stats.segments[1].kmPerLiter, 60, 'segment 2 km/L')
  eq(stats.averageKmPerLiter, round2(800 / 11), 'weighted average')
  eq(stats.lastKmPerLiter, 60, 'last')
  eq(stats.bestKmPerLiter, round2(500 / 6), 'best')
  eq(stats.worstKmPerLiter, 60, 'worst')

  const empty = buildFuelStats([])
  eq(empty.entries, 0, 'empty entries')
  eq(empty.averageKmPerLiter, null, 'empty average (no divide by zero)')
  eq(empty.costPerKm, null, 'empty costPerKm')
  eq(empty.bestKmPerLiter, null, 'empty best')

  const single = buildFuelStats([log(1000, 5, true, '2026-01-01')])
  eq(single.averageKmPerLiter, null, 'single cannot measure')
  eq(single.trackedKm, 0, 'single trackedKm')
  eq(single.costPerKm, null, 'single costPerKm')

  const partials = buildFuelStats([
    log(1000, 5, true, '2026-01-01'),
    log(1100, 2, false, '2026-01-05'),
    log(1200, 2, false, '2026-01-12'),
  ])
  eq(partials.segments.length, 0, 'no segment without second full tank')

  const nonIncreasing = buildFuelStats([
    log(1000, 5, true, '2026-01-01'),
    log(1000, 5, true, '2026-01-02'),
  ])
  eq(nonIncreasing.segments.length, 0, 'zero distance ignored')
  eq(nonIncreasing.costPerKm, null, 'zero trackedKm guarded')

  console.log('fuel self-check passed')
}

const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv?.[1] != null &&
  /fuel\.[cm]?ts$/.test(process.argv[1])

if (isDirectRun) runSelfCheck()
