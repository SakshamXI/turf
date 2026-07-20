import QRCode from "qrcode";

export interface TicketData {
  groupId: string;
  slotDate: string;
  slotTimes: string[];
}

/**
 * Raw QR PNG bytes — used both as the email attachment (referenced via
 * cid:qr-code in the HTML) and to build a data URL for on-site display.
 */
export async function generateTicketQrBuffer(groupId: string): Promise<Buffer> {
  return QRCode.toBuffer(groupId, { margin: 1, width: 300 });
}

/**
 * Data URL version — fine for the website (browsers render data: URIs
 * without issue), but NOT used for email — most email clients (Gmail,
 * and Outlook entirely) block or fail to render base64 images embedded
 * directly in HTML. Email uses generateTicketQrBuffer() + CID attachment
 * instead — see lib/sendMessage.ts.
 */
export async function generateTicketQr(groupId: string): Promise<string> {
  const buffer = await generateTicketQrBuffer(groupId);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

export function ticketEmailHtml(data: TicketData & { turfName: string; turfAddress: string }) {
  const times = data.slotTimes.join(", ");
  return `
    <div style="font-family: sans-serif; max-width: 420px; margin: auto; text-align: center;">
      <p style="text-transform: uppercase; letter-spacing: 2px; color:#F2A93B; font-size: 12px; font-weight: 600;">
        Booking confirmed
      </p>
      <h2 style="color:#1B4332; margin: 4px 0 16px;">${data.turfName}</h2>
      <p style="font-size: 18px; font-weight: bold; color:#0E2B22; margin-bottom: 4px;">${data.slotDate}</p>
      <p style="color:#333; margin-top: 0;">${times}</p>
      <img src="cid:qr-code" alt="Booking QR code" width="220" height="220" style="margin: 16px 0;" />
      <p style="color:#666; font-size: 13px;">Show this email or the QR code above at the counter.</p>
      <p style="color:#999; font-size: 12px; word-break: break-all;">Booking ID: ${data.groupId}</p>
      <p style="color:#999; font-size: 12px;">${data.turfAddress}</p>
    </div>
  `;
}