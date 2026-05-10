-- Server-side validation triggers (mirror app rules in API routes).
-- Safe for the website: only rejects rows that the app already refuses.

-- Booking: end must be after start
CREATE OR REPLACE FUNCTION hive_fn_booking_times_valid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."endTime" <= NEW."startTime" THEN
    RAISE EXCEPTION 'booking_end_must_follow_start: endTime must be after startTime'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hive_trg_booking_times ON "Booking";
CREATE TRIGGER hive_trg_booking_times
  BEFORE INSERT OR UPDATE OF "startTime", "endTime" ON "Booking"
  FOR EACH ROW
  EXECUTE FUNCTION hive_fn_booking_times_valid();

-- Resource: capacity bounds (matches POST/PATCH validation in app)
CREATE OR REPLACE FUNCTION hive_fn_resource_capacity_valid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."capacity" < 1 OR NEW."capacity" > 500 THEN
    RAISE EXCEPTION 'resource_capacity_out_of_range: capacity must be between 1 and 500'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hive_trg_resource_capacity ON "Resource";
CREATE TRIGGER hive_trg_resource_capacity
  BEFORE INSERT OR UPDATE OF "capacity" ON "Resource"
  FOR EACH ROW
  EXECUTE FUNCTION hive_fn_resource_capacity_valid();
