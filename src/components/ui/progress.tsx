import type { ReactNode } from "react";

export interface ProgressBarProps {
  /** 0–100. Values outside the range are clamped rather than rejected. */
  value: number;
  tone?: "brand" | "success" | "warning";
  size?: "sm" | "md";
  label?: string;
  className?: string;
}

const barToneClasses = {
  brand: "bg-brand-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
} as const;

const barSizeClasses = {
  sm: "h-1.5",
  md: "h-2",
} as const;

/**
 * Determinate progress bar.
 *
 * The numeric value is exposed through `role="progressbar"` so assistive tech can
 * read it, and the bar is purely decorative visually — the text next to it
 * always shows the same number.
 */
export function ProgressBar({
  value,
  tone = "brand",
  size = "md",
  label = "Course progress",
  className = "",
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(Math.round(value), 0), 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={`w-full overflow-hidden rounded-full bg-neutral-200 ${barSizeClasses[size]} ${className}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-layout ${barToneClasses[tone]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export interface ProgressRingProps {
  value: number;
  /** Rendered inside the ring; keep it short (e.g. "38%"). */
  children?: ReactNode;
  size?: number;
  strokeWidth?: number;
  tone?: "brand" | "success";
  label?: string;
  className?: string;
}

/** Compact circular progress used in cards and the mobile summary bar. */
export function ProgressRing({
  value,
  children,
  size = 56,
  strokeWidth = 5,
  tone = "brand",
  label = "Course progress",
  className = "",
}: ProgressRingProps) {
  const clamped = Math.min(Math.max(Math.round(value), 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-neutral-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={`transition-[stroke-dashoffset] duration-layout ${
            tone === "success" ? "stroke-success-500" : "stroke-brand-500"
          }`}
        />
      </svg>
      <span className="absolute text-caption font-semibold text-text-primary" data-numeric>
        {children ?? `${clamped}%`}
      </span>
      <span className="sr-only" role="progressbar" aria-label={label} aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} />
    </div>
  );
}