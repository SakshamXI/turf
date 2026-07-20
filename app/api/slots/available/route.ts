import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getActiveSlotTemplates } from "@/lib/slots";
import { getIstNow } from "@/lib/dateUtils";
import { checkHoliday } from "@/lib/holidays";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "date query param is required (YYYY-MM-DD)" }, { status: 400 });
  }

  try {
    const templates = await getActiveSlotTemplates();

    const holidayCheck = await checkHoliday(date);
    if (holidayCheck.holiday) {
      return NextResponse.json({
        date,
        holiday: true,
        reason: holidayCheck.reason,
        slots: templates.map((t) => ({ time: t.time, pricePaise: t.pricePaise, available: false })),
      });
    }

    // Release stale holds so they don't show as unavailable
    await db.query(
      `DELETE FROM bookings WHERE slot_date = $1 AND status = 'held' AND held_until < now()`,
      [date]
    );

    const taken = await db.query(
      `SELECT slot_time FROM bookings WHERE slot_date = $1 AND status IN ('confirmed', 'held')`,
      [date]
    );
    const takenTimes = new Set(taken.rows.map((r) => r.slot_time.slice(0, 5)));

    // For today, any slot whose start time has already passed shouldn't be
    // bookable even if nobody took it.
    const { date: istToday, time: istNowTime } = getIstNow();

    const slots = templates.map((t) => {
      const isPast = date <= istToday && (date < istToday || t.time <= istNowTime);
      return {
        time: t.time,
        pricePaise: t.pricePaise,
        available: !takenTimes.has(t.time) && !isPast,
      };
    });

    return NextResponse.json({ date, holiday: false, slots });
  } catch (err: any) {
    console.error("slots/available error:", err);
    return NextResponse.json({ error: err.message || "Database error" }, { status: 500 });
  }
}
