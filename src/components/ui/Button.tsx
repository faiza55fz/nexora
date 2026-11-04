// src/components/ui/Button.tsx
"use client";

import React, { ReactNode, ButtonHTMLAttributes } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "brand"
  | "cta"
  | "success"
  | "warning"
  | "danger";

type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

/**
 * Button component that uses the semantic Tailwind colour tokens.
 * Variants map to the custom properties defined in globals.css.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  className = "",
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses: Record<Variant, string> = {
    primary: "bg-brand text-ink hover:bg-brand-2",
    secondary: "bg-surface text-ink border border-line hover:bg-surface-2",
    ghost: "bg-transparent text-ink hover:bg-surface-2",
    outline: "bg-transparent text-ink border border-line hover:bg-surface-2",
    brand: "bg-brand-soft text-brand hover:bg-brand-2",
    cta: "bg-cta text-ink hover:bg-cta-hover",
    success: "bg-success-soft text-success hover:bg-success",
    warning: "bg-warning-soft text-warning hover:bg-warning",
    danger: "bg-danger-soft text-danger hover:bg-danger",
  };

  const sizeClasses: Record<Size, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-5 py-3 text-lg",
  };

  return (
    <button
      className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
