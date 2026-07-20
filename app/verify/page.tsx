"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EmailInput from "@/components/EmailInput";
import OtpInput from "@/components/OtpInput";

export default function VerifyPage() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const d = sessionStorage.getItem("turf_date");
    const t = sessionStorage.getItem("turf_times");
    if (!d || !t) {
      router.replace("/book");
      return;
    }
    setDate(d);
    setTimes(JSON.parse(t));
  }, [router]);

  async function sendOtp() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setError("");
    setLoading(true);
    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not send the code");
      return;
    }
    setOtpSent(true);
  }

  async function verifyAndHold() {
    if (otp.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setError("");
    setLoading(true);

    const verifyRes = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) {
      setLoading(false);
      setError(verifyData.error || "Incorrect code");
      return;
    }

    const holdRes = await fetch("/api/slots/hold", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, date, times }),
    });
    const holdData = await holdRes.json();
    setLoading(false);
    if (!holdRes.ok) {
      setError(holdData.error || "One or more of those slots is no longer available");
      return;
    }

    sessionStorage.setItem("turf_email", email);
    sessionStorage.setItem("turf_group_id", holdData.groupId);
    router.push("/payment");
  }

  // ===== DEV-ONLY BLOCK — safe to delete this whole function before deploying =====
  async function skipOtpDevOnly() {
    setError("");
    setLoading(true);
    const useEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "test@example.com";

    const holdRes = await fetch("/api/slots/hold", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: useEmail, date, times }),
    });
    const holdData = await holdRes.json();
    setLoading(false);
    if (!holdRes.ok) {
      setError(holdData.error || "One or more of those slots is no longer available");
      return;
    }

    sessionStorage.setItem("turf_email", useEmail);
    sessionStorage.setItem("turf_group_id", holdData.groupId);
    router.push("/payment");
  }
  // ===== END DEV-ONLY BLOCK =====

  return (
    <section className="max-w-md mx-auto px-6 py-16">
      <h1 className="font-display font-bold text-3xl text-pitchDark mb-2">Verify your email</h1>
      <p className="text-pitchDark/60 mb-8">
        {date} · {times.join(", ")}
      </p>

      <div className="card space-y-6">
        <EmailInput value={email} onChange={setEmail} disabled={otpSent} />

        {otpSent && (
          <div>
            <label className="block text-sm font-medium text-pitchDark mb-2">Enter the code we emailed you</label>
            <OtpInput value={otp} onChange={setOtp} />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!otpSent ? (
          <button onClick={sendOtp} disabled={loading} className="btn-primary w-full">
            {loading ? "Sending..." : "Send code"}
          </button>
        ) : (
          <button onClick={verifyAndHold} disabled={loading} className="btn-primary w-full">
            {loading ? "Verifying..." : "Verify and continue"}
          </button>
        )}

        {/* ===== DEV-ONLY BLOCK — safe to delete before deploying ===== */}
        {process.env.NODE_ENV !== "production" && (
          <button
            onClick={skipOtpDevOnly}
            disabled={loading}
            className="w-full text-xs text-pitchDark/40 underline hover:text-pitchDark/70"
          >
            Skip verification (dev only — no Resend needed)
          </button>
        )}
        {/* ===== END DEV-ONLY BLOCK ===== */}
      </div>
    </section>
  );
}
