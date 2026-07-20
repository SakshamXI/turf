"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PaymentButton from "@/components/PaymentButton";

export default function PaymentPage() {
  const router = useRouter();
  const [groupId, setGroupId] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const g = sessionStorage.getItem("turf_group_id");
    const p = sessionStorage.getItem("turf_email");
    const d = sessionStorage.getItem("turf_date");
    const t = sessionStorage.getItem("turf_times");
    if (!g || !p || !d || !t) {
      router.replace("/book");
      return;
    }
    setGroupId(g);
    setEmail(p);
    setDate(d);
    setTimes(JSON.parse(t));
  }, [router]);

  function handleSuccess(result: { groupId: string }) {
    router.push(`/confirmation?groupId=${result.groupId}`);
  }

  // ===== DEV-ONLY BLOCK — safe to delete this whole function before deploying =====
  async function skipPaymentDevOnly() {
    setError("");
    const res = await fetch("/api/dev/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not confirm booking");
      return;
    }
    router.push(`/confirmation?groupId=${data.groupId}`);
  }
  // ===== END DEV-ONLY BLOCK =====

  return (
    <section className="max-w-md mx-auto px-6 py-16">
      <h1 className="font-display font-bold text-3xl text-pitchDark mb-2">Complete payment</h1>
      <p className="text-pitchDark/60 mb-8">
        {date} · {times.join(", ")} — held for you for the next 5 minutes
      </p>

      <div className="card">
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        {groupId && (
          <PaymentButton groupId={groupId} email={email} onSuccess={handleSuccess} onError={setError} />
        )}

        {/* ===== DEV-ONLY BLOCK — safe to delete before deploying ===== */}
        {process.env.NODE_ENV !== "production" && groupId && (
          <button
            onClick={skipPaymentDevOnly}
            className="w-full text-xs text-pitchDark/40 underline hover:text-pitchDark/70 mt-4"
          >
            Skip payment (dev only — no Razorpay needed)
          </button>
        )}
        {/* ===== END DEV-ONLY BLOCK ===== */}
      </div>
    </section>
  );
}
