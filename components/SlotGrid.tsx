"use client";

interface Slot {
  time: string;
  available: boolean;
  pricePaise?: number;
}

interface Props {
  slots: Slot[];
  selected: string[];
  onToggle: (time: string) => void;
}

export default function SlotGrid({ slots, selected, onToggle }: Props) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-3 text-xs text-pitchDark/60">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-50 border border-green-300" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-pitch" /> Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-50 border border-red-200" /> Booked
        </span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {slots.map((slot) => {
          const isSelected = selected.includes(slot.time);
          return (
            <button
              key={slot.time}
              disabled={!slot.available}
              onClick={() => onToggle(slot.time)}
              aria-pressed={isSelected}
              className={[
                "py-3 rounded-md text-sm font-medium border transition-all duration-150 active:scale-95 flex flex-col items-center gap-0.5",
                !slot.available
                  ? "bg-red-50 text-red-400 border-red-200 cursor-not-allowed line-through"
                  : isSelected
                  ? "bg-pitch text-cream border-pitch"
                  : "bg-green-50 text-green-800 border-green-300 hover:border-pitch",
              ].join(" ")}
            >
              <span>{slot.time}</span>
              {typeof slot.pricePaise === "number" && (
                <span className={`text-xs font-normal ${isSelected ? "text-cream/70" : "opacity-70"}`}>
                  ₹{slot.pricePaise / 100}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
