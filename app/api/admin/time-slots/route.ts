import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";
import { getAllSlotTemplates } from "@/lib/slots";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const slots = await getAllSlotTemplates();
    return NextResponse.json({ slots });
  } catch (err: any) {
    console.error("admin/time-slots GET error:", err);
    return NextResponse.json({ error: err.message || "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { time, pricePaise } = await req.json();

  if (!time || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return NextResponse.json({ error: "time must be in HH:MM 24-hour format" }, { status: 400 });
  }
  const price = Number(pricePaise);
  if (!Number.isInteger(price) || price <= 0) {
    return NextResponse.json({ error: "pricePaise must be a positive whole number" }, { status: 400 });
  }

  try {
    await db.query(
      `INSERT INTO time_slots (slot_time, price_paise) VALUES ($1, $2)
       ON CONFLICT (slot_time) DO UPDATE SET price_paise = $2, active = true`,
      [time, price]
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("admin/time-slots POST error:", err);
    return NextResponse.json({ error: err.message || "Database error" }, { status: 500 });
  }
}
