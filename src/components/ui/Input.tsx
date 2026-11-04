// src/components/ui/Input.tsx
import React, { InputHTMLAttributes, ForwardedRef, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * Standard text input using semantic tokens.
 * Focus ring uses brand colour, error displays in danger token.
 */
export const Input = forwardRef(
  (
    { label, error, className = "", ...rest }: InputProps,
    ref: ForwardedRef<HTMLInputElement>
  ) => {
    const base =
      "w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand";
    return (
      <div className={`flex flex-col ${className}`}>
        {label && (
          <label className="mb-1 text-ink text-sm font-medium">{label}</label>
        )}
        <input className={base} ref={ref} {...rest} />
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
