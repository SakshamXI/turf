"use client";

export interface AdminSlot {
  time: string;
  available: boolean;
  pricePaise?: number;
  groupId?: string;
  email?: string;
  status?: string;
}

interface Props {
  slots: AdminSlot[];
  selectedForBooking: string[];
  onToggleBooking: (time: string) => void;
  selectedGroupId: string | null;
  onSelectBooked: (slot: AdminSlot) => void;
}

export default function AdminSlotGrid({
  slots,
  selectedForBooking,
  onToggleBooking,
  selectedGroupId,
  onSelectBooked,
}: Props) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-3 text-xs text-pitchDark/60">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-50 border border-green-300" /> Available — click to book
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-pitch" /> Selected to book
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-50 border border-red-200" /> Booked — click to cancel
        </span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {slots.map((slot) => {
          const isSelectedForBooking = selectedForBooking.includes(slot.time);
          const isSelectedForCancel =
            slot.groupId !== undefined && slot.groupId === selectedGroupId;

          return (
            <button
              key={slot.time}
              onClick={() => (slot.available ? onToggleBooking(slot.time) : onSelectBooked(slot))}
              aria-pressed={isSelectedForBooking || isSelectedForCancel}
              className={[
                "py-3 rounded-md text-sm font-medium border transition-all duration-150 active:scale-95 flex flex-col items-center gap-0.5",
                !slot.available
                  ? isSelectedForCancel
                    ? "bg-warning text-cream border-warning"
                    : "bg-red-50 text-red-500 border-red-200 hover:border-warning"
                  : isSelectedForBooking
                  ? "bg-pitch text-cream border-pitch"
                  : "bg-green-50 text-green-800 border-green-300 hover:border-pitch",
              ].join(" ")}
            >
              <span>{slot.time}</span>
              {typeof slot.pricePaise === "number" && (
                <span className="text-xs font-normal opacity-70">₹{slot.pricePaise / 100}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
