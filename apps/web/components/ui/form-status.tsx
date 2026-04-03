"use client";

import { Icon } from "@/components/ui/icon";

interface FormStatusProps {
  kind: "success" | "error" | "info";
  message: string;
}

const STYLES = {
  success: {
    icon: "check_circle",
    className: "border-green-500/20 bg-green-950/20 text-green-300",
  },
  error: {
    icon: "error",
    className: "border-error/20 bg-error/10 text-error",
  },
  info: {
    icon: "info",
    className: "border-secondary/20 bg-secondary/10 text-secondary",
  },
} as const;

export function FormStatus({ kind, message }: FormStatusProps) {
  const style = STYLES[kind];
  return (
    <div className={`flex items-start gap-2 rounded-sm border px-3 py-2 text-sm ${style.className}`}>
      <Icon name={style.icon} size={16} className="mt-0.5" />
      <span>{message}</span>
    </div>
  );
}
