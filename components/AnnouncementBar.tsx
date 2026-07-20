"use client";

import { useEffect, useState } from "react";

// Edit this list to change what shows in the bar. One message floats
// fully across at a time, then the next one takes its turn.
const messages = [
  "🎉 New: book multiple slots in one go",
  "⚡ Slots open daily 6:00 AM – 10:00 PM",
  "📍 Udhampur",
];

// The ONLY place you need to change speed. Milliseconds — lower = faster.
const DURATION_MS = 18000;

export default function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, DURATION_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative bg-floodlight text-pitchDark overflow-hidden h-9">
      {/* key={index} forces React to remount the span each time, which
          restarts the CSS animation from the beginning for the new message.
          animationDuration is set inline from the same constant driving the
          JS timer above, so the two can never drift out of sync. */}
      <span
        key={index}
        className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-sm font-medium animate-float-message"
        style={{ animationDuration: `${DURATION_MS}ms` }}
      >
        {messages[index]}
      </span>
    </div>
  );
}
