import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer'

import type { VehiclePassport } from '@/actions/passport'
import { vehicleKind } from '@/lib/vehicle-kind'
import type { HealthStatus, PartStatus } from '@/types'

const COLORS = {
  ink: '#18181b',
  muted: '#71717a',
  line: '#e4e4e7',
  head: '#f4f4f5',
  dark: '#09090b',
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
    paddingBottom: 64,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: COLORS.ink,
  },
  header: {
    backgroundColor: COLORS.dark,
    color: '#fafafa',
    padding: 16,
    borderRadius: 6,
  },
  brand: { fontSize: 8, letterSpacing: 2, color: '#a1a1aa' },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  metaItem: { width: '33.33%', marginBottom: 8 },
  metaLabel: {
    fontSize: 6.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#a1a1aa',
  },
  metaValue: { fontSize: 10, marginTop: 2, fontFamily: 'Helvetica-Bold' },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginTop: 18,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
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
    letterSpacing: 0.5,
  },
  badge: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 8,
    backgroundColor: COLORS.head,
  },
  logDate: { fontFamily: 'Helvetica-Bold' },
  itemLine: { fontSize: 8, color: COLORS.ink },
  itemMeta: { fontSize: 7, color: COLORS.muted },
  totalCost: { fontFamily: 'Helvetica-Bold' },
  emptyBox: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderStyle: 'dashed',
    borderRadius: 4,
    padding: 14,
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
  footerCol: { maxWidth: '38%' },
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

function remainingText(part: PartStatus): string {
  const chunks: string[] = []
  if (part.remainingKm != null) {
    chunks.push(
      part.remainingKm >= 0
        ? `${part.remainingKm.toLocaleString('id-ID')} km`
        : `lewat ${Math.abs(part.remainingKm).toLocaleString('id-ID')} km`,
    )
  }
  if (part.remainingDays != null) {
    chunks.push(
      part.remainingDays >= 0
        ? `${part.remainingDays} hari`
        : `lewat ${Math.abs(part.remainingDays)} hari`,
    )
  }
  return chunks.length > 0 ? chunks.join(' / ') : '-'
}

function description(log: VehiclePassport['history'][number]): string {
  return log.maintenance_log_items
    .map((item) => `${item.item_name} (${rupiah(item.cost)})`)
    .join('\n')
}

