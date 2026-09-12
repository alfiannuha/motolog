import type { NextRequest } from 'next/server'

import { getVehiclePassportData } from '@/actions/passport'
import { renderPassportPdf } from '@/components/vehicles/passport-document'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const data = await getVehiclePassportData(id)
  if (!data) {
    return Response.json({ error: 'Kendaraan tidak ditemukan' }, { status: 404 })
  }

  const pdf = await renderPassportPdf(data)
  const safePlate = data.vehicle.license_plate
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const stamp = data.generatedAt.slice(0, 10)
  const filename = `vehicle-passport-${safePlate || 'vehicle'}-${stamp}.pdf`

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
