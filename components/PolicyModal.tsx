"use client";

interface Props {
  onAccept: () => void;
  onCancel: () => void;
}

export default function PolicyModal({ onAccept, onCancel }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-pitchDark/60 p-4 animate-fade-in"
    >
      <div className="bg-chalk rounded-xl max-w-md w-full p-6 animate-scale-in">
        <h2 id="policy-modal-title" className="font-display font-bold text-xl text-pitchDark mb-4">
          Before you pay
        </h2>

        <div className="space-y-4 text-sm text-pitchDark/80 mb-6">
          <p>
            Once this slot is booked, the amount is <strong className="text-pitchDark">non-refundable</strong>,
            including for no-shows or late arrival. If you need to change your slot, contact us
            directly before your booked time.
          </p>
          <div className="bg-warningBg border border-warning/20 rounded-lg p-4">
            <p className="text-warning font-medium mb-1">Code of conduct applies</p>
            <p className="text-warning/90">
              Any indiscipline on the premises — abusive behaviour, damage to equipment, or
              violation of turf rules — will result in immediate removal and forfeiture of this
              booking, and may affect your ability to book in future.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-md border border-line/30 text-pitchDark font-medium hover:bg-cream transition-colors">
            Cancel
          </button>
          <button onClick={onAccept} className="flex-1 btn-primary">
            I agree, continue to pay
          </button>
        </div>
      </div>
    </div>
  );
}
