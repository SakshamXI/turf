"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function EmailInput({ value, onChange, disabled }: Props) {
  return (
    <div>
      <label htmlFor="email" className="block text-sm font-medium text-pitchDark mb-2">
        Email address
      </label>
      <input
        id="email"
        type="email"
        placeholder="you@example.com"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-line/30 rounded-md px-3 py-3 outline-none focus:ring-2 focus:ring-pitch disabled:bg-cream/50"
      />
    </div>
  );
}
