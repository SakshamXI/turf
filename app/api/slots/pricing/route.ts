import { NextResponse } from "next/server";
import { getActiveSlotTemplates } from "@/lib/slots";

export async function GET() {
  try {
    const slots = await getActiveSlotTemplates();
    return NextResponse.json({ slots });
  } catch (err: any) {
    console.error("slots/pricing error:", err);
    return NextResponse.json({ error: err.message || "Database error" }, { status: 500 });
  }
}
