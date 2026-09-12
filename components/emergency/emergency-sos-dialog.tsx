'use client'

import { Phone, X } from 'lucide-react'

const EMERGENCY_NUMBERS = [
  { label: 'Polisi', number: '110', hint: 'Kecelakaan / kejahatan' },
  { label: 'Darurat Nasional', number: '112', hint: 'Layanan terpadu' },
  { label: 'Ambulans / PSC', number: '118', hint: 'Gawat darurat medis' },
  { label: 'Jasa Marga', number: '14080', hint: 'Derek resmi jalan tol' },
  { label: 'Derek Umum', number: '021', hint: 'Sesuaikan nomor derek lokal' },
]

const QUICK_SERVICES = [
  {
    label: 'SPBU / Pom Bensin Terdekat',
    href: 'https://www.google.com/maps/search/?api=1&query=SPBU+pom+bensin+terdekat',
  },
  {
    label: 'Tambal Ban Terdekat (24 Jam)',
    href: 'https://www.google.com/maps/search/?api=1&query=tambal+ban+terdekat+24+jam',
  },
  {
    label: 'Bengkel Motor / Mobil Terdekat',
    href: 'https://www.google.com/maps/search/?api=1&query=bengkel+terdekat',
  },
  {
    label: 'Toko Aki Terdekat',
    href: 'https://www.google.com/maps/search/?api=1&query=toko+aki+terdekat',
  },
]

const BREAKDOWN_STEPS: { title: string; steps: string[] }[] = [
  {
    title: 'Motor Mati Mendadak saat Hujan',
    steps: [
      'Menepi ke tempat aman, matikan kontak, pasang hazard.',
      'Buka cop busi, cek apakah basah — keringkan dan pasang kembali.',
      'Cek sekring utama, ganti bila putus.',
      'Bila masih mati, jangan paksa starter berulang; hubungi bengkel.',
    ],
  },
  {
    title: 'Starter Elektrik Mati / Cetek-Cetek',
    steps: [
      'Cek saklar standar samping (kadang masih aktif).',
      'Bunyikan klakson: lemah/tidak bunyi berarti aki lemah.',
      'Periksa sekring utama, ganti bila putus.',
      'Coba kick starter (bila ada). Aki lemah: cari jump start / dorong.',
    ],
  },
  {
    title: 'Rem Terasa Blong / Macet',
    steps: [
      'Lepas gas, jangan mengerem mendadak agar roda tidak terkunci.',
      'Turunkan gigi perlahan untuk mengurangi laju.',
      'Pakai rem belakang bertahap bila rem depan blong.',
      'Setelah berhenti, periksa minyak rem / kampas sebelum lanjut.',
    ],
  },
  {
    title: 'Prosedur Aman Mendorong / Stut Motor Matic',
    steps: [
      'Kontak OFF saat didorong agar CVT tidak menahan.',
      'Dorong di sisi kanan kendaraan, badan menghadap jalur (bukan berlawanan).',
      'Jangan menutup gas saat mendorong — hindari belt CVT tergelincir.',
      'Untuk motor injeksi, cukup dorong; hindari engine brake mendadak.',
    ],
  },
]

function SectionTitle({ index, title }: { index: number; title: string }) {
  return (
    <h3 className="flex items-center gap-2 text-base font-bold text-amber-400">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-amber-400 text-xs font-black text-black">
        {index}
      </span>
      {title}
    </h3>
  )
}

export function EmergencySosDialog({
  dialogRef,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>
}) {
  function close() {
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-zinc-950 p-0 text-zinc-100 backdrop:bg-black/70"
    >
      <div className="safe-top safe-bottom mx-auto flex h-full w-full max-w-2xl flex-col">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-red-600" />
            </span>
            <h2 className="text-lg font-black tracking-wide">SOS DARURAT</h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-sm font-medium hover:bg-white/10"
          >
            <X className="size-4" />
            Tutup
          </button>
        </header>

        <div className="grid flex-1 gap-6 overflow-y-auto px-4 py-5">
          <section>
            <SectionTitle index={1} title="Nomor Darurat" />
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {EMERGENCY_NUMBERS.map((item) => (
                <li key={item.label}>
                  <a
                    href={`tel:${item.number}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2.5 hover:bg-red-500/20"
                  >
                    <span>
                      <span className="block font-semibold">{item.label}</span>
                      <span className="text-xs text-zinc-400">{item.hint}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 font-bold text-red-400">
                      <Phone className="size-4" />
                      {item.number}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SectionTitle index={2} title="Bantuan Cepat" />
            <ul className="mt-3 grid gap-2">
              {QUICK_SERVICES.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-3 py-3 font-medium hover:bg-white/10"
                  >
                    {item.label}
                    <span className="shrink-0 text-xs text-zinc-400">Maps →</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SectionTitle index={3} title="Langkah Saat Mogok" />
            <div className="mt-3 grid gap-2">
              {BREAKDOWN_STEPS.map((guide) => (
                <details
                  key={guide.title}
                  className="group rounded-xl border border-white/15 bg-white/5 px-3 py-2.5"
                >
                  <summary className="cursor-pointer list-none font-medium marker:content-none">
                    <span className="flex items-center justify-between gap-3">
                      {guide.title}
                      <span className="text-xs text-zinc-400 group-open:hidden">
                        Buka
                      </span>
                    </span>
                  </summary>
                  <ol className="mt-2 grid gap-1.5 border-t border-white/10 pt-2">
                    {guide.steps.map((step, index) => (
                      <li key={step} className="flex gap-2 text-sm text-zinc-300">
                        <span className="font-semibold text-amber-400">
                          {index + 1}.
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </dialog>
  )
}
