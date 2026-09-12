# Product Requirements Document (PRD)
**Project Name:** MotoLog / AutoLog (Vehicle Health & Maintenance Tracker)  
**Status:** Draft / Planned  
**Target Release:** MVP v1.0  

---

## 1. Problem Statement & Motivation
Banyak pemilik kendaraan bermotor (terutama motor dan mobil harian) mengandalkan ingatan atau stiker kertas servis dari bengkel yang mudah pudar, robek, atau hilang. Akibatnya:
- Penggantian oli mesin, oli gardan, busi, dan filter sering telat sehingga mempercepat keausan mesin.
- Biaya perawatan membengkak mendadak karena kerusakan terakumulasi tanpa riwayat yang jelas.
- Pemilik kesulitan mengetahui total biaya kepemilikan riil (*Total Cost of Ownership*) kendaraannya per bulan/tahun.

Aplikasi ini bertujuan menjadi logbook digital personal yang ringan, cepat diakses dari ponsel, dan memberikan estimasi jadwal servis preventif berbasis jarak tempuh (odometer) maupun rentang waktu (bulan).

---

## 2. Target Users & Personas
- **Primary User:** Pemilik kendaraan pribadi komuter harian.
- **Pain Points:** 
  - Tidak ingat kapan terakhir servis besar/kecil.
  - Bingung menentukan part mana yang perlu diganti saat masuk kilometer tertentu.
  - Malas membuka spreadsheet rumit hanya untuk mencatat nominal ganti oli.

---

## 3. Goals & Success Metrics
### Goals:
- Menyediakan UI pencatatan servis dan update kilometer kendaraan yang selesai dalam < 15 detik.
- Mengirimkan pengingat servis proaktif sebelum kilometer atau tanggal jatuh tempo terlampaui.
- Menyediakan laporan ringkas total pengeluaran servis per kendaraan.

### Success Metrics (Personal Usage):
- 100% catatan servis terarsip digital lengkap dengan foto invoice/nota bengkel.
- 0 kejadian keterlambatan ganti oli mesin > 500 km dari batas anjuran.

---

## 4. Scope & Feature Requirements

### MVP (Phase 1)
| Feature ID | Feature Name | Description | Priority |
|---|---|---|---|
| **F-01** | Vehicle Profile Management | Tambah/edit profil kendaraan: Merk, Model, Plat Nomor, Tahun, Odometer Awal. | P0 (Must Have) |
| **F-02** | Odometer Quick Update | Input log kilometer terbaru saat isi bensin atau servis. | P0 (Must Have) |
| **F-03** | Maintenance Log Entry | Input catatan servis: Tanggal, Odometer, Jenis Pekerjaan (Oli Mesin, Oli Gardan, Kampas Rem, Tune-up), Biaya Jasa, Biaya Part, Nama Bengkel, Catatan. | P0 (Must Have) |
| **F-04** | Receipt Attachment | Simpan foto/gambar struk bukti transaksi servis. | P1 (High) |
| **F-05** | Maintenance Health Status | Dasbor indikator status part (Misal: Oli Mesin sisa 400 km atau 14 hari lagi). Warna indikator: Hijau (Aman), Kuning (Segera), Merah (Overdue). | P0 (Must Have) |
| **F-06** | Expense Analytics Summary | Ringkasan total biaya servis per bulan dan grafik tren pengeluaran. | P1 (High) |

### Post-MVP (Phase 2)
- **F-07:** Web Push Notification / Telegram Bot Reminder untuk jadwal servis jatuh tempo.
- **F-08:** Fuel Log & Consumption Tracker (Kalkulasi konsumsi km/liter).
- **F-09:** Export Data ke format PDF / CSV untuk riwayat kendaraan saat hendak dijual (Service Book Record).
- **F-10:** OCR otomatis untuk membaca total nominal dan rincian dari foto kuitansi/invoice bengkel.

---

## 5. Non-Functional Requirements
- **Performance:** First Contentful Paint (FCP) < 1.2 detik pada jaringan seluler standar.
- **Mobile First / PWA:** Dapat di-install di layar HP (*Add to Home Screen*) dan mendukung offline-mode dasar untuk melihat data terakhir.
- **Reliability:** Validasi integritas data (misal: odometer baru tidak boleh lebih kecil dari odometer log sebelumnya).
