"use client";

import { useState } from "react";

const GRIEVANCE_EMAIL = "grievances@greenfieldturf.com";

function gmailComposeUrl(email: string, subject: string) {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    email
  )}&su=${encodeURIComponent(subject)}`;
}

export default function GrievanceContact() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(GRIEVANCE_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail on some browsers/permissions — the email
      // is still visible on screen for the person to select and copy manually.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={gmailComposeUrl(GRIEVANCE_EMAIL, "Grievance")}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-outline inline-block"
      >
        Email a grievance
      </a>
      <a
        href={`mailto:${GRIEVANCE_EMAIL}?subject=Grievance`}
        className="text-sm text-cream/70 underline hover:text-floodlight transition-colors"
      >
        
      </a>
      <button
        onClick={handleCopy}
        className="text-sm text-cream/70 underline hover:text-floodlight transition-colors"
      >
        {copied ? "Copied!" : `Or copy: ${GRIEVANCE_EMAIL}`}
      </button>
    </div>
  );
}
