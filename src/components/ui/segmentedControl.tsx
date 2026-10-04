"use client";

import { Icon, type IconName } from "./icon";

import type { ReactNode } from "react";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

export interface SegmentedControlProps<T extends string> {
  /** Form field name — the checked value is what a GET form submits. */
  name: string;
  /** Accessible group name; rendered as a visually hidden legend. */
  legend: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
  children?: ReactNode;
}

/**
 * Radio group styled as a segmented control.
 *
 * Built from real `<input type="radio">` elements rather than buttons with
 * `aria-pressed`: the native control gives arrow-key roving focus, announces
 * "3 of 4" to a screen reader, and — critically — participates in a plain GET
 * form, so the catalogue still filters with JavaScript disabled.
 */
export function SegmentedControl<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  size = "md",
  className = "",
  children,
}: SegmentedControlProps<T>) {
  return (
    <fieldset className={`min-w-0 ${className}`}>
      <legend className="sr-only">{legend}</legend>
      <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-control border border-border bg-neutral-100/80 p-1 scrollStrip">
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <label
              key={option.value}
              className={[
                "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xs font-medium transition-colors duration-micro",
                size === "sm" ? "h-8 px-3 text-caption" : "h-9 px-3.5 text-body-sm",
                selected
                  ? "bg-surface text-text-primary shadow-xs"
                  : "text-text-secondary hover:text-text-primary",
              ].join(" ")}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.icon ? <Icon name={option.icon} size={15} /> : null}
              {option.label}
            </label>
          );
        })}
        {children}
      </div>
    </fieldset>
  );
}