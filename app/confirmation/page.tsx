"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import TicketCard from "@/components/TicketCard";

interface Booking {
  groupId: string;
  slotDate: string;
  slotTimes: string[];
  status: string;
  qrDataUrl: string | null;
}

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const groupId = searchParams.get("groupId");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }
    fetch(`/api/booking/${groupId}`)
      .then((r) => r.json())
      .then(setBooking)
      .finally(() => setLoading(false));
  }, [groupId]);

  return (
    <section className="max-w-md mx-auto px-6 py-16">
      {loading && <p className="text-center text-pitchDark/60">Loading your ticket...</p>}

      {!loading && !booking?.qrDataUrl && (
        <p className="text-center text-pitchDark/60">
          We couldn't find that booking, or payment is still processing.
        </p>
      )}

      {booking?.qrDataUrl && (
        <TicketCard
          groupId={booking.groupId}
          slotDate={booking.slotDate}
          slotTimes={booking.slotTimes}
          qrDataUrl={booking.qrDataUrl}
        />
      )}
    </section>
  );
}
