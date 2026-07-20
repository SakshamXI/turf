-- Game on Arena — full database schema for a NEW Supabase project.
-- Run this whole file once, top to bottom, in Supabase SQL Editor.
--
-- Design principle: we deliberately do NOT store customer names, addresses,
-- or card data. A booking row only proves "this phone number holds this
-- slot" — plus the price actually charged, for accurate revenue reporting.

-- =========================================================
-- BOOKINGS — one row per slot (a multi-slot booking shares one group_id)
-- =========================================================
CREATE TABLE bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id            UUID NOT NULL DEFAULT gen_random_uuid(), -- links slots booked together
  email               VARCHAR(255) NOT NULL,
  slot_date           DATE NOT NULL,
  slot_time           VARCHAR(5) NOT NULL,           -- '18:00'
  status              VARCHAR(20) NOT NULL DEFAULT 'held', -- held | confirmed | expired | cancelled
  razorpay_order_id   VARCHAR(64),
  razorpay_payment_id VARCHAR(64),
  held_until          TIMESTAMPTZ,                   -- temporary hold expiry, before payment
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at        TIMESTAMPTZ,
  promo_code          VARCHAR(30),                   -- code applied, if any
  discount_paise      INT NOT NULL DEFAULT 0,         -- amount saved (whole group total, on every row)
  amount_paise        INT NOT NULL DEFAULT 0,         -- FINAL amount charged (whole group total, on every row)
  price_paise         INT NOT NULL DEFAULT 0          -- this slot's own price at time of booking
);

-- Short-lived OTP codes for email verification (Resend just sends the
-- email; this table generates/stores/checks the code itself).
CREATE TABLE email_otps (
  email      VARCHAR(255) PRIMARY KEY,
  code       VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_slot ON bookings (slot_date, slot_time, status);
CREATE INDEX idx_bookings_group ON bookings (group_id);

-- Only one CONFIRMED booking allowed per slot (multiple held/expired rows
-- for the same slot are fine — they just can't both be confirmed).
CREATE UNIQUE INDEX unique_confirmed_slot
  ON bookings (slot_date, slot_time)
  WHERE status = 'confirmed';

-- =========================================================
-- TIME SLOTS — configurable bookable times, each with its own price
-- =========================================================
CREATE TABLE time_slots (
  slot_time   VARCHAR(5) PRIMARY KEY,       -- '17:00'
  price_paise INT NOT NULL CHECK (price_paise > 0),
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Starting set of slots at ₹800 each — edit/add/remove anytime from the
-- admin panel's "Time slots & pricing" section, no SQL needed after this.
INSERT INTO time_slots (slot_time, price_paise) VALUES
  ('06:00', 80000), ('07:00', 80000), ('08:00', 80000), ('09:00', 80000),
  ('17:00', 80000), ('18:00', 80000), ('19:00', 80000), ('20:00', 80000),
  ('21:00', 80000), ('22:00', 80000);

-- =========================================================
-- PROMO CODES — percentage discounts, managed from the admin panel
-- =========================================================
CREATE TABLE promo_codes (
  code             VARCHAR(30) PRIMARY KEY,      -- stored uppercase, e.g. 'SAVE10'
  discount_percent INT NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  active           BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- HOLIDAYS — dates the turf is closed; customers can't book these
-- =========================================================
CREATE TABLE holidays (
  holiday_date DATE PRIMARY KEY,
  reason       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- OPTIONAL HOUSEKEEPING — run manually or on a schedule if you want
-- =========================================================
-- Release slots whose holders never completed payment:
-- DELETE FROM bookings WHERE status = 'held' AND held_until < now();

-- Auto-purge old confirmed bookings once the slot date has passed, since
-- there's no need to retain phone numbers after the visit:
-- DELETE FROM bookings WHERE status = 'confirmed' AND slot_date < now() - interval '7 days';
