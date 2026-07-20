import crypto from "crypto";
import { NextRequest } from "next/server";

const COOKIE_NAME = "admin_session";

function expectedToken() {
  return crypto
    .createHmac("sha256", process.env.ADMIN_PASSWORD || "")
    .update("admin-session")
    .digest("hex");
}

export function sessionCookie() {
  return `${COOKIE_NAME}=${expectedToken()}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;
}

export function clearCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}

export function isAdminRequest(req: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) return false;
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  return cookie === expectedToken();
}
