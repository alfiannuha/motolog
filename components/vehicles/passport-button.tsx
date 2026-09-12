import { FileText } from 'lucide-react'

export function PassportButton({ vehicleId }: { vehicleId: string }) {
  return (
    <a
      href={`/api/vehicles/${vehicleId}/passport`}
      download
      className="flex items-center gap-2 rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
    >
      <FileText className="size-4" />
      Vehicle Passport
    </a>
  )
}
