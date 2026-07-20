// Sends the final ticket to the customer's email via Resend.
//
// The QR code is sent as an inline CID attachment (not a base64 data: URI
// embedded in the HTML) — Outlook blocks base64 images entirely, and Gmail
// frequently strips or fails to render them too. CID attachments actually
// display reliably across clients. The HTML references it with
// <img src="cid:qr-code" /> — see lib/generateTicket.ts.

import { resend, FROM_ADDRESS } from "./resend";

export async function sendTicketEmail(email: string, html: string, qrBuffer: Buffer) {
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Your booking is confirmed — ticket inside",
      html,
      attachments: [
        {
          filename: "ticket-qr.png",
          content: qrBuffer,
          contentId: "qr-code",
        },
      ],
    });
  } catch (err) {
    console.error("Failed to send ticket email:", err);
  }
}