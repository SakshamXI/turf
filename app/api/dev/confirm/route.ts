import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateTicketQr } from "@/lib/generateTicket";

// Lets you preview the confirmation/ticket page locally without a real
// Razorpay payment. Hard-disabled outside development so it can never be
// hit in production, even if someone guesses the URL.
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const { groupId } = await req.json();

  if (!groupId) {
    return NextResponse.json({ error: "groupId is required" }, { status: 400 });
  }

  try {
    const result = await db.query(
      `UPDATE bookings
       SET status = 'confirmed', razorpay_payment_id = 'dev_test_payment', confirmed_at = now()
       WHERE group_id = $1
       RETURNING id, slot_date::text AS slot_date, slot_time`,
      [groupId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const slotDate = result.rows[0].slot_date;
    const slotTimes = result.rows.map((r) => r.slot_time).sort();
    const qrDataUrl = await generateTicketQr(groupId);

    return NextResponse.json({ success: true, groupId, slotDate, slotTimes, qrDataUrl });
  } catch (err: any) {
    console.error("dev/confirm error:", err);
    return NextResponse.json({ error: err.message || "Database error" }, { status: 500 });
  }
}
