import { db } from "./db";

export async function checkHoliday(date: string): Promise<{ holiday: boolean; reason?: string }> {
  const result = await db.query(`SELECT reason FROM holidays WHERE holiday_date = $1`, [date]);
  if (result.rows.length === 0) return { holiday: false };
  return { holiday: true, reason: result.rows[0].reason || undefined };
}
