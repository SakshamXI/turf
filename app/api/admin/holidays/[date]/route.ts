import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";

export async function DELETE(req: NextRequest, { params }: { params: { date: string } }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const result = await db.query(`DELETE FROM holidays WHERE holiday_date = $1 RETURNING holiday_date`, [
      params.date,
    ]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("admin/holidays/[date] error:", err);
    return NextResponse.json({ error: err.message || "Database error" }, { status: 500 });
  }
}
