import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateTicketQr } from "@/lib/generateTicket";
import { expireOldBookings } from "@/lib/cleanupExpired";

// [id] here is the group_id — a booking may cover several slots.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await expireOldBookings();

  const result = await db.query(
    `SELECT id, status, slot_date::text AS slot_date, slot_time, confirmed_at FROM bookings WHERE group_id = $1 ORDER BY slot_time`,
    [params.id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const rows = result.rows;
  const allConfirmed = rows.every((r) => r.status === "confirmed");
  const qrDataUrl = allConfirmed ? await generateTicketQr(params.id) : null;

  // Valid entry window is [slot start, slot end) for the exact booked date —
  // not any time before, not any time after. Each slot is treated as
  // lasting 1 hour. Times are anchored to +05:30 (India) explicitly,
  // regardless of what timezone the server itself runs in.
  //
  // dateStr comes straight from the ::text cast above — a plain
  // "YYYY-MM-DD" string. Never reconstruct this from a JS Date object:
  // node-postgres normally parses DATE columns into a Date built in the
  // SERVER PROCESS'S LOCAL timezone, and calling .toISOString() on that
  // (which is UTC-based) silently shifts the date back a day whenever the
  // server's local timezone is ahead of UTC — which IST always is. That
  // was the actual cause of tickets showing "expired" incorrectly.
  const dateStr = rows[0].slot_date;

  const slotStarts = rows.map((r) => {
    const [h, m] = r.slot_time.slice(0, 5).split(":").map(Number);
    return new Date(`${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+05:30`);
  });
  const slotEnds = slotStarts.map((s) => new Date(s.getTime() + 60 * 60 * 1000));

  const earliestStart = new Date(Math.min(...slotStarts.map((d) => d.getTime())));
  const latestEnd = new Date(Math.max(...slotEnds.map((d) => d.getTime())));

  const now = new Date();
  const expired = now >= latestEnd;
  const tooEarly = now < earliestStart;

  return NextResponse.json({
    groupId: params.id,
    status: allConfirmed ? "confirmed" : rows[0].status,
    slotDate: dateStr,
    slotTimes: rows.map((r) => r.slot_time),
    qrDataUrl,
    expired,
    tooEarly,
  });
}
