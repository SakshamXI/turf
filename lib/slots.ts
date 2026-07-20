import { db } from "./db";

export interface TimeSlotTemplate {
  time: string;
  pricePaise: number;
  active?: boolean;
}

/** Slots customers can currently book, with price, ordered by time. */
export async function getActiveSlotTemplates(): Promise<TimeSlotTemplate[]> {
  const result = await db.query(
    `SELECT slot_time, price_paise FROM time_slots WHERE active = true ORDER BY slot_time`
  );
  return result.rows.map((r) => ({ time: r.slot_time.slice(0, 5), pricePaise: r.price_paise }));
}

/** All slots including inactive ones — used by the admin panel. */
export async function getAllSlotTemplates(): Promise<TimeSlotTemplate[]> {
  const result = await db.query(
    `SELECT slot_time, price_paise, active FROM time_slots ORDER BY slot_time`
  );
  return result.rows.map((r) => ({ time: r.slot_time.slice(0, 5), pricePaise: r.price_paise, active: r.active }));
}

/** Looks up the current price for a set of slot times. Missing/inactive times are simply absent from the result map. */
export async function getPricesForTimes(times: string[]): Promise<Map<string, number>> {
  const result = await db.query(
    `SELECT slot_time, price_paise FROM time_slots WHERE slot_time = ANY($1) AND active = true`,
    [times]
  );
  const map = new Map<string, number>();
  result.rows.forEach((r) => map.set(r.slot_time.slice(0, 5), r.price_paise));
  return map;
}
