-- 1. Tire Pressure & Condition Log
CREATE TABLE tire_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    front_psi DECIMAL(4, 1) NOT NULL,
    rear_psi DECIMAL(4, 1) NOT NULL,
    tread_condition VARCHAR(20) DEFAULT 'good', -- 'good', 'worn', 'critical'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Battery (Aki) Health Records
CREATE TABLE battery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    check_date DATE NOT NULL DEFAULT CURRENT_DATE,
    voltage DECIMAL(4, 2),                      -- e.g., 12.4V (mesin mati), 14.1V (mesin hidup)
    condition VARCHAR(20) DEFAULT 'healthy',    -- 'healthy', 'weak', 'replace'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tire_logs_vehicle ON tire_logs(vehicle_id, log_date DESC);
CREATE INDEX idx_battery_logs_vehicle ON battery_logs(vehicle_id, check_date DESC);
ALTER TABLE tire_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE battery_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev Full Access tire_logs" ON tire_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Dev Full Access battery_logs" ON battery_logs FOR ALL USING (true) WITH CHECK (true);
