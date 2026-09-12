CREATE TABLE fuel_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    odometer INT NOT NULL,
    liters DECIMAL(6, 2) NOT NULL,
    price_per_liter DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(12, 2) NOT NULL,
    is_full_tank BOOLEAN NOT NULL DEFAULT true,
    fuel_type VARCHAR(50) DEFAULT 'Pertalite', -- e.g., Pertamax, Pertalite, Shell V-Power
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fuel_logs_vehicle ON fuel_logs(vehicle_id, log_date DESC);
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev Full Access fuel_logs" ON fuel_logs FOR ALL USING (true) WITH CHECK (true);
