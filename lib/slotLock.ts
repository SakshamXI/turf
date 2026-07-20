import { db } from "./db";
import { randomUUID } from "crypto";
import { getPricesForTimes } from "./slots";

const HOLD_MINUTES = 5;

/**
 * Attempts to hold several slots at once for one email address, all linked
 * under one group_id (so they can be paid for and ticketed together).
 * If ANY of the requested slots is unavailable OR no longer offered, none
 * are held. Each row stores the price AT THIS MOMENT — never recomputed
 * later, so a later price change never retroactively changes what someone
 * already booked pays.
 */
export async function holdSlots(email: string, slotDate: string, times: string[]) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Release stale holds first
    await client.query(
      `DELETE FROM bookings
       WHERE slot_date = $1 AND slot_time = ANY($2)
         AND status = 'held' AND held_until < now()`,
      [slotDate, times]
    );

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
    if (prices.size !== times.length) {
      await client.query("ROLLBACK");
      return null; // one or more requested times aren't currently offered
    }

    const groupId = randomUUID();
    const bookingIds: string[] = [];

    for (const time of times) {
      const result = await client.query(
        `INSERT INTO bookings (group_id, email, slot_date, slot_time, status, held_until, price_paise)
         VALUES ($1, $2, $3, $4, 'held', now() + interval '${HOLD_MINUTES} minutes', $5)
         RETURNING id`,
        [groupId, email.trim().toLowerCase(), slotDate, time, prices.get(time)]
      );
      bookingIds.push(result.rows[0].id);
    }

    await client.query("COMMIT");
    return { groupId, bookingIds };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
