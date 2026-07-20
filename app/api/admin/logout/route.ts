import { NextResponse } from "next/server";
import { clearCookie } from "@/lib/adminAuth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.headers.set("Set-Cookie", clearCookie());
  return res;
}
