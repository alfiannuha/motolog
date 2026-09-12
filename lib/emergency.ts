import type { BatteryLog, TireLog } from '@/types'

export type EmergencyStatus = 'critical' | 'warning' | 'healthy'

export interface TireReading {
  frontPsi: number
  rearPsi: number
  treadCondition: string | null
}

export interface TireAssessment {
  status: EmergencyStatus
  issues: string[]
}

export interface BatteryReading {
  voltage: number | null
  condition: string | null
}

export interface BatteryAssessment {
  status: EmergencyStatus
  label: string
}

// Recommended cold pressure (psi) per axle. Real bikes vary with load and tire
// size, so this is a guide, not gospel; owners can eyeball ±few psi.
const RECOMMENDED_PSI: Record<'motorcycle' | 'car', { front: number; rear: number }> = {
  motorcycle: { front: 29, rear: 33 },
  car: { front: 32, rear: 32 },
}

const TREAD_SEVERITY: Record<string, EmergencyStatus> = {
  good: 'healthy',
  worn: 'warning',
  critical: 'critical',
}

const SEVERITY_RANK: Record<EmergencyStatus, number> = {
  critical: 0,
  warning: 1,
  healthy: 2,
}

function worse(a: EmergencyStatus, b: EmergencyStatus): EmergencyStatus {
  return SEVERITY_RANK[a] <= SEVERITY_RANK[b] ? a : b
}

function pressureStatus(psi: number, recommended: number): EmergencyStatus {
  const delta = Math.abs(psi - recommended)
  if (delta > 5) return 'critical'
  if (delta > 2) return 'warning'
  return 'healthy'
}

export function assessTires(
  reading: TireReading,
  vehicleType: 'motorcycle' | 'car',
): TireAssessment {
  const target = RECOMMENDED_PSI[vehicleType]
  const issues: string[] = []

  let status = worse(
    pressureStatus(reading.frontPsi, target.front),
    pressureStatus(reading.rearPsi, target.rear),
  )

  if (pressureStatus(reading.frontPsi, target.front) !== 'healthy') {
    issues.push(
      `Ban depan ${reading.frontPsi} psi (anjuran ${target.front} psi)`,
    )
  }
  if (pressureStatus(reading.rearPsi, target.rear) !== 'healthy') {
    issues.push(`Ban belakang ${reading.rearPsi} psi (anjuran ${target.rear} psi)`)
  }

  const tread = TREAD_SEVERITY[reading.treadCondition ?? 'good'] ?? 'healthy'
  if (tread !== 'healthy') {
    status = worse(status, tread)
    issues.push(
      tread === 'critical'
        ? 'Kembangan ban sudah kritis, segera ganti'
        : 'Kembangan ban sudah aus, pantau penggantian',
    )
  }

  return { status, issues }
}

// Resting voltage ~12.6V is a healthy lead-acid battery. Charging (engine
// running) should sit 13.5-14.4V; below means the alternator is weak.
export function assessBattery(
  reading: BatteryReading,
  engineRunning = false,
): BatteryAssessment {
  if (reading.condition === 'replace') {
    return { status: 'critical', label: 'Aki lemah / harus diganti' }
  }
  if (reading.condition === 'weak') {
    return { status: 'warning', label: 'Aki mulai lemah' }
  }

  const { voltage } = reading
  if (voltage == null) {
    return { status: 'healthy', label: 'Belum ada data tegangan' }
  }

  if (engineRunning) {
    if (voltage >= 13.5 && voltage <= 14.6) {
      return { status: 'healthy', label: 'Pengisian normal' }
    }
    if (voltage < 13.5) {
      return { status: 'warning', label: 'Pengisian lemah (cek alternator)' }
    }
    return { status: 'warning', label: 'Tegangan pengisian tinggi' }
  }

  if (voltage >= 12.6) return { status: 'healthy', label: 'Aki sehat' }
  if (voltage >= 12.2) return { status: 'warning', label: 'Aki mulai lemah' }
  return { status: 'critical', label: 'Aki lemah, siapkan ganti' }
}

export function latestByDate<T extends { log_date?: string; check_date?: string }>(
  logs: T[],
): T | null {
  if (logs.length === 0) return null
  return [...logs].sort((a, b) => {
    const dateA = a.log_date ?? a.check_date ?? ''
    const dateB = b.log_date ?? b.check_date ?? ''
    return dateB.localeCompare(dateA)
  })[0]
}

export function summarizeEmergency(
  tires: TireLog[],
  batteries: BatteryLog[],
  vehicleType: 'motorcycle' | 'car',
): { tire: TireAssessment | null; battery: BatteryAssessment | null } {
  const lastTire = latestByDate(tires)
  const lastBattery = latestByDate(batteries)

  return {
    tire: lastTire
      ? assessTires(
          {
            frontPsi: Number(lastTire.front_psi),
            rearPsi: Number(lastTire.rear_psi),
            treadCondition: lastTire.tread_condition,
          },
          vehicleType,
        )
      : null,
    battery: lastBattery
      ? assessBattery({
          voltage: lastBattery.voltage == null ? null : Number(lastBattery.voltage),
          condition: lastBattery.condition,
        })
      : null,
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

  eq(
    assessTires({ frontPsi: 29, rearPsi: 33, treadCondition: 'good' }, 'motorcycle')
      .status,
    'healthy',
    'tire healthy',
  )
  eq(
    assessTires({ frontPsi: 23, rearPsi: 33, treadCondition: 'good' }, 'motorcycle')
      .status,
    'critical',
    'front under-inflated',
  )
  eq(
    assessTires({ frontPsi: 26, rearPsi: 33, treadCondition: 'good' }, 'motorcycle')
      .status,
    'warning',
    'front slightly low',
  )
  eq(
    assessTires({ frontPsi: 29, rearPsi: 33, treadCondition: 'worn' }, 'motorcycle')
      .issues.length,
    1,
    'worn tread flagged',
  )
  eq(
    assessTires({ frontPsi: 29, rearPsi: 33, treadCondition: 'critical' }, 'car')
      .status,
    'critical',
    'critical tread overrides pressure',
  )

  eq(assessBattery({ voltage: 12.7, condition: 'healthy' }).status, 'healthy', 'batt healthy')
  eq(assessBattery({ voltage: 12.3, condition: null }).status, 'warning', 'batt weak')
  eq(assessBattery({ voltage: 12.0, condition: null }).status, 'critical', 'batt replace')
  eq(
    assessBattery({ voltage: 14.1, condition: null }, true).status,
    'healthy',
    'charging normal',
  )
  eq(
    assessBattery({ voltage: 12.9, condition: null }, true).status,
    'warning',
    'charging weak',
  )
  eq(assessBattery({ voltage: null, condition: null }).status, 'healthy', 'no voltage')

  console.log('emergency self-check passed')
}

const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv?.[1] != null &&
  /emergency\.[cm]?ts$/.test(process.argv[1])

if (isDirectRun) runSelfCheck()
