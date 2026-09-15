export type FuelPrice = { product: string; price: number }

export type FuelPriceResult = {
  province: string | null
  prices: FuelPrice[]
  updatedAt: string | null
}

const SOURCE = 'https://api.web.mypertamina.id/price'

type RawProvince = {
  province: string
  list_price: { product: string; price: string; updatedDate: string }[]
}

export function parsePrice(value: string): number {
  const digits = value.replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

export const stripProvince = (value: string) =>
  value
    .toLowerCase()
    .replace(/daerah istimewa|daerah khusus ibukota|prov\.?|\bdi\b|\bdki\b/g, '')
    .replace(/[^a-z]/g, '')

export function matchProvince(
  locationLabel: string,
  provinces: string[],
): string | null {
  const haystack = stripProvince(locationLabel)
  const ranked = [...provinces].sort(
    (a, b) => stripProvince(b).length - stripProvince(a).length,
  )
  return ranked.find((province) => haystack.includes(stripProvince(province))) ?? null
}

const EMPTY: FuelPriceResult = { province: null, prices: [], updatedAt: null }

export async function getFuelPrices(location?: {
  lat: number
  lon: number
}): Promise<FuelPriceResult> {
  try {
    const response = await fetch(`${SOURCE}?limit=100&page=1`, {
      next: { revalidate: 21_600 },
    })
    if (!response.ok) return EMPTY

    const json = (await response.json()) as { data?: { data?: RawProvince[] } }
    const provinces = json.data?.data ?? []
    if (provinces.length === 0) return EMPTY

    // Without coordinates we cannot know the province, and MyPertamina has no
    // nationwide price. Caller falls back to local estimates instead.
    if (!location) return EMPTY

    const geo = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lon}&format=jsonv2&accept-language=id`,
      {
        headers: { 'User-Agent': 'motolog/0.1 (vehicle maintenance app)' },
        cache: 'no-store',
      },
    )
    if (!geo.ok) return EMPTY

    const place = (await geo.json()) as { display_name?: string }
    const province = matchProvince(
      place.display_name ?? '',
      provinces.map((item) => item.province),
    )
    const selected = provinces.find((item) => item.province === province)
    if (!selected) return EMPTY

    const prices = selected.list_price
      .map((item) => ({ product: item.product, price: parsePrice(item.price) }))
      .filter((item) => item.price > 0)

    return {
      province: selected.province,
      prices,
      updatedAt: selected.list_price[0]?.updatedDate ?? null,
    }
  } catch {
    return EMPTY
  }
}

function runSelfCheck() {
  const provinces = [
    'Prov. DKI Jakarta',
    'Prov. DI Yogyakarta',
    'Prov. Jawa Barat',
    'Prov. Riau',
    'Prov. Kepulauan Riau',
    'Prov. Bangka-Belitung',
    'Prov. Papua Barat',
    'Prov. Papua Barat Daya',
  ]
  const cases: [string, string | null][] = [
    ['Jakarta Selatan, Daerah Khusus Ibukota Jakarta, Indonesia', 'Prov. DKI Jakarta'],
    ['Kota Yogyakarta, Daerah Istimewa Yogyakarta, Indonesia', 'Prov. DI Yogyakarta'],
    ['Bandung, Jawa Barat, Indonesia', 'Prov. Jawa Barat'],
    ['Pekanbaru, Riau, Indonesia', 'Prov. Riau'],
    ['Batam, Kepulauan Riau, Indonesia', 'Prov. Kepulauan Riau'],
    ['Pangkal Pinang, Kepulauan Bangka Belitung, Indonesia', 'Prov. Bangka-Belitung'],
    ['Sorong, Papua Barat Daya, Indonesia', 'Prov. Papua Barat Daya'],
    ['Somewhere, Narnia', null],
  ]
  for (const [label, expected] of cases) {
    const actual = matchProvince(label, provinces)
    if (actual !== expected) {
      throw new Error(`matchProvince(${label}): expected ${expected}, got ${actual}`)
    }
  }
  if (parsePrice('Rp 10.000') !== 10000) throw new Error('parsePrice plain')
  if (parsePrice('16300') !== 16300) throw new Error('parsePrice numeric')
  if (parsePrice('0') !== 0) throw new Error('parsePrice zero')
  console.log('fuel-price self-check passed')
}

const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv?.[1] != null &&
  /fuel-price\.[cm]?ts$/.test(process.argv[1])

if (isDirectRun) runSelfCheck()
