"use client";

import { useRef, useState, type KeyboardEvent, type ClipboardEvent } from "react";

interface InviteCodeInputProps {
  onComplete: (code: string) => void;
  disabled?: boolean;
}

export function InviteCodeInput({ onComplete, disabled = false }: InviteCodeInputProps) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const allFilled = digits.every((d) => d !== "");

  function handleChange(index: number, value: string) {
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!char) return;

    const newDigits = [...digits];
    newDigits[index] = char[0];
    setDigits(newDigits);

    // Move to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    if (newDigits.every((d) => d !== "")) {
      onComplete(newDigits.join(""));
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      const newDigits = [...digits];
      if (digits[index]) {
        newDigits[index] = "";
        setDigits(newDigits);
      } else if (index > 0) {
        newDigits[index - 1] = "";
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      }
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);

    if (pasted.length > 0) {
      const newDigits = [...digits];
      for (let i = 0; i < pasted.length && i < 6; i++) {
        newDigits[i] = pasted[i];
      }
      setDigits(newDigits);

      if (pasted.length >= 6) {
        onComplete(newDigits.join(""));
      } else {
        inputRefs.current[pasted.length]?.focus();
      }
    }
  }

  return (
    <div className="flex gap-2 md:gap-4 justify-center">
      {digits.map((digit, i) => (
        <span key={i} className="contents">
          {i === 3 && (
            <div className="w-2 flex items-center justify-center text-secondary/30 font-headline">
              -
            </div>
          )}
          <input
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={() => setFocusedIndex(i)}
            onBlur={() => setFocusedIndex(null)}
            onPaste={handlePaste}
            placeholder="•"
            aria-label={`Invite code digit ${i + 1}`}
            className={`
              w-10 h-14 md:w-14 md:h-20 text-center font-headline text-2xl
              bg-surface-container-highest border rounded-sm
              text-secondary placeholder-secondary/10
              disabled:opacity-50
              animate-scale-in
              transition-all duration-500 ease-out
              ${digit
                ? allFilled
                  ? "border-secondary/60 glow-gold-strong shadow-elevated"
                  : "border-secondary/40 glow-gold shadow-whisper"
                : focusedIndex === i
                  ? "border-secondary/50 animate-pulse-glow shadow-elevated"
                  : "border-outline-variant/10"
              }
              focus:ring-1 focus:ring-secondary/50 focus:border-secondary/50 focus:shadow-elevated
            `}
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
          />
        </span>
      ))}
    </div>
  );
}
