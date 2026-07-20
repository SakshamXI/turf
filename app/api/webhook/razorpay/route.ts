import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

// Configure this URL in Razorpay dashboard > Settings > Webhooks,
// subscribed to the "payment.captured" event. This exists as a safety net:
// if the customer closes the tab right after paying, before the browser
// calls /api/payment/verify, this webhook still confirms the booking.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");

  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;
    const paymentId = payment.id;

    await db.query(
      `UPDATE bookings
       SET status = 'confirmed', razorpay_payment_id = $1, confirmed_at = now()
       WHERE razorpay_order_id = $2 AND status != 'confirmed'`,
      [paymentId, orderId]
    );
  }

  return NextResponse.json({ received: true });
}
