import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otpProvider";

export async function POST(req: NextRequest) {
  const { email, otp } = await req.json();

  if (!email || !otp) {
    return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
  }

  const result = await verifyOtp(email, otp);

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 401 });
  }

  // Verified — the client proceeds to slot selection carrying this email.
  // Every later step (hold, order, verify) re-checks it server-side, so
  // nothing downstream trusts the client alone.
  return NextResponse.json({ success: true, email });
}
