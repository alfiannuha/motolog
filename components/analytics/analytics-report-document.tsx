import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer'

import type { AnalyticsReport } from '@/actions/analytics-report'
import { vehicleKind } from '@/lib/vehicle-kind'
import type { HealthStatus } from '@/types'

const COLORS = {
  ink: '#18181b',
  muted: '#71717a',
  line: '#e4e4e7',
  head: '#f4f4f5',
  dark: '#09090b',
  part: '#18181b',
  labor: '#f59e0b',
  bar: '#3f3f46',
  good: '#15803d',
  due: '#b45309',
  overdue: '#b91c1c',
}

const STATUS: Record<HealthStatus, { label: string; color: string }> = {
  healthy: { label: 'Good', color: COLORS.good },
  warning: { label: 'Due Soon', color: COLORS.due },
  critical: { label: 'Overdue', color: COLORS.overdue },
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingHorizontal: 30,
    paddingBottom: 60,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: COLORS.ink,
  },
  header: { backgroundColor: COLORS.dark, color: '#fafafa', padding: 16, borderRadius: 6 },
  brand: { fontSize: 8, letterSpacing: 2, color: '#a1a1aa' },
  title: { fontSize: 15, fontFamily: 'Helvetica-Bold', letterSpacing: 0.6, marginTop: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  headerMeta: { fontSize: 8, color: '#d4d4d8', marginTop: 2 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginTop: 18,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  kpiRow: { flexDirection: 'row', gap: 8 },
  kpi: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 5,
    padding: 9,
  },
  kpiLabel: {
    fontSize: 6.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.muted,
  },
  kpiValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 5 },
  kpiHint: { fontSize: 6.5, color: COLORS.muted, marginTop: 2 },
  headRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.head,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: COLORS.line,
  },
  cell: { paddingVertical: 5, paddingHorizontal: 5, fontSize: 8 },
  headCell: {
    paddingVertical: 5,
    paddingHorizontal: 5,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  right: { textAlign: 'right' },
  barTrack: {
    flex: 1,
    height: 11,
    flexDirection: 'row',
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: COLORS.head,
  },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4, fontSize: 8 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2.5 },
  monthLabel: { width: 34, fontSize: 8, color: COLORS.muted },
  monthBar: { height: 9, borderRadius: 2, backgroundColor: COLORS.bar },
  monthValue: { width: 84, fontSize: 8, textAlign: 'right' },
  badge: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 8,
    backgroundColor: COLORS.head,
  },
  emptyBox: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderStyle: 'dashed',
    borderRadius: 4,
    padding: 12,
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: COLORS.muted,
  },
  footerCol: { maxWidth: '40%' },
  footerStrong: { fontFamily: 'Helvetica-Bold', color: COLORS.ink },
})

function rupiah(value: number): string {
  return `Rp${Math.round(value).toLocaleString('id-ID')}`
}

function formatDate(value: string | null): string {
  if (!value) return '-'
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function number(value: number | null, suffix = '', digits = 0): string {
  if (value == null) return '-'
  return `${value.toLocaleString('id-ID', { maximumFractionDigits: digits })}${suffix}`
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiHint}>{hint}</Text>
    </View>
  )
}

function MonthlyBars({ report }: { report: AnalyticsReport }) {
  const trend = report.expense.monthlyTrend
  const max = Math.max(...trend.map((point) => point.total), 1)

  return (
    <View>
      {trend.map((point) => {
        const width = Math.round((point.total / max) * 62)
        return (
          <View key={point.key} style={styles.monthRow}>
            <Text style={styles.monthLabel}>{point.month}</Text>
            <View style={[styles.monthBar, { width: `${Math.max(width, 1)}%` }]} />
            <Text style={styles.monthValue}>{rupiah(point.total)}</Text>
          </View>
        )
      })}
    </View>
  )
}

