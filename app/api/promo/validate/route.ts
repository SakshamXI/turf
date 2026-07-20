import { NextRequest, NextResponse } from "next/server";
import { getActivePromo } from "@/lib/promo";

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  if (!code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  try {
    const promo = await getActivePromo(code);
    if (!promo) {
      return NextResponse.json({ error: "Invalid or expired promo code" }, { status: 404 });
    }
    return NextResponse.json({ code: promo.code, discountPercent: promo.discount_percent });
  } catch (err: any) {
    console.error("promo/validate error:", err);
    return NextResponse.json({ error: err.message || "Database error" }, { status: 500 });
  }
}
