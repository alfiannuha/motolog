import type { NextRequest } from 'next/server'

import { getVehicleAnalyticsReport } from '@/actions/analytics-report'
import { renderAnalyticsReportPdf } from '@/components/analytics/analytics-report-document'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const report = await getVehicleAnalyticsReport(id)
  if (!report) {
    return Response.json({ error: 'Kendaraan tidak ditemukan' }, { status: 404 })
  }

  const pdf = await renderAnalyticsReportPdf(report)
  const safePlate = report.vehicle.license_plate
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const stamp = report.generatedAt.slice(0, 10)
  const filename = `audit-report-${safePlate || 'vehicle'}-${stamp}.pdf`

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
