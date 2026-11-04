// src/components/ui/Skeleton.tsx
import React, { HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** width utility class, e.g. "w-32" */
  width?: string;
  /** height utility class, e.g. "h-6" */
  height?: string;
  /** rounded utility class, e.g. "rounded", "rounded-xl" */
  rounded?: string;
}

/**
 * Simple loading placeholder.
 * Uses bg-surface-2 (muted) and Tailwind's animate-pulse.
 */
export function Skeleton({
  width = "w-full",
  height = "h-4",
  rounded = "rounded",
  className = "",
  ...rest
}: SkeletonProps) {
  return (
    <div
      className={`bg-surface-2 ${width} ${height} ${rounded} animate-pulse ${className}`}
      {...rest}
    />
  );
}
