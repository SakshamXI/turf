import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";

export async function PATCH(req: NextRequest, { params }: { params: { code: string } }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const result = await db.query(
      `UPDATE promo_codes SET active = NOT active WHERE code = $1 RETURNING code, active`,
      [params.code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Code not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...result.rows[0] });
  } catch (err: any) {
    console.error("admin/promo/[code] error:", err);
    return NextResponse.json({ error: err.message || "Database error" }, { status: 500 });
  }
}
