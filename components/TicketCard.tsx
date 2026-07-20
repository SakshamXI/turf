interface Props {
  groupId: string;
  slotDate: string;
  slotTimes: string[];
  qrDataUrl: string;
}

export default function TicketCard({ groupId, slotDate, slotTimes, qrDataUrl }: Props) {
  return (
    <div className="card max-w-sm mx-auto text-center animate-scale-in">
      <p className="uppercase tracking-widest text-floodlight text-xs font-medium mb-2">
        Booking confirmed
      </p>
      <h2 className="font-display font-bold text-2xl text-pitchDark mb-1">{slotDate}</h2>
      <p className="text-pitchDark/70 text-sm mb-1">
        {slotTimes.length} slot{slotTimes.length > 1 ? "s" : ""}: {slotTimes.join(", ")}
      </p>
      <p className="text-pitchDark/60 text-sm mb-6">Show this QR at the counter</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrDataUrl} alt="Booking QR code" className="mx-auto mb-4 w-48 h-48" />
      <p className="text-xs text-pitchDark/50 break-all">Booking ID: {groupId}</p>
    </div>
  );
}
