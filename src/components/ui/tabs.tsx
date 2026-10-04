"use client";

import type { ReactNode } from "react";

import { Icon, type IconName } from "./icon";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: IconName;
  /** Optional trailing count, e.g. the number of materials or comments. */
  count?: number;
}

export interface TabsProps<T extends string> {
  items: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  /** Accessible name for the tab list, e.g. "Lesson details". */
  label: string;
  /**
   * "underline" for the wide desktop tab strip, "pill" for the horizontally
   * scrollable mobile variant.
   */
  variant?: "underline" | "pill";
  className?: string;
}

/**
 * Tab strip following the ARIA authoring practices for tabs.
 *
 * Only the active tab is in the tab order (`tabIndex`), arrow keys move between
 * tabs, and the panels below carry `aria-labelledby` pointing back here. A row
 * of buttons that merely toggles `hidden` on panels is the common shortcut and it
 * breaks screen-reader navigation between tabs.
 */
export function Tabs<T extends string>({
  items,
  active,
  onChange,
  label,
  variant = "underline",
  className = "",
}: TabsProps<T>) {
  const isUnderline = variant === "underline";

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = items.findIndex((item) => item.id === active);
    if (index === -1) return;

    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % items.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + items.length) % items.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = items.length - 1;

    if (nextIndex === null) return;

    event.preventDefault();
    onChange(items[nextIndex].id);
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={
        isUnderline
          ? "flex gap-1 border-b border-border"
          : "scrollStrip flex gap-1.5 rounded-control bg-surface-sunken p-1"
      }
    >
      {items.map((item) => {
        const selected = item.id === active;

        return (
          <button
            key={item.id}
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={[
              "inline-flex shrink-0 items-center justify-center gap-2 font-medium transition-colors duration-micro",
              isUnderline
                ? `border-b-2 px-3 py-3 text-body-sm ${
                    selected
                      ? "border-brand-600 text-brand-700"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  }`
                : `h-9 rounded-xs px-3 text-caption ${
                    selected
                      ? "bg-surface text-text-primary shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  }`,
            ].join(" ")}
          >
            {item.icon ? <Icon name={item.icon} size={16} /> : null}
            {item.label}
            {item.count !== undefined ? (
              <span
                className={`rounded-full px-1.5 py-px text-micro ${
                  selected ? "bg-brand-100 text-brand-700" : "bg-neutral-200 text-neutral-600"
                }`}
                data-numeric
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export interface TabPanelProps<T extends string> {
  id: T;
  active: T;
  children: ReactNode;
  className?: string;
}

/** The content side of a `Tabs` pair. */
export function TabPanel<T extends string>({
  id,
  active,
  children,
  className = "",
}: TabPanelProps<T>) {
  if (id !== active) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
      className={`focus-visible:outline-none ${className}`}
    >
      {children}
    </div>
  );
}