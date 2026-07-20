import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to query params are required (YYYY-MM-DD)" }, { status: 400 });
  }

  try {
    // amount_paise is stored as the same group total on every row of a
    // multi-slot booking, so dedupe by group_id first to avoid overcounting
    // before summing. Only real Razorpay payments count — walk-in/cash
    // bookings never get a razorpay_payment_id, and the dev-only test
    // bypass is explicitly excluded too.
    const result = await db.query(
      `SELECT COALESCE(SUM(amount_paise), 0) AS total_paise, COUNT(*) AS booking_count
       FROM (
         SELECT DISTINCT group_id, amount_paise
         FROM bookings
         WHERE status = 'confirmed'
           AND razorpay_payment_id IS NOT NULL
           AND razorpay_payment_id != 'dev_test_payment'
           AND slot_date BETWEEN $1 AND $2
       ) t`,
      [from, to]
    );

    const row = result.rows[0];
    return NextResponse.json({
      from,
      to,
      totalPaise: Number(row.total_paise),
      bookingCount: Number(row.booking_count),
    });
  } catch (err: any) {
    console.error("admin/revenue error:", err);
    return NextResponse.json({ error: err.message || "Database error" }, { status: 500 });
  }
}
