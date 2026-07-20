import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { razorpay } from "@/lib/razorpay";
import { getActivePromo, applyDiscount } from "@/lib/promo";

export async function POST(req: NextRequest) {
  const { groupId, promoCode } = await req.json();

  if (!groupId) {
    return NextResponse.json({ error: "groupId is required" }, { status: 400 });
  }

  try {
    const bookings = await db.query(
      `SELECT id, status, held_until, price_paise FROM bookings WHERE group_id = $1`,
      [groupId]
    );

    if (bookings.rows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const allHeld = bookings.rows.every(
      (row) => row.status === "held" && new Date(row.held_until) > new Date()
    );
    if (!allHeld) {
      return NextResponse.json({ error: "Your slot hold has expired. Please pick slots again." }, { status: 410 });
    }

    // Each row already has its own price, captured at the moment it was
    // held — this is what actually gets charged, not a flat rate. Prices
    // can differ per slot (e.g. evening more than morning) and changing a
    // slot's price later never affects a booking already in progress.
    const baseAmount = bookings.rows.reduce((sum, row) => sum + row.price_paise, 0);

    // Discount is always recalculated server-side from the database — the
    // client only ever sends the code text, never a discount amount, so
    // there's no way to tamper with the price from the browser.
    let finalAmount = baseAmount;
    let discountPaise = 0;
    let appliedCode: string | null = null;

    if (promoCode) {
      const promo = await getActivePromo(promoCode);
      if (!promo) {
        return NextResponse.json({ error: "Invalid or expired promo code" }, { status: 400 });
      }
      const result = applyDiscount(baseAmount, promo.discount_percent);
      finalAmount = result.finalAmount;
      discountPaise = result.discountPaise;
      appliedCode = promo.code;
    }

    const order = await razorpay.orders.create({
      amount: finalAmount,
      currency: "INR",
      receipt: groupId,
    });

    await db.query(
      `UPDATE bookings SET razorpay_order_id = $1, promo_code = $2, discount_paise = $3, amount_paise = $4 WHERE group_id = $5`,
      [order.id, appliedCode, discountPaise, finalAmount, groupId]
    );

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      slotCount: bookings.rows.length,
      baseAmount,
      discountPaise,
      appliedCode,
    });
  } catch (err: any) {
    console.error("payment/create-order error:", err);
    return NextResponse.json({ error: err.message || "Could not create payment order" }, { status: 500 });
  }
}
