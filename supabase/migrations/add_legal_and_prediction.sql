ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS tax_due_date DATE,                -- Pajak Tahunan (PKB)
ADD COLUMN IF NOT EXISTS plate_due_date DATE,              -- Pajak 5 Tahunan / Ganti Kaleng
ADD COLUMN IF NOT EXISTS estimated_daily_km INT DEFAULT 20; -- Default estimasi jarak tempuh harian (km/hari)
