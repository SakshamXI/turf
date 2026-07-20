"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SlotPrice {
  time: string;
  pricePaise: number;
}

const faqs = [
  {
    q: "Is the price the same for every slot?",
    a: "Prices can vary by time of day — check the table above for the exact rate for each slot.",
  },
  {
    q: "Can I book more than one slot at a time?",
    a: "Yes. Select multiple time slots on the booking page and pay for all of them together in one payment.",
  },
  {
    q: "What payment methods are accepted?",
    a: "UPI, debit/credit cards, and net banking, via Razorpay's secure checkout.",
  },
  {
    q: "Is it refundable?",
    a: "No — once a slot is booked and paid for, it's non-refundable, including for no-shows or late arrival.",
  },
];

export default function PricingPage() {
  const [slots, setSlots] = useState<SlotPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/slots/pricing")
      .then((r) => r.json())
      .then((data) => setSlots(data.slots || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <p className="section-label">Simple, upfront pricing</p>
      <h1 className="font-display font-bold text-4xl text-pitchDark mb-6">Pricing</h1>
      <p className="text-pitchDark/70 max-w-xl mb-12">
        Rates by time slot, no hidden charges, no surprise fees at the counter.
      </p>

      {loading ? (
        <p className="text-pitchDark/60 mb-16">Loading current rates...</p>
      ) : (
        <div className="card mb-16 divide-y divide-line/10">
          {slots.map((s) => (
            <div key={s.time} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <span className="text-pitchDark font-medium">{s.time}</span>
              <span className="font-display font-bold text-pitch">₹{s.pricePaise / 100}</span>
            </div>
          ))}
        </div>
      )}

      <Link href="/book" className="btn-primary inline-block mb-16">
        Book a slot
      </Link>

      <h2 className="font-display font-bold text-2xl text-pitchDark mb-6">Common questions</h2>
      <div className="space-y-6">
        {faqs.map((item) => (
          <div key={item.q} className="border-b border-line/10 pb-6 last:border-0">
            <p className="font-display font-medium text-pitchDark mb-1">{item.q}</p>
            <p className="text-pitchDark/70 text-sm">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
