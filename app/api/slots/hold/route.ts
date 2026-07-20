import { NextRequest, NextResponse } from "next/server";
import { holdSlots } from "@/lib/slotLock";

export async function POST(req: NextRequest) {
  const { email, date, times } = await req.json();

  if (!email || !date || !Array.isArray(times) || times.length === 0) {
    return NextResponse.json({ error: "email, date and a non-empty times array are required" }, { status: 400 });
  }

  const result = await holdSlots(email, date, times);

  if (!result) {
    return NextResponse.json({ error: "One or more of those slots was just taken. Pick again." }, { status: 409 });
  }

  return NextResponse.json(result); // { groupId, bookingIds }
}