function CriticalTable({ report }: { report: AnalyticsReport }) {
  if (report.criticalParts.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text>Semua komponen dalam kondisi aman.</Text>
      </View>
    )
  }

  return (
    <View>
      <View style={styles.headRow}>
        <Text style={[styles.headCell, { flex: 2 }]}>Komponen</Text>
        <Text style={[styles.headCell, { flex: 1.6 }]}>Sisa Pakai</Text>
        <Text style={[styles.headCell, { flex: 1 }]}>Status</Text>
        <Text style={[styles.headCell, styles.right, { flex: 1.4 }]}>
          Estimasi Biaya
        </Text>
      </View>
      {report.criticalParts.map((part) => {
        const meta = STATUS[part.status]
        const remaining =
          part.remainingKm != null
            ? part.remainingKm >= 0
              ? `${part.remainingKm.toLocaleString('id-ID')} km`
              : `lewat ${Math.abs(part.remainingKm).toLocaleString('id-ID')} km`
            : part.remainingDays != null
              ? part.remainingDays >= 0
                ? `${part.remainingDays} hari`
                : `lewat ${Math.abs(part.remainingDays)} hari`
              : '-'

        return (
          <View key={part.partName} style={styles.row} wrap={false}>
            <Text style={[styles.cell, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>
              {part.partName}
            </Text>
            <Text style={[styles.cell, { flex: 1.6 }]}>{remaining}</Text>
            <View style={[styles.cell, { flex: 1 }]}>
              <Text style={[styles.badge, { color: meta.color }]}>{meta.label}</Text>
            </View>
            <Text style={[styles.cell, styles.right, { flex: 1.4 }]}>
              {part.projectedCost > 0 ? rupiah(part.projectedCost) : '-'}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

export function AnalyticsReportDocument({ report }: { report: AnalyticsReport }) {
  const { vehicle, expense } = report
  const kind = vehicleKind(vehicle.vehicle_type, vehicle.transmission_type)
  const categorized = expense.partTotal + expense.serviceFeeTotal
  const partPct = categorized > 0 ? Math.round((expense.partTotal / categorized) * 100) : 0
  const laborPct = categorized > 0 ? 100 - partPct : 0
  const generated = formatDate(report.generatedAt)
  const periodStart = formatDate(report.periodStart)

  return (
    <Document
      title={`Vehicle Audit Report - ${vehicle.name}`}
      author="MotoLog"
      subject="Vehicle Health & Expense Audit Report"
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.brand}>MOTOLOG · VEHICLE HEALTH TRACKER</Text>
          <Text style={styles.title}>VEHICLE HEALTH & EXPENSE AUDIT REPORT</Text>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerMeta}>
                {vehicle.name} · {vehicle.license_plate}
              </Text>
              <Text style={styles.headerMeta}>
                {kind.label} · {vehicle.manufacture_year ?? '-'}
              </Text>
            </View>
            <View>
              <Text style={styles.headerMeta}>Dibuat: {generated}</Text>
              <Text style={styles.headerMeta}>
                Periode: {periodStart} — {generated}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>1. Key Performance Indicators</Text>
        <View style={styles.kpiRow}>
          <Kpi
            label="Total Spend"
            value={rupiah(report.combinedSpend)}
            hint={`Servis ${rupiah(report.maintenanceSpend)} + BBM ${rupiah(report.fuelSpend)}`}
          />
          <Kpi
            label="Cost / KM"
            value={report.costPerKm != null ? rupiah(report.costPerKm) : '-'}
            hint={`dari ${number(report.totalKm, ' km')} terlacak`}
          />
          <Kpi
            label="Rata-rata / Bulan"
            value={rupiah(report.averageMonthly)}
            hint={`${number(report.ownershipMonths, ' bulan', 1)} kepemilikan`}
          />
          <Kpi
            label="Lifetime KM/L"
            value={number(report.fuel?.averageKmPerLiter ?? null, ' km/L', 1)}
            hint={`${number(report.fuel?.totalLiters ?? 0, ' L', 1)} BBM terpakai`}
          />
        </View>

        <Text style={styles.sectionTitle}>2. Cost Distribution & Trends</Text>
        {categorized > 0 ? (
          <>
            <View style={styles.barTrack}>
              <View style={{ width: `${partPct}%`, backgroundColor: COLORS.part }} />
              <View style={{ width: `${laborPct}%`, backgroundColor: COLORS.labor }} />
            </View>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: COLORS.part }]} />
                <Text>
                  Spare Parts · {rupiah(expense.partTotal)} ({partPct}%)
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: COLORS.labor }]} />
                <Text>
                  Jasa · {rupiah(expense.serviceFeeTotal)} ({laborPct}%)
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyBox}>
            <Text>Belum ada rincian item servis.</Text>
          </View>
        )}

        <Text style={[styles.headCell, { marginTop: 10, paddingLeft: 0 }]}>
          Pengeluaran Servis Bulanan (12 bulan terakhir)
        </Text>
        <MonthlyBars report={report} />

        <Text style={styles.sectionTitle}>
          3. Top {report.topSessions.length} Sesi Servis Termahal
        </Text>
        {report.topSessions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text>Belum ada riwayat servis.</Text>
          </View>
        ) : (
          <View>
            <View style={styles.headRow}>
              <Text style={[styles.headCell, { flex: 1.1 }]}>Tanggal</Text>
              <Text style={[styles.headCell, { flex: 1 }]}>Odometer</Text>
              <Text style={[styles.headCell, { flex: 1.6 }]}>Bengkel</Text>
              <Text style={[styles.headCell, { flex: 3 }]}>Item</Text>
              <Text style={[styles.headCell, styles.right, { flex: 1.4 }]}>Total</Text>
            </View>
            {report.topSessions.map((session) => (
              <View key={`${session.serviceDate}-${session.odometer}`} style={styles.row} wrap={false}>
                <Text style={[styles.cell, { flex: 1.1, fontFamily: 'Helvetica-Bold' }]}>
                  {formatDate(session.serviceDate)}
                </Text>
                <Text style={[styles.cell, { flex: 1 }]}>
                  {session.odometer.toLocaleString('id-ID')} km
                </Text>
                <Text style={[styles.cell, { flex: 1.6 }]}>
                  {session.workshopName ?? 'Mandiri'}
                </Text>
                <Text style={[styles.cell, { flex: 3 }]}>{session.description || '-'}</Text>
                <Text style={[styles.cell, styles.right, { flex: 1.4, fontFamily: 'Helvetica-Bold' }]}>
                  {rupiah(session.totalCost)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>4. Komponen Perlu Perhatian</Text>
        <CriticalTable report={report} />

        <View style={styles.footer} fixed>
          <View style={styles.footerCol}>
            <Text>
              Laporan audit digital MotoLog. Angka dihitung dari catatan servis, BBM, dan
              odometer pengguna.
            </Text>
          </View>
          <View style={styles.footerCol}>
            <Text>
              Total kepemilikan:{' '}
              <Text style={styles.footerStrong}>{rupiah(report.combinedSpend)}</Text>
            </Text>
          </View>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}

export function renderAnalyticsReportPdf(report: AnalyticsReport) {
  return renderToBuffer(<AnalyticsReportDocument report={report} />)
}
