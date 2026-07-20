"use client";

import { useRef } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  length?: number;
}

export default function OtpInput({ value, onChange, disabled, length = 6 }: Props) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  function handleChange(index: number, digit: string) {
    const clean = digit.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean;
    onChange(next.join(""));
    if (clean && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-11 h-12 text-center text-lg border border-line/30 rounded-md outline-none focus:ring-2 focus:ring-pitch disabled:bg-cream/50"
        />
      ))}
    </div>
  );
}
