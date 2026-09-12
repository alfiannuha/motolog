import { LifeBuoy, Phone, Wrench } from 'lucide-react'

const HOTLINES = [
  { label: 'Darurat Nasional', number: '112', hint: 'Polisi, ambulans, pemadam' },
  { label: 'Polisi', number: '110', hint: 'Laporan kejahatan / kecelakaan' },
  { label: 'Ambulans / PSC', number: '119', hint: 'Gawat darurat medis' },
  { label: 'Jasa Marga', number: '14080', hint: 'Bantuan di jalan tol' },
  { label: 'PLN', number: '123', hint: 'Gangguan listrik' },
]

const CHECKLIST = [
  'Menepi ke bahu jalan, nyalakan lampu hazard, pasang segitiga pengaman.',
  'Pakai rompi reflektif bila turun dari kendaraan, terutama malam hari.',
  'Catat lokasi (patokan / Google Maps) sebelum menelepon bantuan.',
  'Jangan menyalakan mesin berulang bila aki lemah — hubungi bengkel / jump start.',
  'Bila ban bocor, cek dulu apakah ada ban serep dan dongkrak yang berfungsi.',
]

const QUICK_LINKS = [
  {
    label: 'Cari bengkel terdekat',
    href: 'https://www.google.com/maps/search/bengkel+motor+terdekat',
    hint: 'Buka Google Maps',
  },
  {
    label: 'Cari tambal ban terdekat',
    href: 'https://www.google.com/maps/search/tambal+ban+terdekat',
    hint: 'Buka Google Maps',
  },
  {
    label: 'Cari toko aki terdekat',
    href: 'https://www.google.com/maps/search/toko+aki+terdekat',
    hint: 'Buka Google Maps',
  },
]

export function EmergencyToolkit() {
  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-500/20 dark:bg-red-500/10">
        <h2 className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-400">
          <LifeBuoy className="size-4" />
          Nomor Darurat
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {HOTLINES.map((item) => (
            <li key={item.number}>
              <a
                href={`tel:${item.number}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm hover:bg-red-100 dark:border-red-500/20 dark:bg-zinc-900 dark:hover:bg-red-500/10"
              >
                <span>
                  <span className="block font-medium">{item.label}</span>
                  <span className="text-xs text-zinc-500">{item.hint}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 font-semibold text-red-600 dark:text-red-400">
                  <Phone className="size-3.5" />
                  {item.number}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
        <h2 className="flex items-center gap-2 font-semibold">
          <Wrench className="size-4 text-zinc-400" />
          Bantuan Cepat
        </h2>
        <ul className="mt-3 grid gap-2">
          {QUICK_LINKS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-3 py-2 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
              >
                <span className="font-medium">{item.label}</span>
                <span className="shrink-0 text-xs text-zinc-500">{item.hint}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
        <h2 className="font-semibold">Langkah Saat Mogok</h2>
        <ol className="mt-3 grid gap-2">
          {CHECKLIST.map((step, index) => (
            <li key={step} className="flex gap-2.5 text-sm">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-black/5 text-xs font-semibold dark:bg-white/10">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
