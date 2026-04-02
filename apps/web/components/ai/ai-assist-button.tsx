"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { AIResultPanel } from "./ai-result-panel";

interface AIAssistButtonProps {
  label: string;
  systemPrompt: string;
  userPrompt: string;
  context?: string;
  onApply: (content: string) => void;
  onApplyJSON?: (data: unknown) => void;
  size?: "sm" | "md";
  className?: string;
}

export function AIAssistButton({
  label,
  systemPrompt,
  userPrompt,
  context,
  onApply,
  onApplyJSON,
  size = "sm",
  className = "",
}: AIAssistButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const messages = [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: context ? `${userPrompt}\n\nContext:\n${context}` : userPrompt },
      ];

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, maxTokens: 1500 }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "AI request failed");
      }

      const data = await res.json();
      setResult(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (!result) return;

    if (onApplyJSON) {
      try {
        const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);
        onApplyJSON(parsed);
      } catch {
        onApply(result);
      }
    } else {
      onApply(result);
    }
    setOpen(false);
    setResult(null);
  }

  const sizeClasses = size === "sm"
    ? "px-3 py-1.5 text-[10px] gap-1.5"
    : "px-4 py-2 text-xs gap-2";

  return (
    <>
      <button
        onClick={() => { setOpen(true); generate(); }}
        className={`
          inline-flex items-center font-label uppercase tracking-widest font-bold
          rounded-xl border border-secondary/25 bg-secondary-container/10
          text-secondary hover:bg-secondary-container/25 hover:border-secondary/40
          hover:glow-gold active:scale-95
          transition-all duration-300
          ${sizeClasses}
          ${className}
        `}
      >
        <Icon name="auto_awesome" size={size === "sm" ? 12 : 14} filled className="text-secondary" />
        {label}
      </button>

      {open && (
        <AIResultPanel
          loading={loading}
          result={result}
          error={error}
          onApply={handleApply}
          onRegenerate={generate}
          onClose={() => { setOpen(false); setResult(null); setError(null); }}
        />
      )}
    </>
  );
}
