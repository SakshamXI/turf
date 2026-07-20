import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { adminCancelBooking } from "@/lib/adminBooking";

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { groupId } = await req.json();

  if (!groupId) {
    return NextResponse.json({ error: "groupId is required" }, { status: 400 });
  }

  const freed = await adminCancelBooking(groupId);

  if (freed === 0) {
    return NextResponse.json({ error: "Booking not found or already cancelled" }, { status: 404 });
  }

  return NextResponse.json({ success: true, freed });
}
