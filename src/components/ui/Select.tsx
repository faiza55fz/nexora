// src/components/ui/Select.tsx
import React, { SelectHTMLAttributes, ForwardedRef, forwardRef, ReactNode } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

/**
 * Native select with a chevron icon.
 * Uses semantic tokens for bg, border and focus.
 */
export const Select = forwardRef(
  (
    { label, error, children, className = "", ...rest }: SelectProps,
    ref: ForwardedRef<HTMLSelectElement>
  ) => {
    const base =
      "w-full appearance-none rounded-xl border border-line bg-surface px-3 py-2 pr-8 text-ink focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand";
    return (
      <div className={`relative flex flex-col ${className}`}>
        {label && (
          <label className="mb-1 text-ink text-sm font-medium">{label}</label>
        )}
        <select className={base} ref={ref} {...rest}>
          {children}
        </select>
        {/* chevron */}
        <svg
          className="pointer-events-none absolute right-2 top-1/2 -mt-2 h-4 w-4 text-ink"
          viewBox="0 0 20 20"
        >
          <path d="M5 8l5 5 5-5H5z" fill="currentColor" />
        </svg>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
