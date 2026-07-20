import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const result = await db.query(
      `SELECT code, discount_percent, active, created_at FROM promo_codes ORDER BY created_at DESC`
    );
    return NextResponse.json({ codes: result.rows });
  } catch (err: any) {
    console.error("admin/promo GET error:", err);
    return NextResponse.json({ error: err.message || "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { code, discountPercent } = await req.json();

  if (!code || !discountPercent) {
    return NextResponse.json({ error: "code and discountPercent are required" }, { status: 400 });
  }
  const percent = Number(discountPercent);
  if (!Number.isInteger(percent) || percent <= 0 || percent > 100) {
    return NextResponse.json({ error: "discountPercent must be a whole number between 1 and 100" }, { status: 400 });
  }

  try {
    await db.query(
      `INSERT INTO promo_codes (code, discount_percent) VALUES ($1, $2)
       ON CONFLICT (code) DO UPDATE SET discount_percent = $2, active = true`,
      [code.trim().toUpperCase(), percent]
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("admin/promo POST error:", err);
    return NextResponse.json({ error: err.message || "Database error" }, { status: 500 });
  }
}
