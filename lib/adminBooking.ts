import { db } from "./db";
import { randomUUID } from "crypto";
import { getPricesForTimes } from "./slots";

/**
 * Admin-created booking — used for walk-ins or bookings taken in person,
 * where payment happens outside Razorpay (e.g. cash at the counter).
 * Marked confirmed immediately, no payment id attached. Price is still
 * recorded per slot for your own records.
 */
export async function adminCreateBooking(slotDate: string, times: string[], email: string) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT slot_time FROM bookings
       WHERE slot_date = $1 AND slot_time = ANY($2)
         AND status IN ('confirmed', 'held')`,
      [slotDate, times]
    );

    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return null; // one or more requested slots are unavailable
    }

    const prices = await getPricesForTimes(times);

    const groupId = randomUUID();

    for (const time of times) {
      await client.query(
        `INSERT INTO bookings (group_id, email, slot_date, slot_time, status, confirmed_at, price_paise)
         VALUES ($1, $2, $3, $4, 'confirmed', now(), $5)`,
        [groupId, (email || "walk-in").trim().toLowerCase(), slotDate, time, prices.get(time) || 0]
      );
    }

    await client.query("COMMIT");
    return groupId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Frees up every slot in a group — used to cancel a booking from the admin panel. */
export async function adminCancelBooking(groupId: string) {
  const result = await db.query(
    `UPDATE bookings SET status = 'cancelled' WHERE group_id = $1 AND status IN ('confirmed', 'held') RETURNING id`,
    [groupId]
  );
  return result.rows.length;
}
