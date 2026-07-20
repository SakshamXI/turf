"use client";

import { useEffect, useState } from "react";
import AdminSlotGrid, { AdminSlot } from "@/components/AdminSlotGrid";
import QrScanner from "@/components/QrScanner";
import { todayISO } from "@/lib/dateUtils";

interface Booking {
  group_id: string;
  email: string;
  slot_date: string;
  slot_times: string[];
  status: string;
  razorpay_payment_id: string | null;
  confirmed_at: string;
}

interface PromoCodeRow {
  code: string;
  discount_percent: number;
  active: boolean;
  created_at: string;
}

interface HolidayRow {
  holiday_date: string;
  reason: string | null;
}

interface TimeSlotRow {
  time: string;
  pricePaise: number;
  active: boolean;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<AdminSlot[]>([]);
  const [selectedForBooking, setSelectedForBooking] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [historyDateFilter, setHistoryDateFilter] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);

  const [promoCodes, setPromoCodes] = useState<PromoCodeRow[]>([]);
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoFormError, setPromoFormError] = useState("");

  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    kind: "valid" | "early" | "invalid";
    message: string;
    slotDate?: string;
    slotTimes?: string[];
  } | null>(null);

  const [holidays, setHolidays] = useState<HolidayRow[]>([]);
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayReason, setNewHolidayReason] = useState("");
  const [holidayBusy, setHolidayBusy] = useState(false);
  const [holidayFormError, setHolidayFormError] = useState("");

  const [timeSlots, setTimeSlots] = useState<TimeSlotRow[]>([]);
  const [newSlotTime, setNewSlotTime] = useState("");
  const [newSlotPrice, setNewSlotPrice] = useState("");
  const [slotFormBusy, setSlotFormBusy] = useState(false);
  const [slotFormError, setSlotFormError] = useState("");

  const [revenueFrom, setRevenueFrom] = useState(todayISO());
  const [revenueTo, setRevenueTo] = useState(todayISO());
  const [revenueResult, setRevenueResult] = useState<{ totalPaise: number; bookingCount: number } | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueError, setRevenueError] = useState("");

  async function loadSlots(forDate: string) {
    try {
      const res = await fetch(`/api/admin/slots?date=${forDate}`);
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Could not load slots");
        return;
      }
      setSlots(data.slots || []);
      setSelectedForBooking([]);
      setSelectedGroupId(null);
    } catch {
      setActionError("Could not reach the server. Check your database connection and try again.");
    }
  }

  async function loadHistory(forDate = historyDateFilter) {
    setHistoryLoading(true);
    try {
      const url = forDate ? `/api/admin/bookings?date=${forDate}` : "/api/admin/bookings";
      const res = await fetch(url);
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch {
      setActionError("Could not reach the server. Check your database connection and try again.");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadPromoCodes() {
    try {
      const res = await fetch("/api/admin/promo");
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const data = await res.json();
      setPromoCodes(data.codes || []);
    } catch {
      setActionError("Could not reach the server. Check your database connection and try again.");
    }
  }

  async function handleCreatePromo() {
    setPromoFormError("");
    if (!newCode.trim() || !newDiscount) {
      setPromoFormError("Enter both a code and a discount percentage");
      return;
    }
    setPromoBusy(true);
    try {
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newCode.trim(), discountPercent: Number(newDiscount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoFormError(data.error || "Could not create code");
        return;
      }
      setNewCode("");
      setNewDiscount("");
      await loadPromoCodes();
    } catch {
      setPromoFormError("Could not reach the server. Check your database connection and try again.");
    } finally {
      setPromoBusy(false);
    }
  }

  async function handleScan(scannedText: string) {
    setScanning(false);
    try {
      const res = await fetch(`/api/booking/${scannedText}`);
      if (!res.ok) {
        setScanResult({ kind: "invalid", message: "Not a real booking — this QR doesn't match anything." });
        return;
      }
      const data = await res.json();
      if (data.status === "cancelled") {
        setScanResult({ kind: "invalid", message: "This booking was cancelled. Do not admit." });
      } else if (data.status === "expired" || data.expired) {
        setScanResult({
          kind: "invalid",
          message: "This ticket's slot has already passed — expired ticket, do not admit.",
          slotDate: data.slotDate,
          slotTimes: data.slotTimes,
        });
      } else if (data.status !== "confirmed") {
        setScanResult({ kind: "invalid", message: `Booking exists but is not confirmed (status: ${data.status}).` });
      } else if (data.tooEarly) {
        setScanResult({
          kind: "early",
          message: `Valid ticket — entry at ${data.slotTimes?.[0]} on ${data.slotDate}.`,
          slotDate: data.slotDate,
          slotTimes: data.slotTimes,
        });
      } else {
        setScanResult({
          kind: "valid",
          message: "Valid ticket — paid and confirmed. Entry approved.",
          slotDate: data.slotDate,
          slotTimes: data.slotTimes,
        });
      }
    } catch {
      setScanResult({ kind: "invalid", message: "Could not check this code. Try again." });
    }
  }

  async function loadHolidays() {
    try {
      const res = await fetch("/api/admin/holidays");
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const data = await res.json();
      setHolidays(data.holidays || []);
    } catch {
      setActionError("Could not reach the server. Check your database connection and try again.");
    }
  }

  async function handleAddHoliday() {
    setHolidayFormError("");
    if (!newHolidayDate) {
      setHolidayFormError("Pick a date");
      return;
    }
    setHolidayBusy(true);
    try {
      const res = await fetch("/api/admin/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newHolidayDate, reason: newHolidayReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHolidayFormError(data.error || "Could not add holiday");
        return;
      }
      setNewHolidayDate("");
      setNewHolidayReason("");
      await loadHolidays();
    } catch {
      setHolidayFormError("Could not reach the server. Check your database connection and try again.");
    } finally {
      setHolidayBusy(false);
    }
  }

  async function handleRemoveHoliday(date: string) {
    try {
      const res = await fetch(`/api/admin/holidays/${date}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error || "Could not remove holiday");
        return;
      }
      await loadHolidays();
    } catch {
      setActionError("Could not reach the server. Check your database connection and try again.");
    }
  }

  async function loadTimeSlots() {
    try {
      const res = await fetch("/api/admin/time-slots");
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const data = await res.json();
      setTimeSlots(data.slots || []);
    } catch {
      setActionError("Could not reach the server. Check your database connection and try again.");
    }
  }

  async function handleAddTimeSlot() {
    setSlotFormError("");
    if (!newSlotTime || !newSlotPrice) {
      setSlotFormError("Enter both a time and a price");
      return;
    }
    setSlotFormBusy(true);
    try {
      const res = await fetch("/api/admin/time-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time: newSlotTime, pricePaise: Math.round(Number(newSlotPrice) * 100) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSlotFormError(data.error || "Could not save slot");
        return;
      }
      setNewSlotTime("");
      setNewSlotPrice("");
      await loadTimeSlots();
      await loadSlots(date);
    } catch {
      setSlotFormError("Could not reach the server. Check your database connection and try again.");
    } finally {
      setSlotFormBusy(false);
    }
  }

  async function handleToggleTimeSlot(time: string) {
    try {
      const res = await fetch(`/api/admin/time-slots/${time}`, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error || "Could not update slot");
        return;
      }
      await loadTimeSlots();
      await loadSlots(date);
    } catch {
      setActionError("Could not reach the server. Check your database connection and try again.");
    }
  }

  async function handleDeleteTimeSlot(time: string) {
    if (!confirm(`Remove the ${time} slot entirely? This won't affect existing bookings.`)) return;
    try {
      const res = await fetch(`/api/admin/time-slots/${time}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error || "Could not remove slot");
        return;
      }
      await loadTimeSlots();
      await loadSlots(date);
    } catch {
      setActionError("Could not reach the server. Check your database connection and try again.");
    }
  }

  async function loadRevenue(from: string, to: string) {
    setRevenueError("");
    setRevenueLoading(true);
    try {
      const res = await fetch(`/api/admin/revenue?from=${from}&to=${to}`);
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setRevenueError(data.error || "Could not calculate revenue");
        setRevenueResult(null);
        return;
      }
      setRevenueResult({ totalPaise: data.totalPaise, bookingCount: data.bookingCount });
    } catch {
      setRevenueError("Could not reach the server. Check your database connection and try again.");
    } finally {
      setRevenueLoading(false);
    }
  }

  function handleRevenueToday() {
    const t = todayISO();
    setRevenueFrom(t);
    setRevenueTo(t);
    loadRevenue(t, t);
  }

  function handleRevenueRange() {
    if (!revenueFrom || !revenueTo) {
      setRevenueError("Pick both a start and end date");
      return;
    }
    loadRevenue(revenueFrom, revenueTo);
  }

  async function handleTogglePromo(code: string) {
    try {
      const res = await fetch(`/api/admin/promo/${code}`, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error || "Could not update code");
        return;
      }
      await loadPromoCodes();
    } catch {
      setActionError("Could not reach the server. Check your database connection and try again.");
    }
  }

  useEffect(() => {
    fetch(`/api/admin/slots?date=${todayISO()}`).then((res) => {
      if (res.ok) {
        setAuthed(true);
        res.json().then((data) => setSlots(data.slots || []));
        loadHistory();
        loadPromoCodes();
        loadHolidays();
        loadTimeSlots();
        loadRevenue(todayISO(), todayISO());
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (authed) loadSlots(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useEffect(() => {
    if (authed) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyDateFilter]);

  async function handleLogin() {
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json();
      setLoginError(data.error || "Login failed");
      return;
    }
    setAuthed(true);
    loadSlots(date);
    loadHistory();
    loadPromoCodes();
    loadHolidays();
    loadTimeSlots();
    loadRevenue(todayISO(), todayISO());
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
  }

  function toggleBookingSlot(time: string) {
    setSelectedGroupId(null);
    setSelectedForBooking((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time].sort()
    );
  }

  function selectBookedSlot(slot: AdminSlot) {
    setSelectedForBooking([]);
    setSelectedGroupId((prev) => (prev === slot.groupId ? null : slot.groupId || null));
  }

  async function handleCreateBooking() {
    if (selectedForBooking.length === 0) return;
    setActionError("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, times: selectedForBooking, email: newEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Could not create booking");
        return;
      }
      setNewEmail("");
      await loadSlots(date);
      await loadHistory();
    } catch {
      setActionError("Could not reach the server. Check your database connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelSelected() {
    if (!selectedGroupId) return;
    if (!confirm("Cancel this booking and free up its slot(s)?")) return;
    setActionError("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: selectedGroupId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Could not cancel booking");
        return;
      }
      await loadSlots(date);
      await loadHistory();
    } catch {
      setActionError("Could not reach the server. Check your database connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!authed) {
    return (
      <section className="max-w-sm mx-auto px-6 py-24">
        <h1 className="font-display font-bold text-2xl text-pitchDark mb-6">Owner login</h1>
        <div className="card space-y-4">
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full border border-line/30 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-pitch"
          />
          {loginError && <p className="text-sm text-red-600">{loginError}</p>}
          <button onClick={handleLogin} className="btn-primary w-full">
            Log in
          </button>
        </div>
      </section>
    );
  }

  const selectedSlot = slots.find((s) => s.groupId === selectedGroupId);
  const slotsInSelectedGroup = slots.filter((s) => s.groupId === selectedGroupId).map((s) => s.time);

  return (
    <section className="max-w-5xl mx-auto px-6 py-16 space-y-16">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-3xl text-pitchDark">Owner dashboard</h1>
        <button onClick={handleLogout} className="text-sm text-pitchDark/60 underline">
          Log out
        </button>
      </div>

      {actionError && <p className="text-sm text-red-600 -mb-10">{actionError}</p>}

      {/* Verify a ticket via QR scan */}
      <div>
        <h2 className="font-display font-bold text-xl text-pitchDark mb-1">Verify a ticket</h2>
        <p className="text-pitchDark/60 text-sm mb-6">
          Scan a customer's QR code at the counter to check it's a real, paid booking before
          letting them in.
        </p>

        <div className="card space-y-4">
          {!scanning ? (
            <button
              onClick={() => {
                setScanResult(null);
                setScanning(true);
              }}
              className="btn-primary w-full"
            >
              Start scanning
            </button>
          ) : (
            <>
              <QrScanner active={scanning} onScan={handleScan} />
              <button
                onClick={() => setScanning(false)}
                className="w-full text-sm text-pitchDark/60 underline"
              >
                Cancel
              </button>
            </>
          )}

          {scanResult && (
            <div
              className={`rounded-lg p-4 text-sm ${
                scanResult.kind === "valid"
                  ? "bg-green-50 border border-green-300 text-green-800"
                  : scanResult.kind === "early"
                  ? "bg-blue-50 border border-blue-300 text-blue-800"
                  : "bg-warningBg border border-warning/20 text-warning"
              }`}
            >
              <p className="font-display font-medium mb-1">
                {scanResult.kind === "valid"
                  ? "✓ Valid — entry approved"
                  : scanResult.kind === "early"
                  ? "🕒 Valid ticket — not yet time"
                  : "✗ Not valid"}
              </p>
              <p>{scanResult.message}</p>
              {scanResult.kind !== "invalid" && scanResult.slotDate && (
                <p className="mt-2">
                  {scanResult.slotDate} · {scanResult.slotTimes?.join(", ")}
                </p>
              )}
              <button
                onClick={() => {
                  setScanResult(null);
                  setScanning(true);
                }}
                className="mt-3 underline"
              >
                Scan another
              </button>
            </div>
          )}
        </div>
      </div>


      {/* Manage slots for a date */}
      <div>
        <h2 className="font-display font-bold text-xl text-pitchDark mb-1">Manage slots</h2>
        <p className="text-pitchDark/60 text-sm mb-6">
          Click open (green) slots to book them for a walk-in. Click a booked (red) slot to select
          it, then cancel it to free it up.
        </p>

        <div className="card space-y-6">
          <div>
            <label className="block text-sm font-medium text-pitchDark mb-2">Date</label>
            <input
              type="date"
              min={todayISO()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-line/30 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-pitch"
            />
          </div>

          <AdminSlotGrid
            slots={slots}
            selectedForBooking={selectedForBooking}
            onToggleBooking={toggleBookingSlot}
            selectedGroupId={selectedGroupId}
            onSelectBooked={selectBookedSlot}
          />

          {/* Booking panel — shown when green slots are selected */}
          {selectedForBooking.length > 0 && (
            <div className="border-t border-line/10 pt-6 space-y-4">
              <p className="text-sm text-pitchDark/70">
                Booking {selectedForBooking.length} slot{selectedForBooking.length > 1 ? "s" : ""}:{" "}
                {selectedForBooking.join(", ")}
              </p>
              <div>
                <label className="block text-sm font-medium text-pitchDark mb-2">
                  Email address <span className="text-pitchDark/40">(optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full border border-line/30 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-pitch"
                />
              </div>
              <button onClick={handleCreateBooking} disabled={busy} className="btn-primary w-full">
                {busy ? "Booking..." : `Confirm booking`}
              </button>
            </div>
          )}

          {/* Cancel panel — shown when a red slot is selected */}
          {selectedGroupId && selectedSlot && (
            <div className="border-t border-line/10 pt-6 space-y-3 bg-warningBg -mx-6 -mb-6 px-6 py-6 rounded-b-xl">
              <p className="text-sm text-warning">
                This booking covers: <strong>{slotsInSelectedGroup.join(", ")}</strong>
                {selectedSlot.email && selectedSlot.email !== "walk-in" && (
                  <> · {selectedSlot.email}</>
                )}
                {selectedSlot.status === "held" && <> · currently held, not yet paid</>}
              </p>
              <button
                onClick={handleCancelSelected}
                disabled={busy}
                className="w-full py-3 rounded-md bg-warning text-cream font-display font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {busy ? "Cancelling..." : "Cancel this booking"}
              </button>
            </div>
          )}
        </div>
      </div>


      {/* Time slots & pricing */}
      <div>
        <h2 className="font-display font-bold text-xl text-pitchDark mb-1">Time slots & pricing</h2>
        <p className="text-pitchDark/60 text-sm mb-6">
          Add new bookable times and set a price for each one — prices can differ per slot (e.g.
          evenings priced higher than mornings). Removing a slot here doesn't affect bookings
          already made.
        </p>

        <div className="card space-y-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-pitchDark mb-2">Time</label>
              <input
                type="time"
                value={newSlotTime}
                onChange={(e) => setNewSlotTime(e.target.value)}
                className="border border-line/30 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-pitch"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-pitchDark mb-2">Price (₹)</label>
              <input
                type="number"
                min={1}
                placeholder="800"
                value={newSlotPrice}
                onChange={(e) => setNewSlotPrice(e.target.value)}
                className="border border-line/30 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-pitch w-28"
              />
            </div>
            <button onClick={handleAddTimeSlot} disabled={slotFormBusy} className="btn-primary">
              {slotFormBusy ? "Saving..." : "Add / update slot"}
            </button>
          </div>
          {slotFormError && <p className="text-sm text-red-600">{slotFormError}</p>}
          <p className="text-xs text-pitchDark/40">
            Tip: entering a time that already exists updates its price instead of duplicating it.
          </p>

          {timeSlots.length === 0 ? (
            <p className="text-pitchDark/60 text-sm">No time slots configured yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-6 -mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-pitchDark/60 border-t border-b border-line/10">
                    <th className="px-6 py-3 font-medium">Time</th>
                    <th className="px-6 py-3 font-medium">Price</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((s) => (
                    <tr key={s.time} className="border-b border-line/10 last:border-0">
                      <td className="px-6 py-3 font-medium">{s.time}</td>
                      <td className="px-6 py-3">₹{s.pricePaise / 100}</td>
                      <td className="px-6 py-3">
                        <span className={s.active ? "text-green-700" : "text-pitchDark/40"}>
                          {s.active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-6 py-3 space-x-3">
                        <button onClick={() => handleToggleTimeSlot(s.time)} className="text-pitch hover:underline">
                          {s.active ? "Disable" : "Enable"}
                        </button>
                        <button onClick={() => handleDeleteTimeSlot(s.time)} className="text-warning hover:underline">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Booking history */}
      <div>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h2 className="font-display font-bold text-xl text-pitchDark">Booking history</h2>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={historyDateFilter}
              onChange={(e) => setHistoryDateFilter(e.target.value)}
              className="border border-line/30 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pitch"
            />
            {historyDateFilter && (
              <button onClick={() => setHistoryDateFilter("")} className="text-sm text-pitchDark/60 underline">
                Clear
              </button>
            )}
          </div>
        </div>

        {historyLoading ? (
          <p className="text-pitchDark/60">Loading...</p>
        ) : bookings.length === 0 ? (
          <p className="text-pitchDark/60">No confirmed bookings{historyDateFilter ? " for that date" : ""}.</p>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-pitchDark/60 border-b border-line/10">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Slot(s)</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Payment ID</th>
                  <th className="px-4 py-3 font-medium">Confirmed at</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.group_id} className="border-b border-line/10 last:border-0">
                    <td className="px-4 py-3">{b.slot_date}</td>
                    <td className="px-4 py-3">{b.slot_times.join(", ")}</td>
                    <td className="px-4 py-3">{b.email}</td>
                    <td className="px-4 py-3 text-pitchDark/60">
                      {b.razorpay_payment_id || "cash / walk-in"}
                    </td>
                    <td className="px-4 py-3 text-pitchDark/60">
                      {new Date(b.confirmed_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revenue */}
      <div>
        <h2 className="font-display font-bold text-xl text-pitchDark mb-1">Revenue</h2>
        <p className="text-pitchDark/60 text-sm mb-6">
          Money actually received through online payments (Razorpay) in a date range. Walk-in/cash
          bookings aren't included here since that money never passed through the site.
        </p>

        <div className="card space-y-6">
          <div className="flex flex-wrap gap-3 items-end">
            <button
              onClick={handleRevenueToday}
              className="px-4 py-2 rounded-md border border-line/30 text-sm font-medium text-pitchDark hover:border-pitch"
            >
              Today
            </button>
            <div>
              <label className="block text-sm font-medium text-pitchDark mb-2">From</label>
              <input
                type="date"
                value={revenueFrom}
                onChange={(e) => setRevenueFrom(e.target.value)}
                className="border border-line/30 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-pitch"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-pitchDark mb-2">To</label>
              <input
                type="date"
                value={revenueTo}
                onChange={(e) => setRevenueTo(e.target.value)}
                className="border border-line/30 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-pitch"
              />
            </div>
            <button onClick={handleRevenueRange} disabled={revenueLoading} className="btn-primary">
              {revenueLoading ? "Calculating..." : "Calculate"}
            </button>
          </div>

          {revenueError && <p className="text-sm text-red-600">{revenueError}</p>}

          {revenueResult && !revenueError && (
            <div className="flex items-baseline justify-between pt-2 border-t border-line/10">
              <div>
                <p className="text-pitchDark/60 text-sm">
                  {revenueFrom === revenueTo ? revenueFrom : `${revenueFrom} to ${revenueTo}`} ·{" "}
                  {revenueResult.bookingCount} online booking{revenueResult.bookingCount === 1 ? "" : "s"}
                </p>
              </div>
              <p className="font-display font-bold text-3xl text-pitch">
                ₹{(revenueResult.totalPaise / 100).toLocaleString("en-IN")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Holidays */}
      <div>
        <h2 className="font-display font-bold text-xl text-pitchDark mb-1">Holidays</h2>
        <p className="text-pitchDark/60 text-sm mb-6">
          Mark dates the turf is closed. Customers won't be able to book on these dates at all.
        </p>

        <div className="card space-y-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-pitchDark mb-2">Date</label>
              <input
                type="date"
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                className="border border-line/30 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-pitch"
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-sm font-medium text-pitchDark mb-2">
                Reason <span className="text-pitchDark/40">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Diwali, maintenance, private event..."
                value={newHolidayReason}
                onChange={(e) => setNewHolidayReason(e.target.value)}
                className="w-full border border-line/30 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-pitch"
              />
            </div>
            <button onClick={handleAddHoliday} disabled={holidayBusy} className="btn-primary">
              {holidayBusy ? "Saving..." : "Add holiday"}
            </button>
          </div>
          {holidayFormError && <p className="text-sm text-red-600">{holidayFormError}</p>}

          {holidays.length === 0 ? (
            <p className="text-pitchDark/60 text-sm">No holidays set.</p>
          ) : (
            <div className="overflow-x-auto -mx-6 -mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-pitchDark/60 border-t border-b border-line/10">
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Reason</th>
                    <th className="px-6 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {holidays.map((h) => (
                    <tr key={h.holiday_date} className="border-b border-line/10 last:border-0">
                      <td className="px-6 py-3 font-medium">{h.holiday_date}</td>
                      <td className="px-6 py-3 text-pitchDark/70">{h.reason || "—"}</td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleRemoveHoliday(h.holiday_date)}
                          className="text-warning hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>


      {/* Discount codes */}
      <div>
        <h2 className="font-display font-bold text-xl text-pitchDark mb-1">Discount codes</h2>
        <p className="text-pitchDark/60 text-sm mb-6">
          Create a code and share it with customers — they enter it at checkout for the discount.
          Toggle a code off to stop it working without deleting its history.
        </p>

        <div className="card space-y-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-pitchDark mb-2">Code</label>
              <input
                type="text"
                placeholder="SAVE10"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className="border border-line/30 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-pitch w-40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-pitchDark mb-2">Discount %</label>
              <input
                type="number"
                min={1}
                max={100}
                placeholder="10"
                value={newDiscount}
                onChange={(e) => setNewDiscount(e.target.value)}
                className="border border-line/30 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-pitch w-28"
              />
            </div>
            <button onClick={handleCreatePromo} disabled={promoBusy} className="btn-primary">
              {promoBusy ? "Saving..." : "Add code"}
            </button>
          </div>
          {promoFormError && <p className="text-sm text-red-600">{promoFormError}</p>}

          {promoCodes.length === 0 ? (
            <p className="text-pitchDark/60 text-sm">No discount codes yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-6 -mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-pitchDark/60 border-t border-b border-line/10">
                    <th className="px-6 py-3 font-medium">Code</th>
                    <th className="px-6 py-3 font-medium">Discount</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {promoCodes.map((c) => (
                    <tr key={c.code} className="border-b border-line/10 last:border-0">
                      <td className="px-6 py-3 font-medium">{c.code}</td>
                      <td className="px-6 py-3">{c.discount_percent}%</td>
                      <td className="px-6 py-3">
                        <span className={c.active ? "text-green-700" : "text-pitchDark/40"}>
                          {c.active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <button onClick={() => handleTogglePromo(c.code)} className="text-pitch hover:underline">
                          {c.active ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </section>
  );
}
