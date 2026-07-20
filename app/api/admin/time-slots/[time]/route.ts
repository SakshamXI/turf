import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";

export async function PATCH(req: NextRequest, { params }: { params: { time: string } }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const result = await db.query(
      `UPDATE time_slots SET active = NOT active WHERE slot_time = $1 RETURNING slot_time, active`,
      [params.time]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, ...result.rows[0] });
  } catch (err: any) {
    console.error("admin/time-slots/[time] PATCH error:", err);
    return NextResponse.json({ error: err.message || "Database error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { time: string } }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const result = await db.query(`DELETE FROM time_slots WHERE slot_time = $1 RETURNING slot_time`, [
      params.time,
    ]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("admin/time-slots/[time] DELETE error:", err);
    return NextResponse.json({ error: err.message || "Database error" }, { status: 500 });
  }
}
