import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type Padding = "none" | "sm" | "md" | "lg";
type Tone = "surface" | "sunken" | "outline";

const paddingClasses: Record<Padding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5 sm:p-6",
};

const toneClasses: Record<Tone, string> = {
  surface: "bg-surface border border-border shadow-xs",
  sunken: "bg-surface-sunken border border-border",
  outline: "bg-transparent border border-border-strong",
};

export interface CardProps extends ComponentPropsWithoutRef<"div"> {
  as?: ElementType;
  padding?: Padding;
  tone?: Tone;
  children: ReactNode;
}

export function Card({
  as: Tag = "div",
  padding = "md",
  tone = "surface",
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={`rounded-card ${paddingClasses[padding]} ${toneClasses[tone]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Standard heading block for a panel. Keeping the title/description pair in one
 * component stops the same spacing from drifting between the five panels in the
 * player.
 */
export function CardHeading({
  title,
  description,
  action,
  as: Tag = "h2",
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <Tag className="text-title-sm font-semibold text-text-primary">{title}</Tag>
        {description ? (
          <p className="mt-1 text-caption text-text-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}