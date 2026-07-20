import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { generateTicketQrBuffer, ticketEmailHtml } from "@/lib/generateTicket";
import { sendTicketEmail } from "@/lib/sendMessage";

export async function POST(req: NextRequest) {
  const {
    groupId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = await req.json();

  if (!groupId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }

  // This is the step that actually proves payment happened — never trust
  // a "success" flag sent from the browser alone.
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  const result = await db.query(
    `UPDATE bookings
     SET status = 'confirmed', razorpay_payment_id = $1, confirmed_at = now()
     WHERE group_id = $2 AND razorpay_order_id = $3
     RETURNING id, email, slot_date::text AS slot_date, slot_time`,
    [razorpay_payment_id, groupId, razorpay_order_id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Booking not found or already processed" }, { status: 404 });
  }

  const bookings = result.rows;
  const email = bookings[0].email;
  const slotDate = bookings[0].slot_date;
  const slotTimes = bookings.map((b) => b.slot_time).sort();

  const qrBuffer = await generateTicketQrBuffer(groupId);
  const qrDataUrl = `data:image/png;base64,${qrBuffer.toString("base64")}`;

  const html = ticketEmailHtml({
    groupId,
    slotDate,
    slotTimes,
    turfName: process.env.TURF_NAME || "Turf Arena",
    turfAddress: process.env.TURF_ADDRESS || "",
  });

  await sendTicketEmail(email, html, qrBuffer);

  return NextResponse.json({
    success: true,
    groupId,
    slotDate,
    slotTimes,
    qrDataUrl,
  });
}