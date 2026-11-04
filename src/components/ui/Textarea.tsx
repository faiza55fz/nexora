// src/components/ui/Textarea.tsx
import React, { TextareaHTMLAttributes, ForwardedRef, forwardRef } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

/**
 * Multiline textarea using the same style as Input.
 */
export const Textarea = forwardRef(
  (
    { label, error, className = "", ...rest }: TextareaProps,
    ref: ForwardedRef<HTMLTextAreaElement>
  ) => {
    const base =
      "w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand";
    return (
      <div className={`flex flex-col ${className}`}>
        {label && (
          <label className="mb-1 text-ink text-sm font-medium">{label}</label>
        )}
        <textarea className={base} ref={ref} {...rest} />
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
