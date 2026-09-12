import type { TransmissionType, VehicleType } from '@/types'

export type StandardRule = {
  partName: string
  intervalKm: number | null
  intervalMonths: number | null
}

export type RuleProfile = VehicleType | 'motorcycle_matic' | 'motorcycle_manual'

const MOTORCYCLE_MATIC: StandardRule[] = [
  { partName: 'Oli Mesin (JASO MB)', intervalKm: 2000, intervalMonths: 2 },
  { partName: 'Oli Gardan / Gear Oil', intervalKm: 8000, intervalMonths: 8 },
  { partName: 'V-Belt & Roller (CVT)', intervalKm: 24000, intervalMonths: 24 },
  { partName: 'Busi', intervalKm: 8000, intervalMonths: 8 },
  { partName: 'Filter Udara', intervalKm: 12000, intervalMonths: 12 },
  { partName: 'Kampas Rem', intervalKm: 10000, intervalMonths: 12 },
  { partName: 'Air Radiator / Coolant', intervalKm: 12000, intervalMonths: 12 },
]

const MOTORCYCLE_MANUAL: StandardRule[] = [
  { partName: 'Oli Mesin (JASO MA)', intervalKm: 3000, intervalMonths: 3 },
  { partName: 'Rantai & Gear Set (Drive Chain)', intervalKm: 15000, intervalMonths: 18 },
  { partName: 'Busi', intervalKm: 8000, intervalMonths: 8 },
  { partName: 'Filter Udara', intervalKm: 12000, intervalMonths: 12 },
  { partName: 'Kampas Rem & Minyak Rem', intervalKm: 12000, intervalMonths: 12 },
]

const CAR: StandardRule[] = [
  { partName: 'Oli Mesin & Filter Oli', intervalKm: 10000, intervalMonths: 6 },
  { partName: 'Filter Udara & Filter Kabin AC', intervalKm: 20000, intervalMonths: 12 },
  { partName: 'Busi', intervalKm: 20000, intervalMonths: 24 },
  { partName: 'Minyak Rem', intervalKm: 40000, intervalMonths: 24 },
  { partName: 'Rotasi Ban & Balancing', intervalKm: 10000, intervalMonths: 6 },
]

export function getRuleProfile(
  vehicleType: VehicleType,
  transmission: TransmissionType | null | undefined,
): RuleProfile {
  if (vehicleType === 'car') return 'car'
  return transmission === 'manual' ? 'motorcycle_manual' : 'motorcycle_matic'
}

export function getStandardRules(
  vehicleType: VehicleType,
  transmission: TransmissionType | null | undefined,
): StandardRule[] {
  switch (getRuleProfile(vehicleType, transmission)) {
    case 'car':
      return CAR
    case 'motorcycle_manual':
      return MOTORCYCLE_MANUAL
    default:
      return MOTORCYCLE_MATIC
  }
}
