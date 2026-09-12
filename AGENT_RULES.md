# Agent Instructions: Vehicle Health & Maintenance Tracker

## 1. Project Context & Stack
- **Framework:** Next.js (App Router), React, TypeScript.
- **Styling & UI:** Tailwind CSS, Lucide React, shadcn/ui.
- **Backend Layer:** Next.js Server Actions (hindari pembuatan Express/Go backend terpisah).
- **Database & Storage:** Supabase (PostgreSQL + Storage bucket `receipts`).
- **Data Validation:** Zod schema untuk setiap payload Server Action.
- **Specification Docs:** Baca dan patuhi `PRD.md` dan `DESIGN.md`.

## 2. Directory Structure Convention
Patuhi struktur folder berikut:
```text
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx               # Dashboard utama kendaraan
│   │   └── vehicles/
│   │       ├── [id]/page.tsx      # Detail kendaraan & riwayat servis
│   │       └── new/page.tsx       # Tambah kendaraan baru
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                        # Komponen shadcn/ui
│   ├── vehicles/                  # Komponen spesifik kendaraan (cards, status indicator)
│   └── logs/                      # Form input servis & riwayat log
├── actions/
│   ├── vehicles.ts                # Server actions terkait kendaraan & odometer
│   └── maintenance.ts             # Server actions terkait logs & kalkulasi servis
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client (anon key)
│   │   └── server.ts              # Server client (service_role untuk Server Actions)
│   └── utils.ts
├── types/
│   ├── index.ts                   # Domain types
│   └── database.ts                # Supabase generated types
