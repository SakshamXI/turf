import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";
import { expireOldBookings } from "@/lib/cleanupExpired";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const date = req.nextUrl.searchParams.get("date"); // optional YYYY-MM-DD filter

  try {
    await expireOldBookings();

    const result = await db.query(
      `SELECT
         group_id,
         email,
         slot_date::text AS slot_date,
         array_agg(slot_time ORDER BY slot_time) AS slot_times,
         status,
         razorpay_payment_id,
         confirmed_at,
         created_at
       FROM bookings
       WHERE status = 'confirmed'
         ${date ? "AND slot_date = $1" : ""}
       GROUP BY group_id, email, slot_date, status, razorpay_payment_id, confirmed_at, created_at
       ORDER BY slot_date DESC, confirmed_at DESC`,
      date ? [date] : []
    );

    return NextResponse.json({ bookings: result.rows });
  } catch (err: any) {
    console.error("admin/bookings error:", err);
    return NextResponse.json({ error: err.message || "Database error" }, { status: 500 });
  }
}
