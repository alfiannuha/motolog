-- 1. Vehicle Technical Specifications & Part Numbers
CREATE TABLE vehicle_specs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE UNIQUE,
    engine_oil_spec VARCHAR(100),       -- e.g., "10W-30 JASO MB, 0.8 Liter"
    transmission_oil_spec VARCHAR(100),-- e.g., "120 ml"
    spark_plug_code VARCHAR(50),       -- e.g., "NGK CPR9EA-9"
    front_tire_size VARCHAR(50),       -- e.g., "90/80-14 Tubeless (29 psi)"
    rear_tire_size VARCHAR(50),        -- e.g., "100/80-14 Tubeless (33 psi)"
    battery_type VARCHAR(50),          -- e.g., "GTZ6V / YTZ6V (5 Ah)"
    coolant_capacity VARCHAR(50),      -- e.g., "Reservoir 0.16L, Radiator 0.44L"
    notes TEXT,                        -- Additional custom specs / torque ratings
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trusted / Preferred Workshops
CREATE TABLE trusted_workshops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    specialty VARCHAR(100),            -- e.g., "Official AHASS / Beres", "Spesialis CVT", "Bubut / Shock"
    address_or_maps_url TEXT,
    phone_number VARCHAR(30),
    rating INT DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
    notes TEXT,                        -- e.g., "Mekanik andalan: Mas Danang"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workshops_vehicle ON trusted_workshops(vehicle_id);
ALTER TABLE vehicle_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_workshops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev Full Access specs" ON vehicle_specs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Dev Full Access workshops" ON trusted_workshops FOR ALL USING (true) WITH CHECK (true);
