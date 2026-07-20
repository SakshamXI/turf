"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SlotGrid from "@/components/SlotGrid";
import { todayISO } from "@/lib/dateUtils";

export default function BookPage() {
  const router = useRouter();
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [holiday, setHoliday] = useState<{ closed: boolean; reason?: string }>({ closed: false });
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoading(true);
    setSelected([]);
    setLoadError("");
    fetch(`/api/slots/available?date=${date}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setLoadError(data.error || "Could not load slots for this date.");
          setSlots([]);
          return;
        }
        setSlots(data.slots || []);
        setHoliday({ closed: !!data.holiday, reason: data.reason });
      })
      .catch(() => setLoadError("Could not reach the server. Check your connection and try again."))
      .finally(() => setLoading(false));
  }, [date]);

  function toggleSlot(time: string) {
    setSelected((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time].sort()
    );
  }

  function handleContinue() {
    if (selected.length === 0) return;
    sessionStorage.setItem("turf_date", date);
    sessionStorage.setItem("turf_times", JSON.stringify(selected));
    router.push("/verify");
  }

  return (
    <section className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="font-display font-bold text-3xl text-pitchDark mb-8">Pick your slots</h1>

      <label htmlFor="date" className="block text-sm font-medium text-pitchDark mb-2">
        Date
      </label>
      <input
        id="date"
        type="date"
        min={todayISO()}
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="border border-line/30 rounded-md px-3 py-2 mb-8 outline-none focus:ring-2 focus:ring-pitch"
      />

      {loading ? (
        <p className="text-pitchDark/60">Loading slots...</p>
      ) : loadError ? (
        <p className="text-sm text-red-600">{loadError}</p>
      ) : holiday.closed ? (
        <div className="bg-warningBg border border-warning/20 rounded-lg p-5">
          <p className="font-display font-medium text-warning mb-1">Closed on this date</p>
          <p className="text-warning/90 text-sm">
            {holiday.reason || "The turf is closed on this date. Please pick another day."}
          </p>
        </div>
      ) : (
        <SlotGrid slots={slots} selected={selected} onToggle={toggleSlot} />
      )}

      {!holiday.closed && (
        <p className="text-sm text-pitchDark/60 mt-6">
          {selected.length === 0
            ? "Select one or more slots"
            : `${selected.length} slot${selected.length > 1 ? "s" : ""} selected: ${selected.join(", ")}`}
        </p>
      )}

      <button
        onClick={handleContinue}
        disabled={selected.length === 0 || holiday.closed}
        className="btn-primary mt-6 w-full"
      >
        Continue
      </button>
    </section>
  );
}
