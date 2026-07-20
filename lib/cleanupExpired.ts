import { db } from "./db";

/**
 * Flips any 'confirmed' booking whose slot(s) have fully finished into
 * 'expired'. Called lazily at the top of admin-facing routes rather than
 * on a schedule — cheap enough to run on every request, and means the
 * status is always accurate whenever anyone actually looks.
 *
 * Uses Postgres' own timezone conversion (Asia/Kolkata) so this is correct
 * regardless of what timezone the app server itself happens to run in.
 */
export async function expireOldBookings() {
  await db.query(
    `UPDATE bookings
     SET status = 'expired'
     WHERE status = 'confirmed'
       AND (slot_date + slot_time::time + interval '1 hour') < (now() AT TIME ZONE 'Asia/Kolkata')`
  );
}
