import { db } from "./db";

export interface PromoCode {
  code: string;
  discount_percent: number;
  active: boolean;
}

/** Looks up an active promo code (case-insensitive). Returns null if invalid/inactive/missing. */
export async function getActivePromo(code: string): Promise<PromoCode | null> {
  if (!code) return null;
  const result = await db.query(
    `SELECT code, discount_percent, active FROM promo_codes WHERE code = $1 AND active = true`,
    [code.trim().toUpperCase()]
  );
  return result.rows[0] || null;
}

/** Applies a percentage discount to an amount in paise, rounded to the nearest paisa. */
export function applyDiscount(amountPaise: number, discountPercent: number) {
  const discountPaise = Math.round((amountPaise * discountPercent) / 100);
  return { finalAmount: amountPaise - discountPaise, discountPaise };
}
