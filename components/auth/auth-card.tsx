"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The premium glass card used on every auth screen.
 *
 * Wraps content in the heavy glassmorphism utility (`.glass-card` in
 * app/globals.css): semi-transparent background, 26px backdrop blur,
 * saturated white border, layered violet drop-shadow, and a 7s
 * `glass-glow-pulse` animation. Use the optional `motion` prop to add
 * the staggered fade/slide-in transition that the original signin
 * form used.
 */
export function AuthCard({
  children,
  className,
  motion = "default",
}: {
  children: React.ReactNode;
  className?: string;
  motion?: "default" | "bottom" | "none";
}) {
  const motionClass =
    motion === "default"
      ? "animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-500"
      : motion === "bottom"
        ? "animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150"
        : "";

  return (
    <div
      className={cn(
        "glass-card w-full rounded-3xl p-8",
        motionClass,
        className,
      )}
    >
      {children}
    </div>
  );
}
