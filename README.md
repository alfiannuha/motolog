# 🛵 MotoLog — Personal Vehicle Health & Maintenance Logbook

> MotoLog adalah aplikasi web progresif (PWA) berbasis *mobile-first* untuk mencatat riwayat servis, memantau kesehatan komponen kendaraan secara preventif, menghitung efisiensi bahan bakar, serta mengelola pengeluaran operasional motor dan mobil secara akurat.

---

## 🛠️ 2. Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, Server Actions)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling & UI:** [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/), [Lucide React](https://lucide.dev/)
- **Database & Storage:** [Supabase](https://supabase.com/) (PostgreSQL dengan RLS, Cloud Storage)
- **Validation:** [Zod](https://zod.dev/)
- **Push Engine:** Web Push Protocol & VAPID Keys
- **PWA Architecture:** Service Worker (Offline-first caching, Installable Manifest)

---

## 📋 3. Prasyarat (Prerequisites)

Sebelum memulai instalasi, pastikan lingkungan lokal Anda memenuhi persyaratan berikut:

- **Node.js:** Versi `>= 18.17.0` (Direkomendasikan Node.js 20 LTS)
- **Package Manager:** `npm` (v9+), `pnpm` (v8+), atau `yarn`
- **Akun Supabase:** Proyek Supabase aktif (gratis atau self-hosted) untuk database dan storage struk servis.

---

## 🚀 4. Instalasi & Setup

1. **Clone Repository:**
   ```bash
   git clone <URL-REPO-ANDA> motolog
   cd motolog

```

2. **Install Dependensi:**
```bash
npm install

```


3. **Migrasi Database Supabase:**
* Masuk ke dashboard Supabase pada tab **SQL Editor**.
* Jalankan seluruh file SQL migrasi yang ada di folder `supabase/migrations/` secara berurutan:

| # | File | Isi |
| --- | --- | --- |
| 1 | *(belum tersedia di repo)* | Skema utama: `vehicles`, `maintenance_rules`, `maintenance_logs`, `maintenance_log_items` |
| 2 | `add_transmission_type.sql` | Kolom `vehicles.transmission_type` (`matic` / `manual`) |
| 3 | `add_legal_and_prediction.sql` | Kolom pajak & estimasi jarak harian di `vehicles` |
| 4 | `add_push_subscriptions.sql` | Tabel `push_subscriptions` |
| 5 | `add_fuel_logs.sql` | Tabel `fuel_logs` |
| 6 | `add_specs_and_workshops.sql` | Tabel `vehicle_specs` & `trusted_workshops` |
| 7 | `add_vehicle_complaints.sql` | Tabel `vehicle_complaints` |
| 8 | `add_emergency_and_battery.sql` | Tabel `tire_logs` & `battery_logs` |

> ⚠️ Skema utama (langkah 1) belum ada sebagai file migrasi di repo ini. Jika memulai dari database kosong, buat dulu tabel dasarnya, atau ekspor skema dari database yang sudah berjalan lewat `supabase db dump`.

* Buat sebuah Storage Bucket bernama `receipts` di Supabase Storage dan setel hak aksesnya menjadi **Public**.


4. **Generate VAPID Keys (Untuk Web Push Notification):**
```bash
npx web-push generate-vapid-keys

```


Simpan *Public Key* dan *Private Key* yang dihasilkan untuk langkah konfigurasi environment.

---

## ⚙️ 5. Konfigurasi Environment Variables

Salin file `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local

```

Sesuaikan nilai variabel di dalam file `.env.local`:

```env
# ==============================================================================
# SUPABASE CONFIGURATION
# ==============================================================================
NEXT_PUBLIC_SUPABASE_URL=[https://your-project-ref.supabase.co](https://your-project-ref.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# ==============================================================================
# WEB PUSH NOTIFICATIONS (VAPID)
# Dihasilkan dari perintah: npx web-push generate-vapid-keys
# ==============================================================================
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:admin@domain.com

# ==============================================================================
# AUTOMATED MAINTENANCE CRON ROUTE
# Token acak untuk mengamankan route GET /api/cron/maintenance-check
# ==============================================================================
CRON_SECRET=your-random-cron-secret-token

# ==============================================================================
# AI OCR (OPSIONAL - Jika modul scanner struk diaktifkan)
# ==============================================================================
GEMINI_API_KEY=your-google-gemini-api-key

```

---

## 💻 6. Cara Menjalankan (Running)

### Mode Pengembangan (Development)

```bash
npm run dev

```

Akses aplikasi melalui browser di `http://localhost:3000`.

### Mode Produksi (Build & Start)

```bash
npm run build
npm run start

```

### Menjalankan via Docker (Opsional)

```bash
docker build -t motolog .
docker run -p 3000:3000 --env-file .env.local motolog

```

---

## ✨ 7. Fitur Utama

* **🚦 Health Engine Adaptif (Matic vs Gigi):** Interval pemakaian dan masa pakai oli/part berbeda secara otomatis berdasarkan tipe motor (misal: CVT, oli gardan vs rantai & gir).
* **📈 Prediksi Servis Cerdas (Daily Velocity):** Menghitung tanggal jatuh tempo servis berdasarkan rata-rata jarak tempuh harian real-time (km/hari), bukan sekadar kalender.
* **⛽ Log Konsumsi Bensin (KM/L & Biaya/KM):** Pencatatan bensin metode *full-to-full* yang sekaligus otomatis memperbarui odometer kendaraan secara bertahap.
* **🧾 AI Receipt Scanner (OCR):** Pindai nota/struk servis fisik menggunakan kamera untuk mengisi nama bengkel, tanggal, rincian part, dan biaya secara instan.
* **🔔 Web Push Notification:** Pengingat servis jatuh tempo dan jatuh tempo pajak STNK (Tahunan & 5 Tahunan) langsung ke perangkat Android/iOS/Desktop.
* **📄 Laporan Analitik & Service Passport (PDF):** Cetak ringkasan kesehatan kendaraan dan laporan keuangan Total Cost of Ownership (TCO) dalam format dokumen A4 rapi.
* **🧰 Mode Darurat & Quick Check:** Toolkit pengecekan tekanan angin ban (PSI), voltase aki, pencarian tambal ban terdekat 1-klik, serta panduan darurat mogok di jalan.
* **💾 100% Portabilitas Data:** Fitur Export & Import JSON penuh untuk backup lokal tanpa risiko vendor lock-in.

---

## 📱 8. Tangkapan Layar & Demo

| Dashboard Kendaraan | Mode Siap ke Bengkel | Ringkasan Analitik PDF |
| --- | --- | --- |
| ![Dashboard Kendaraan](/screenshots/dashboard.png) | ![Mode Siap ke Bengkel](/screenshots/pre-service-brief.png) | ![Ringkasan Analitik](/screenshots/analytics-report.png) |

> Screenshot belum tersedia di repo. Lihat [`docs/SCREENSHOTS.md`](docs/SCREENSHOTS.md) untuk cara mengambil dan menaruhnya di `public/screenshots/`.

> 🔗 **Live Demo:** _(belum dideploy — tambahkan URL setelah deploy)_

---

## 📄 9. Lisensi (License)

Didistribusikan di bawah Lisensi MIT. Lihat file `LICENSE` untuk informasi lebih lanjut.

---

## 🤝 10. Panduan Kontribusi & Kontak

Kontribusi, pelaporan bug, dan saran fitur sangat diapresiasi!

1. Fork project ini
2. Buat feature branch (`git checkout -b feature/FiturKeren`)
3. Commit perubahan (`git commit -m 'feat: Menambahkan fitur keren'`)
4. Push ke branch (`git push origin feature/FiturKeren`)
5. Buka Pull Request

**Kontak / Pengelola:**

* Maintainer: **alfiannuha**
* Email: `alfian.nuha@gmail.com`
* GitHub Issue Tracker: _(belum ada remote GitHub — tambahkan setelah repo dipublikasikan)_
