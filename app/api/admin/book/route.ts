import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { adminCreateBooking } from "@/lib/adminBooking";

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { date, times, email } = await req.json();

  if (!date || !Array.isArray(times) || times.length === 0) {
    return NextResponse.json({ error: "date and a non-empty times array are required" }, { status: 400 });
  }

  try {
    const groupId = await adminCreateBooking(date, times, email || "");

    if (!groupId) {
      return NextResponse.json({ error: "One or more of those slots is already taken" }, { status: 409 });
    }

    return NextResponse.json({ success: true, groupId });
  } catch (err: any) {
    console.error("admin/book error:", err);
    return NextResponse.json({ error: err.message || "Database error" }, { status: 500 });
  }
}
