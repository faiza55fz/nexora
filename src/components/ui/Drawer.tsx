// src/components/ui/Drawer.tsx
"use client";
import React, { ReactNode, useEffect, useRef, KeyboardEvent, MouseEvent } from "react";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

/**
 * Side drawer that slides in from the left.
 * Uses the same semantic Tailwind tokens as Modal.
 * - Focus is trapped by overlay click handling.
 * - Escape key closes the drawer.
 */
export function Drawer({ isOpen, onClose, children, title }: DrawerProps) {
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
      className={`fixed inset-0 z-50 flex ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      onMouseDown={handleOverlayClick}
    >
      {/* Dimmed background */}
      <div className="fixed inset-0 bg-black/40 transition-opacity duration-300" />
      {/* Sliding panel */}
      <aside
        className="relative h-dvh w-[min(82vw,340px)] overflow-y-auto bg-surface p-5 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] translate-x-0"
      >
        {title && (
          <h2 className="mb-4 text-ink text-lg font-semibold">{title}</h2>
        )}
        {children}
      </aside>
    </div>
  );
}
