'use server'

import { getFuelPrices, type FuelPriceResult } from '@/lib/fuel-price'

export async function fetchFuelPrices(
  latitude: number,
  longitude: number,
): Promise<FuelPriceResult> {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return { province: null, prices: [], updatedAt: null }
  }
  return getFuelPrices({ lat: latitude, lon: longitude })
}
