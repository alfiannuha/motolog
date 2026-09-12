ALTER TABLE vehicles
  ADD COLUMN transmission_type VARCHAR(10)
  CHECK (transmission_type IN ('matic', 'manual'));

COMMENT ON COLUMN vehicles.transmission_type IS
  'Motorcycle transmission: matic (CVT) or manual (bebek/gigi). NULL for cars or legacy rows.';
