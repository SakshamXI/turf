"use client";

import { useState } from "react";
import PolicyModal from "./PolicyModal";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Props {
  groupId: string;
  email: string;
  onSuccess: (result: { groupId: string; slotDate: string; slotTimes: string[]; qrDataUrl: string }) => void;
  onError: (message: string) => void;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentButton({ groupId, email, onSuccess, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [checkingPromo, setCheckingPromo] = useState(false);

  async function handleApplyPromo() {
    if (!promoInput.trim()) return;
    setPromoError("");
    setCheckingPromo(true);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error || "Invalid promo code");
        setAppliedPromo(null);
        return;
      }
      setAppliedPromo({ code: data.code, discountPercent: data.discountPercent });
    } catch {
      setPromoError("Could not check that code. Try again.");
    } finally {
      setCheckingPromo(false);
    }
  }

  function removePromo() {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
  }

  async function handlePay() {
    setLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        onError("Could not load payment gateway. Check your connection.");
        return;
      }

      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, promoCode: appliedPromo?.code }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) {
        onError(order.error || "Could not start payment");
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Game on Arena",
        description: `Slot booking (${order.slotCount} slot${order.slotCount > 1 ? "s" : ""})`,
        prefill: { email },
        theme: { color: "#1B4332" },
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const result = await verifyRes.json();
          if (!verifyRes.ok) {
            onError(result.error || "Payment could not be verified");
            return;
          }
          onSuccess(result);
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.open();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-4">
        {!appliedPromo ? (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Promo code"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
              className="flex-1 border border-line/30 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pitch"
            />
            <button
              onClick={handleApplyPromo}
              disabled={checkingPromo || !promoInput.trim()}
              className="px-4 py-2 rounded-md border border-line/30 text-sm font-medium text-pitchDark hover:border-pitch disabled:opacity-40"
            >
              {checkingPromo ? "Checking..." : "Apply"}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-green-50 border border-green-300 rounded-md px-3 py-2 text-sm">
            <span className="text-green-800">
              <strong>{appliedPromo.code}</strong> applied — {appliedPromo.discountPercent}% off
            </span>
            <button onClick={removePromo} className="text-green-800/60 hover:text-green-800 underline">
              Remove
            </button>
          </div>
        )}
        {promoError && <p className="text-xs text-red-600 mt-1">{promoError}</p>}
      </div>

      <button onClick={() => setShowPolicy(true)} disabled={loading} className="btn-primary w-full">
        {loading ? "Opening payment..." : "Pay and confirm"}
      </button>

      {showPolicy && (
        <PolicyModal
          onCancel={() => setShowPolicy(false)}
          onAccept={() => {
            setShowPolicy(false);
            handlePay();
          }}
        />
      )}
    </>
  );
}
