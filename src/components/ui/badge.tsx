import type { ReactNode } from "react";

type Tone = "neutral" | "brand" | "success" | "warning" | "info" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-neutral-100 text-neutral-700",
  brand: "bg-brand-50 text-brand-700",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  info: "bg-info-50 text-info-700",
  danger: "bg-danger-50 text-danger-700",
};

export interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-micro font-medium ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Small uppercase key that sits above a group of related rows. */
export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`text-micro font-semibold uppercase tracking-[0.08em] text-text-tertiary ${className}`}
    >
      {children}
    </span>
  );
}