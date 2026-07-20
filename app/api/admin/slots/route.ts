import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";
import { getActiveSlotTemplates } from "@/lib/slots";
import { expireOldBookings } from "@/lib/cleanupExpired";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const date = req.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date query param is required (YYYY-MM-DD)" }, { status: 400 });
  }

  try {
    await expireOldBookings();

    const templates = await getActiveSlotTemplates();

    // Release stale holds so they don't show as booked
    await db.query(
      `DELETE FROM bookings WHERE slot_date = $1 AND status = 'held' AND held_until < now()`,
      [date]
    );

    const taken = await db.query(
      `SELECT slot_time, group_id, email, status
       FROM bookings
       WHERE slot_date = $1 AND status IN ('confirmed', 'held')`,
      [date]
    );

    const byTime = new Map(taken.rows.map((r) => [r.slot_time.slice(0, 5), r]));

    const slots = templates.map((t) => {
      const row = byTime.get(t.time);
      return row
        ? { time: t.time, pricePaise: t.pricePaise, available: false, groupId: row.group_id, email: row.email, status: row.status }
        : { time: t.time, pricePaise: t.pricePaise, available: true };
    });

    return NextResponse.json({ date, slots });
  } catch (err: any) {
    console.error("admin/slots error:", err);
    return NextResponse.json({ error: err.message || "Database error" }, { status: 500 });
  }
}
