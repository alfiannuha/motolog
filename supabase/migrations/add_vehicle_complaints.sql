CREATE TABLE vehicle_complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,            -- e.g., "CVT getar/gredek saat rpm rendah", "Rem depan bunyi decit"
    symptom_category VARCHAR(50) DEFAULT 'other', -- 'engine', 'cvt_transmission', 'braking', 'electrical', 'handling'
    severity VARCHAR(20) DEFAULT 'medium',  -- 'low', 'medium', 'high'
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_log_id UUID REFERENCES maintenance_logs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_complaints_vehicle ON vehicle_complaints(vehicle_id, is_resolved);
ALTER TABLE vehicle_complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev Full Access complaints" ON vehicle_complaints FOR ALL USING (true) WITH CHECK (true);
