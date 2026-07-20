-- Minimal schema: we deliberately do NOT store names, addresses, or card data.
-- A booking row only proves "this phone number holds this slot".

CREATE TABLE IF NOT EXISTS bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id          UUID NOT NULL DEFAULT gen_random_uuid(), -- links slots booked together
  phone             VARCHAR(15) NOT NULL,          -- e.g. +919999999999
  slot_date         DATE NOT NULL,
  slot_time         VARCHAR(5) NOT NULL,           -- '18:00'
  status            VARCHAR(20) NOT NULL DEFAULT 'held', -- held | confirmed | expired | cancelled
  razorpay_order_id VARCHAR(64),
  razorpay_payment_id VARCHAR(64),
  held_until        TIMESTAMPTZ,                   -- temporary hold expiry, before payment
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at      TIMESTAMPTZ
);

-- Fast lookup for "is this slot free" queries
CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings (slot_date, slot_time, status);

-- Fast lookup of every slot in a multi-slot booking
CREATE INDEX IF NOT EXISTS idx_bookings_group ON bookings (group_id);

-- Run this instead if you already have the table created (adds the column
-- without losing existing data):
-- ALTER TABLE bookings ADD COLUMN group_id UUID NOT NULL DEFAULT gen_random_uuid();
-- CREATE INDEX idx_bookings_group ON bookings (group_id);

-- Promo codes for discounts. Discount is a whole-number percentage (e.g. 10 = 10% off).
CREATE TABLE IF NOT EXISTS promo_codes (
  code             VARCHAR(30) PRIMARY KEY,      -- stored uppercase, e.g. 'SAVE10'
  discount_percent INT NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  active           BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tracks which code (if any) was used on a booking, and how much it saved —
-- for your own records only, no customer data beyond what's already stored.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS promo_code VARCHAR(30);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_paise INT NOT NULL DEFAULT 0;

-- If you already ran an earlier version of this file, run just these lines
-- against your existing database:
-- CREATE TABLE IF NOT EXISTS promo_codes (
--   code             VARCHAR(30) PRIMARY KEY,
--   discount_percent INT NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
--   active           BOOLEAN NOT NULL DEFAULT true,
--   created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
-- );
-- ALTER TABLE bookings ADD COLUMN IF NOT EXISTS promo_code VARCHAR(30);
-- ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_paise INT NOT NULL DEFAULT 0;

-- Only one CONFIRMED booking is allowed per slot (partial unique index,
-- since multiple held/expired rows for the same slot are fine).
CREATE UNIQUE INDEX IF NOT EXISTS unique_confirmed_slot
  ON bookings (slot_date, slot_time)
  WHERE status = 'confirmed';

-- Housekeeping: run this periodically (cron / Supabase scheduled function)
-- to release slots whose holders never completed payment.
-- DELETE FROM bookings WHERE status = 'held' AND held_until < now();

-- Optional: auto-purge old confirmed bookings once the slot date has passed,
-- since we don't need to retain phone numbers after the visit.
-- DELETE FROM bookings WHERE status = 'confirmed' AND slot_date < now() - interval '7 days';

-- Dates the turf is closed (festivals, maintenance, etc). Customers can't
-- book on these dates; admin can still see and manage them.
CREATE TABLE IF NOT EXISTS holidays (
  holiday_date DATE PRIMARY KEY,
  reason       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- If you already ran an earlier version of this file, run just this
-- against your existing database:
-- CREATE TABLE IF NOT EXISTS holidays (
--   holiday_date DATE PRIMARY KEY,
--   reason       TEXT,
--   created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
-- );

-- The actual final amount charged for a booking (after any discount),
-- needed for accurate revenue reporting — SLOT_PRICE_PAISE can change over
-- time, so this must be captured at the moment of payment, not recomputed
-- later. Stored as the full group total on every row of that group (same
-- pattern as discount_paise), so always dedupe by group_id when summing.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS amount_paise INT NOT NULL DEFAULT 0;

-- Configurable time slots with per-slot pricing. Replaces the old fixed
-- ALL_SLOTS list + single flat SLOT_PRICE_PAISE — admin can now add new
-- times and price each one independently (e.g. evening slots higher than
-- morning).
CREATE TABLE IF NOT EXISTS time_slots (
  slot_time   VARCHAR(5) PRIMARY KEY,       -- '17:00'
  price_paise INT NOT NULL CHECK (price_paise > 0),
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seeds the original 10 default slots at ₹800 each, so existing installs
-- keep working immediately after this migration. Safe to re-run.
INSERT INTO time_slots (slot_time, price_paise) VALUES
  ('06:00', 80000), ('07:00', 80000), ('08:00', 80000), ('09:00', 80000),
  ('17:00', 80000), ('18:00', 80000), ('19:00', 80000), ('20:00', 80000),
  ('21:00', 80000), ('22:00', 80000)
ON CONFLICT (slot_time) DO NOTHING;

-- Captures the price actually charged for THIS booking at the moment it
-- was made — never recompute from time_slots later, since prices can
-- change after the fact and old bookings must keep their original price.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS price_paise INT NOT NULL DEFAULT 0;

-- If you already ran an earlier version of this file, run just this
-- against your existing database:
-- CREATE TABLE IF NOT EXISTS time_slots (
--   slot_time   VARCHAR(5) PRIMARY KEY,
--   price_paise INT NOT NULL CHECK (price_paise > 0),
--   active      BOOLEAN NOT NULL DEFAULT true,
--   created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
-- );
-- INSERT INTO time_slots (slot_time, price_paise) VALUES
--   ('06:00', 80000), ('07:00', 80000), ('08:00', 80000), ('09:00', 80000),
--   ('17:00', 80000), ('18:00', 80000), ('19:00', 80000), ('20:00', 80000),
--   ('21:00', 80000), ('22:00', 80000)
-- ON CONFLICT (slot_time) DO NOTHING;
-- ALTER TABLE bookings ADD COLUMN IF NOT EXISTS price_paise INT NOT NULL DEFAULT 0;

-- =========================================================
-- EMAIL MIGRATION — replaces phone number with email throughout
-- =========================================================
-- Run this block if you already have a bookings table with a `phone`
-- column from before switching to email:
-- ALTER TABLE bookings RENAME COLUMN phone TO email;
-- ALTER TABLE bookings ALTER COLUMN email TYPE VARCHAR(255);

-- Stores a short-lived OTP code per email — Resend just sends the email,
-- it doesn't generate or check codes for you the way MSG91 did, so this
-- table does that job. One row per email; a new send overwrites the old
-- code and expiry.
CREATE TABLE IF NOT EXISTS email_otps (
  email      VARCHAR(255) PRIMARY KEY,
  code       VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
