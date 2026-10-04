import Link from "next/link";

import { Icon, type IconName } from "./icon";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "subtle" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-xs hover:bg-brand-700 active:bg-brand-700 disabled:bg-neutral-300",
  secondary:
    "bg-surface text-neutral-800 border border-border-strong shadow-xs hover:bg-neutral-50 active:bg-neutral-100 disabled:text-neutral-400",
  ghost: "text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 disabled:text-neutral-400",
  subtle: "bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-100 disabled:text-neutral-400",
  danger:
    "bg-danger-50 text-danger-700 hover:bg-danger-500 hover:text-white disabled:bg-neutral-100 disabled:text-neutral-400",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 gap-1.5 text-caption rounded-sm",
  md: "h-11 px-4 gap-2 text-body-sm rounded-sm",
  lg: "h-12 px-5 gap-2 text-body rounded-md",
};

export const controlClasses = (variant: Variant, size: Size) =>
  [
    "inline-flex items-center justify-center font-medium whitespace-nowrap",
    "transition-colors duration-micro select-none",
    "disabled:cursor-not-allowed",
    variantClasses[variant],
    sizeClasses[size],
  ].join(" ");

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: Variant;
  size?: Size;
  iconLeft?: IconName;
  iconRight?: IconName;
  children: ReactNode;
  /** Expands to the full width of the container. */
  block?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  block = false,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${controlClasses(variant, size)} ${block ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {iconLeft ? <Icon name={iconLeft} size={size === "sm" ? 16 : 18} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={size === "sm" ? 16 : 18} /> : null}
    </button>
  );
}

export interface LinkButtonProps extends ComponentPropsWithoutRef<typeof Link> {
  variant?: Variant;
  size?: Size;
  iconLeft?: IconName;
  iconRight?: IconName;
  block?: boolean;
}

/**
 * A Link that looks like a button. Kept separate from `Button` rather than
 * rendering an anchor inside a button — nesting interactive elements breaks
 * keyboard navigation.
 */
export function LinkButton({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  block = false,
  className = "",
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      className={`${controlClasses(variant, size)} ${block ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {iconLeft ? <Icon name={iconLeft} size={size === "sm" ? 16 : 18} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={size === "sm" ? 16 : 18} /> : null}
    </Link>
  );
}

export interface IconButtonProps extends ComponentPropsWithoutRef<"button"> {
  /** Required: an icon-only control with no accessible name is unusable. */
  label: string;
  icon: IconName;
  variant?: "surface" | "ghost" | "inverse";
  size?: "sm" | "md" | "lg";
  /** Renders the accessible name as visible text below the icon. */
  showLabel?: boolean;
  labelPosition?: "right" | "bottom";
}

const iconButtonVariantClasses = {
  surface: "bg-surface text-neutral-700 border border-border shadow-xs hover:bg-neutral-50",
  ghost: "text-neutral-600 hover:bg-neutral-100",
  inverse: "bg-ink-950/55 text-white hover:bg-ink-950/75 backdrop-blur-sm border border-white/10",
} as const;

const iconButtonSizeClasses = {
  sm: "size-9 rounded-sm",
  md: "size-11 rounded-sm",
  lg: "size-tap-target rounded-md",
} as const;

export function IconButton({
  label,
  icon,
  variant = "surface",
  size = "md",
  showLabel = false,
  labelPosition = "right",
  className = "",
  type = "button",
  ...rest
}: IconButtonProps) {
  const iconOnly = (
    <Icon name={icon} size={size === "sm" ? 16 : 18} />
  );

  if (!showLabel) {
    return (
      <button
        type={type}
        aria-label={label}
        title={label}
        className={`inline-flex items-center justify-center transition-colors duration-micro disabled:cursor-not-allowed disabled:opacity-50 ${iconButtonVariantClasses[variant]} ${iconButtonSizeClasses[size]} ${className}`}
        {...rest}
      >
        {iconOnly}
      </button>
    );
  }

  return (
    <button
      type={type}
      className={`inline-flex items-center transition-colors duration-micro disabled:cursor-not-allowed disabled:opacity-50 ${
        labelPosition === "bottom" ? "flex-col gap-1" : "gap-2"
      } ${iconButtonVariantClasses[variant]} ${labelPosition === "right" ? `${iconButtonSizeClasses[size]} px-3` : "w-full py-2 rounded-md"} ${className}`}
      {...rest}
    >
      {iconOnly}
      <span className="text-micro font-medium">{label}</span>
    </button>
  );
}