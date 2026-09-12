# Technical & Architectural Design Document (DESIGN.md)
**Project:** Vehicle Health & Maintenance Tracker  
**Architecture Style:** Modular RESTful API + Single Page Application / PWA  

---

## 1. System Architecture

Aplikasi dibangun dengan arsitektur terpisah antara Frontend client dan Backend service:

```text
[ Browser / Mobile PWA (React / Next.js / Vue) ]
                     │
               HTTPS / JSON
                     ▼
          [ API Gateway / Backend (Go / Node / Python) ]
          ┌──────────┴──────────┐
          ▼                     ▼
 [ PostgreSQL / SQLite ]   [ Object Storage (MinIO / S3 / Local) ]
   (Relational Data)         (Foto Struk / Invoice)

```

* **Frontend:** Responsive Web App / Progressive Web App (PWA) dengan pendekatan *Mobile First*.
* **Backend Service:** REST API stateless untuk handling CRUD, kalkulasi batas servis, dan upload asset.
* **Storage:** Database relasional (PostgreSQL atau SQLite untuk self-hosted ringan) + Local disk / Object storage untuk foto kuitansi.

---

## 2. Database Schema Design (ERD Specification)

Skema database dirancang modular agar 1 pengguna dapat memiliki lebih dari 1 kendaraan, dan setiap item perawatan memiliki konfigurasi interval masing-masing.

### 2.1 Table: `vehicles`

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | UUID / SERIAL | PRIMARY KEY | Unique ID kendaraan |
| `name` | VARCHAR(100) | NOT NULL | Nama panggilan (contoh: "Vario Hitam", "Avanza") |
| `license_plate` | VARCHAR(20) | NOT NULL | Nomor Polisi (contoh: "AB 1234 XY") |
| `vehicle_type` | VARCHAR(20) | NOT NULL | `motorcycle` / `car` |
| `manufacture_year` | INT | NULL | Tahun perakitan |
| `current_odometer` | INT | NOT NULL DEFAULT 0 | Nilai kilometer terkini |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Waktu pendaftaran |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Waktu update profil |

### 2.2 Table: `maintenance_rules`

Tabel template interval standar untuk tiap jenis spare part / servis.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | UUID / SERIAL | PRIMARY KEY | Unique ID aturan |
| `vehicle_id` | UUID / INT | FOREIGN KEY -> vehicles(id) | Relasi ke kendaraan |
| `part_name` | VARCHAR(100) | NOT NULL | Contoh: "Oli Mesin", "Busi", "Oli Gardan" |
| `interval_km` | INT | NULL | Interval penggantian km (misal: 2000 km) |
| `interval_months` | INT | NULL | Interval penggantian bulan (misal: 2 bulan) |
| `last_service_odometer` | INT | NOT NULL DEFAULT 0 | Odometer saat servis terakhir part ini |
| `last_service_date` | DATE | NOT NULL | Tanggal terakhir part ini diganti |

### 2.3 Table: `maintenance_logs`

Tabel catatan riwayat pengerjaan bengkel.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | UUID / SERIAL | PRIMARY KEY | Unique ID log servis |
| `vehicle_id` | UUID / INT | FOREIGN KEY -> vehicles(id) | Relasi ke kendaraan |
| `service_date` | DATE | NOT NULL | Tanggal pengerjaan |
| `odometer` | INT | NOT NULL | Odometer saat servis dilakukan |
| `workshop_name` | VARCHAR(150) | NULL | Nama bengkel / mandiri (DIY) |
| `total_cost` | DECIMAL(12, 2) | NOT NULL DEFAULT 0 | Total biaya keseluruhan (jasa + part) |
| `receipt_image_url` | VARCHAR(255) | NULL | URL / path file gambar nota |
| `notes` | TEXT | NULL | Catatan tambahan teknisi/pemilik |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Waktu input record |

### 2.4 Table: `maintenance_log_items`

Rincian item pekerjaan di dalam 1 invoice servis.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | UUID / SERIAL | PRIMARY KEY | Unique ID rincian |
| `log_id` | UUID / INT | FOREIGN KEY -> maintenance_logs(id) | Relasi ke log induk |
| `rule_id` | UUID / INT | FOREIGN KEY -> maintenance_rules(id) (NULLABLE) | Menghubungkan ke rule agar auto-update interval |
| `item_name` | VARCHAR(100) | NOT NULL | Contoh: "Oli SPX2 0.8L", "Jasa Pasang" |
| `item_type` | VARCHAR(20) | NOT NULL | `part` atau `service_fee` |
| `cost` | DECIMAL(12, 2) | NOT NULL | Harga per item |

---

## 3. Core Business Logic & Health Algorithm

Kondisi kesehatan komponen kendaraan dihitung secara dinamis setiap kali API dipanggil atau ada penambahan log:

```text
Status Part = Function(Current Odometer, Last Service Odometer, Interval KM, Service Date, Interval Months)

```

1. **Jarak Tempuh Tersisa (KM):**
$$\Delta \text{km} = (\text{last\_service\_odometer} + \text{interval\_km}) - \text{current\_odometer}$$


2. **Waktu Tersisa (Hari):**
$$\Delta \text{hari} = (\text{last\_service\_date} + \text{interval\_months}) - \text{today}$$


3. **Penentuan Status Visual:**
* **Critical / Overdue (Merah):** $\Delta \text{km} \le 0$ ATAU $\Delta \text{hari} \le 0$.
* **Warning / Due Soon (Kuning):** $\Delta \text{km} \le (\text{interval\_km} \times 0.15)$ ATAU $\Delta \text{hari} \le 14\text{ hari}$.
* **Healthy (Hijau):** Masih berada di atas ambang batas peringatan.



---

## 4. API Endpoints (Specification)

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/vehicles` | Mengambil daftar semua kendaraan aktif. |
| `POST` | `/api/v1/vehicles` | Menambahkan kendaraan baru. |
| `PATCH` | `/api/v1/vehicles/:id/odometer` | Update cepat nilai kilometer terakhir kendaraan. |
| `GET` | `/api/v1/vehicles/:id/dashboard` | Mengambil status kesehatan semua part & ringkasan servis terakhir. |
| `POST` | `/api/v1/vehicles/:id/logs` | Menyimpan log servis baru beserta item rincian & memperbarui `current_odometer` dan `maintenance_rules`. |
| `GET` | `/api/v1/vehicles/:id/logs` | Menampilkan riwayat servis dengan pagination dan filter tanggal/part. |
| `POST` | `/api/v1/uploads/receipt` | Upload gambar nota/struk dan menghasilkan URL asset. |

---

## 5. Security & Data Integrity Considerations

* **Odometer Anomaly Check:** Sistem menolak entri kilometer log servis yang bernilai lebih kecil dari catatan tanggal sebelumnya (*anti-rollback validation*).
* **Asset Sanitization:** Upload gambar nota dibatasi maksimal 5 MB dengan validasi tipe MIME (`image/jpeg`, `image/png`, `image/webp`).
* **Database Indexing:** Index dipasang pada kolom pencarian utama: `vehicles(license_plate)`, `maintenance_logs(vehicle_id, service_date)`.
