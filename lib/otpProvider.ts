// Email OTP via Resend. Unlike MSG91 (which generated and checked the code
// for you), Resend only sends email — so this file generates the 6-digit
// code, stores it briefly in email_otps, and checks it on verify.

import { db } from "./db";
import { resend, FROM_ADDRESS } from "./resend";

const CODE_TTL_MINUTES = 10;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtp(email: string): Promise<{ success: boolean; message?: string }> {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
  const normalizedEmail = email.trim().toLowerCase();

  await db.query(
    `INSERT INTO email_otps (email, code, expires_at, created_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (email) DO UPDATE SET code = $2, expires_at = $3, created_at = now()`,
    [normalizedEmail, code, expiresAt]
  );

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: normalizedEmail,
      subject: "Your verification code",
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: auto;">
          <h2 style="color:#1B4332;">Game on Arena</h2>
          <p>Your verification code is:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color:#1B4332;">${code}</p>
          <p style="color:#666; font-size: 13px;">This code expires in ${CODE_TTL_MINUTES} minutes. If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Resend send error:", err);
    return { success: false, message: "Could not send the email. Check the address and try again." };
  }

  return { success: true };
}

export async function verifyOtp(email: string, code: string): Promise<{ success: boolean; message?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  const result = await db.query(`SELECT code, expires_at FROM email_otps WHERE email = $1`, [normalizedEmail]);

  if (result.rows.length === 0) {
    return { success: false, message: "No code was sent to this email. Request a new one." };
  }

  const row = result.rows[0];

  if (new Date(row.expires_at) < new Date()) {
    return { success: false, message: "That code has expired. Request a new one." };
  }

  if (row.code !== code) {
    return { success: false, message: "Incorrect code." };
  }

  // One-time use — remove it once successfully verified.
  await db.query(`DELETE FROM email_otps WHERE email = $1`, [normalizedEmail]);

  return { success: true };
}
