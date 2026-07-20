/**
 * Returns today's date as YYYY-MM-DD using the browser's LOCAL calendar
 * date, not UTC. `new Date().toISOString()` always converts to UTC, which
 * is wrong for anyone in a timezone ahead of UTC (like India, UTC+5:30):
 * between midnight and 5:30 AM local time, toISOString() still reports
 * *yesterday's* date, silently saving bookings one day off.
 */
export function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns the current India (Asia/Kolkata) date and time, regardless of
 * what timezone the server itself runs in (e.g. Vercel runs UTC). Used to
 * grey out today's slots whose start time has already passed — a slot at
 * 17:00 shouldn't still look bookable at 17:30.
 */
export function getIstNow(): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const map: Record<string, string> = {};
  parts.forEach((p) => (map[p.type] = p.value));

  return { date: `${map.year}-${map.month}-${map.day}`, time: `${map.hour}:${map.minute}` };
}