function StatusTable({ parts }: { parts: PartStatus[] }) {
  if (parts.length === 0) {
    return <View style={styles.emptyBox}><Text>Belum ada komponen terdaftar.</Text></View>
  }

  return (
    <View>
      <View style={styles.headRow}>
        <Text style={[styles.headCell, { flex: 2 }]}>Komponen</Text>
        <Text style={[styles.headCell, { flex: 1.4 }]}>Servis Terakhir</Text>
        <Text style={[styles.headCell, { flex: 1 }]}>Odometer</Text>
        <Text style={[styles.headCell, { flex: 1.6 }]}>Sisa Pakai</Text>
        <Text style={[styles.headCell, { flex: 0.8 }]}>Wear</Text>
        <Text style={[styles.headCell, { flex: 1 }]}>Status</Text>
      </View>
      {parts.map((part) => {
        const meta = STATUS[part.status]
        const wear = Math.max(0, 100 - part.percentageRemaining)
        return (
          <View key={part.ruleId} style={styles.row} wrap={false}>
            <Text style={[styles.cell, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>
              {part.partName}
            </Text>
            <Text style={[styles.cell, { flex: 1.4 }]}>
              {formatDate(part.lastServiceDate)}
            </Text>
            <Text style={[styles.cell, { flex: 1 }]}>
              {part.lastServiceOdometer.toLocaleString('id-ID')} km
            </Text>
            <Text style={[styles.cell, { flex: 1.6 }]}>{remainingText(part)}</Text>
            <Text style={[styles.cell, { flex: 0.8 }]}>{wear}%</Text>
            <View style={[styles.cell, { flex: 1 }]}>
              <Text style={[styles.badge, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

function LogbookTable({ history }: { history: VehiclePassport['history'] }) {
  if (history.length === 0) {
    return <View style={styles.emptyBox}><Text>Belum ada riwayat servis.</Text></View>
  }

  return (
    <View>
      <View style={styles.headRow} wrap={false}>
        <Text style={[styles.headCell, { flex: 1.1 }]}>Tanggal</Text>
        <Text style={[styles.headCell, { flex: 1 }]}>Odometer</Text>
        <Text style={[styles.headCell, { flex: 1.4 }]}>Bengkel</Text>
        <Text style={[styles.headCell, { flex: 3 }]}>Deskripsi & Part</Text>
        <Text style={[styles.headCell, { flex: 1.3, textAlign: 'right' }]}>Total</Text>
      </View>
      {history.map((log) => (
        <View key={log.id} style={styles.row} wrap={false}>
          <Text style={[styles.cell, { flex: 1.1 }]}>
            <Text style={styles.logDate}>{formatDate(log.service_date)}</Text>
          </Text>
          <Text style={[styles.cell, { flex: 1 }]}>
            {log.odometer.toLocaleString('id-ID')} km
          </Text>
          <Text style={[styles.cell, { flex: 1.4 }]}>{log.workshop_name ?? 'Mandiri'}</Text>
          <View style={[styles.cell, { flex: 3 }]}>
            <Text style={styles.itemLine}>{description(log)}</Text>
            {log.notes ? <Text style={styles.itemMeta}>Catatan: {log.notes}</Text> : null}
          </View>
          <Text style={[styles.cell, styles.totalCost, { flex: 1.3, textAlign: 'right' }]}>
            {rupiah(log.total_cost)}
          </Text>
        </View>
      ))}
    </View>
  )
}

function EfficiencySection({ fuel }: { fuel: VehiclePassport['fuel'] }) {
  if (!fuel) return null

  const number = (value: number | null) =>
    value == null ? '-' : value.toLocaleString('id-ID')

  return (
    <>
      <Text style={styles.sectionTitle}>3. Ringkasan BBM & Efisiensi</Text>
      <View style={styles.headRow}>
        <Text style={[styles.headCell, { flex: 1 }]}>Rata-rata</Text>
        <Text style={[styles.headCell, { flex: 1 }]}>Terakhir</Text>
        <Text style={[styles.headCell, { flex: 1 }]}>Terbaik</Text>
        <Text style={[styles.headCell, { flex: 1 }]}>Total Liter</Text>
        <Text style={[styles.headCell, { flex: 1 }]}>Biaya BBM</Text>
        <Text style={[styles.headCell, { flex: 1 }]}>Biaya / KM</Text>
      </View>
      <View style={styles.row} wrap={false}>
        <Text style={[styles.cell, { flex: 1 }]}>{number(fuel.averageKmPerLiter)} km/L</Text>
        <Text style={[styles.cell, { flex: 1 }]}>{number(fuel.lastKmPerLiter)} km/L</Text>
        <Text style={[styles.cell, { flex: 1 }]}>{number(fuel.bestKmPerLiter)} km/L</Text>
        <Text style={[styles.cell, { flex: 1 }]}>{number(fuel.totalLiters)} L</Text>
        <Text style={[styles.cell, { flex: 1 }]}>{rupiah(fuel.totalCost)}</Text>
        <Text style={[styles.cell, { flex: 1 }]}>
          {fuel.costPerKm == null ? '-' : rupiah(fuel.costPerKm)}
        </Text>
      </View>
      <Text style={[styles.itemMeta, { marginTop: 4 }]}>
        Berdasarkan {fuel.entries} catatan pengisian · {fuel.trackedKm.toLocaleString('id-ID')} km
        terlacak.
      </Text>
    </>
  )
}

export function VehiclePassportDocument({ data }: { data: VehiclePassport }) {
  const { vehicle } = data
  const generatedDate = new Date(data.generatedAt).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Document
      title={`Vehicle Passport - ${vehicle.name}`}
      author="MotoLog"
      subject="Vehicle Service Record & Health Passport"
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.brand}>MOTOLOG · VEHICLE HEALTH TRACKER</Text>
          <Text style={styles.title}>VEHICLE SERVICE RECORD & HEALTH PASSPORT</Text>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Kendaraan</Text>
              <Text style={styles.metaValue}>{vehicle.name}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Nomor Polisi</Text>
              <Text style={styles.metaValue}>{vehicle.license_plate}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Odometer Saat Ini</Text>
              <Text style={styles.metaValue}>
                {vehicle.current_odometer.toLocaleString('id-ID')} km
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Jenis</Text>
              <Text style={styles.metaValue}>
                {vehicleKind(vehicle.vehicle_type, vehicle.transmission_type).label}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Tahun</Text>
              <Text style={styles.metaValue}>{vehicle.manufacture_year ?? '-'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Total Kunjungan Servis</Text>
              <Text style={styles.metaValue}>{data.totalServiceVisits}x</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Dibuat Tanggal</Text>
              <Text style={styles.metaValue}>{generatedDate}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>1. Status Komponen Aktif</Text>
        <StatusTable parts={data.parts} />

        <Text style={styles.sectionTitle}>2. Logbook Servis</Text>
        <LogbookTable history={data.history} />

        <EfficiencySection fuel={data.fuel} />

        <View style={styles.footer} fixed>
          <View style={styles.footerCol}>
            <Text>
              Logbook digital terverifikasi MotoLog. Dokumen ini dihasilkan otomatis dari
              catatan servis pengguna.
            </Text>
          </View>
          <View style={styles.footerCol}>
            <Text>
              Total pengeluaran servis seumur hidup:{' '}
              <Text style={styles.footerStrong}>
                {rupiah(data.lifetimeMaintenanceCost)}
              </Text>
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

export function renderPassportPdf(data: VehiclePassport) {
  return renderToBuffer(<VehiclePassportDocument data={data} />)
}
