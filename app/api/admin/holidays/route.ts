import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const result = await db.query(
      `SELECT holiday_date::text AS holiday_date, reason FROM holidays ORDER BY holiday_date ASC`
    );
    return NextResponse.json({ holidays: result.rows });
  } catch (err: any) {
    console.error("admin/holidays GET error:", err);
    return NextResponse.json({ error: err.message || "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { date, reason } = await req.json();

  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  try {
    await db.query(
      `INSERT INTO holidays (holiday_date, reason) VALUES ($1, $2)
       ON CONFLICT (holiday_date) DO UPDATE SET reason = $2`,
      [date, reason || null]
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("admin/holidays POST error:", err);
    return NextResponse.json({ error: err.message || "Database error" }, { status: 500 });
  }
}
