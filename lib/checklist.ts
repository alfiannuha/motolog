import type { PartStatus } from '@/lib/maintenance-health'
import type {
  ComplaintSeverity,
  SymptomCategory,
  VehicleComplaint,
} from '@/types'

export const SYMPTOM_CATEGORIES: { value: SymptomCategory; label: string }[] = [
  { value: 'engine', label: 'Mesin' },
  { value: 'cvt_transmission', label: 'CVT / Transmisi' },
  { value: 'braking', label: 'Pengereman' },
  { value: 'electrical', label: 'Kelistrikan' },
  { value: 'handling', label: 'Kaki-kaki / Handling' },
  { value: 'other', label: 'Lainnya' },
]

export const SEVERITY_META: Record<
  ComplaintSeverity,
  { label: string; badge: string }
> = {
  low: {
    label: 'Rendah',
    badge: 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300',
  },
  medium: {
    label: 'Sedang',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  },
  high: {
    label: 'Tinggi',
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  },
}

export function categoryLabel(category: string | null): string {
  return (
    SYMPTOM_CATEGORIES.find((item) => item.value === category)?.label ?? 'Lainnya'
  )
}

export function severityMeta(severity: string | null) {
  return SEVERITY_META[(severity as ComplaintSeverity) ?? 'medium'] ?? SEVERITY_META.medium
}

export interface ChecklistItem {
  partName: string
  status: PartStatus['status']
  remainingKm: number | null
  remainingDays: number | null
  priority: 'critical' | 'warning'
}

export interface PreServiceBrief {
  parts: ChecklistItem[]
  complaints: VehicleComplaint[]
  hasUrgent: boolean
}

function priority(part: PartStatus): 'critical' | 'warning' {
  return part.status === 'critical' ? 'critical' : 'warning'
}

// Parts needing service, most urgent first, plus unresolved complaints sorted
// by severity (high → low).
export function buildPreServiceBrief(
  parts: PartStatus[],
  complaints: VehicleComplaint[],
): PreServiceBrief {
  const checklist = parts
    .filter((part) => part.status !== 'healthy')
    .sort(
      (a, b) =>
        (priority(a) === 'critical' ? 0 : 1) - (priority(b) === 'critical' ? 0 : 1) ||
        a.percentageRemaining - b.percentageRemaining,
    )
    .map((part) => ({
      partName: part.partName,
      status: part.status,
      remainingKm: part.remainingKm,
      remainingDays: part.remainingDays,
      priority: priority(part),
    }))

  const order: ComplaintSeverity[] = ['high', 'medium', 'low']
  const open = complaints
    .filter((complaint) => !complaint.is_resolved)
    .sort(
      (a, b) =>
        order.indexOf((a.severity as ComplaintSeverity) ?? 'medium') -
        order.indexOf((b.severity as ComplaintSeverity) ?? 'medium'),
    )

  return {
    parts: checklist,
    complaints: open,
    hasUrgent: checklist.some((item) => item.priority === 'critical'),
  }
}

export function buildMechanicBriefText(
  vehicleLabel: string,
  brief: PreServiceBrief,
): string {
  const lines: string[] = [`BRIEF SERVIS — ${vehicleLabel}`, '']

  lines.push('Ganti / periksa (berdasarkan status):')
  if (brief.parts.length === 0) {
    lines.push('- Tidak ada komponen mendesak')
  } else {
    for (const item of brief.parts) {
      const timing =
        item.remainingKm != null
          ? item.remainingKm <= 0
            ? `lewat ${Math.abs(item.remainingKm)} km`
            : `sisa ${item.remainingKm} km`
          : item.remainingDays != null
            ? item.remainingDays <= 0
              ? `lewat ${Math.abs(item.remainingDays)} hari`
              : `sisa ${item.remainingDays} hari`
            : '-'
      lines.push(
        `- [${item.priority === 'critical' ? 'OVERDUE' : 'SEGERA'}] ${item.partName} (${timing})`,
      )
    }
  }

  lines.push('', 'Keluhan yang perlu dicek:')
  if (brief.complaints.length === 0) {
    lines.push('- Tidak ada keluhan tercatat')
  } else {
    for (const complaint of brief.complaints) {
      lines.push(
        `- [${severityMeta(complaint.severity).label}] ${complaint.title} (${categoryLabel(
          complaint.symptom_category,
        )})`,
      )
    }
  }

  lines.push('', 'Mohon dikonfirmasi sebelum pengerjaan. Terima kasih.')
  return lines.join('\n')
}

function runSelfCheck() {
  const assert = (condition: boolean, label: string) => {
    if (!condition) throw new Error(`checklist self-check failed: ${label}`)
  }

  const parts = [
    { ruleId: 'a', partName: 'Filter Udara', status: 'healthy' as const },
    { ruleId: 'b', partName: 'Oli Mesin', status: 'critical' as const },
    { ruleId: 'c', partName: 'Kampas Rem', status: 'warning' as const },
  ].map((part, index) => ({
    ...part,
    intervalKm: 1000,
    intervalMonths: 1,
    lastServiceOdometer: 0,
    lastServiceDate: '2026-01-01',
    remainingKm: 100 - index * 10,
    remainingDays: 10,
    percentageRemaining: 10 + index * 10,
  }))

  const complaints = [
    {
      id: '1',
      vehicle_id: 'v',
      title: 'low',
      symptom_category: 'other',
      severity: 'low',
      is_resolved: false,
      resolved_at: null,
      resolved_log_id: null,
      created_at: null,
    },
    {
      id: '2',
      vehicle_id: 'v',
      title: 'high',
      symptom_category: 'braking',
      severity: 'high',
      is_resolved: false,
      resolved_at: null,
      resolved_log_id: null,
      created_at: null,
    },
    {
      id: '3',
      vehicle_id: 'v',
      title: 'resolved',
      symptom_category: 'engine',
      severity: 'high',
      is_resolved: true,
      resolved_at: null,
      resolved_log_id: null,
      created_at: null,
    },
  ]

  const brief = buildPreServiceBrief(parts, complaints)
  assert(brief.parts.length === 2, 'excludes healthy parts')
  assert(brief.parts[0].partName === 'Oli Mesin', 'critical first')
  assert(brief.hasUrgent, 'hasUrgent when critical present')

  assert(brief.complaints.length === 2, 'excludes resolved complaints')
  assert(brief.complaints[0].title === 'high', 'complaints sorted by severity')

  const text = buildMechanicBriefText('Vario (AB 1)', brief)
  assert(text.includes('[OVERDUE] Oli Mesin'), 'brief marks overdue')
  assert(text.includes('[Tinggi] high'), 'brief includes severity label')
  assert(!text.includes('resolved'), 'brief omits resolved complaint')

  const empty = buildPreServiceBrief([], [])
  assert(empty.parts.length === 0 && !empty.hasUrgent, 'empty brief')
  assert(
    buildMechanicBriefText('X', empty).includes('Tidak ada komponen mendesak'),
    'empty brief text',
  )

  console.log('checklist self-check passed')
}

const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv?.[1] != null &&
  /checklist\.[cm]?ts$/.test(process.argv[1])

if (isDirectRun) runSelfCheck()
