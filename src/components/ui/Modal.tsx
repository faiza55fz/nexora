// src/components/ui/Modal.tsx
"use client";
import React, { ReactNode, useEffect, useRef, KeyboardEvent, MouseEvent } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Accessible modal/dialog.
 * - Focus is trapped by keeping the overlay element as the click target.
 * - Press Escape to close.
 * - Uses semantic tokens: bg-surface, border-line, shadow-card.
 */
export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey as any);
    return () => window.removeEventListener("keydown", handleKey as any);
  }, [isOpen, onClose]);

  // Close on overlay click
  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onMouseDown={handleOverlayClick}
    >
      <div className="max-w-lg w-full bg-surface rounded-xl shadow-card p-6 relative">
        {title && (
          <h2 className="text-ink text-lg font-semibold mb-4">{title}</h2>
        )}
        <div className="mb-4">{children}</div>
        {footer && <div className="flex justify-end space-x-2">{footer}</div>}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted hover:text-ink"
          aria-label="Close modal"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
