import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

// Update this once you've verified your own domain in Resend — until then,
// Resend's shared "onboarding@resend.dev" address works for testing but
// looks unprofessional and has stricter sending limits.
export const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || "Game on Arena <onboarding@resend.dev>";
