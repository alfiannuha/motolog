import { Bike, Car } from 'lucide-react'

import type { TransmissionType, VehicleType } from '@/types'

export type VehicleKind = {
  label: string
  icon: typeof Bike
  transmission: TransmissionType | null
}

export function vehicleKind(
  vehicleType: VehicleType,
  transmission: TransmissionType | null | undefined,
): VehicleKind {
  if (vehicleType === 'car') {
    return { label: 'Mobil', icon: Car, transmission: null }
  }

  if (transmission === 'manual') {
    return { label: 'Motor Bebek / Gigi', icon: Bike, transmission: 'manual' }
  }

  return { label: 'Motor Matic', icon: Bike, transmission: 'matic' }
}
