import * as React from "react";

import { cn } from "@/lib/utils";
import { LegalLinks } from "@/components/auth/legal-links";

/**
 * Full-screen centered layout for auth / account-recovery screens.
 *
 * Encapsulates the radial-gradient backdrop (4 drifting brand glows +
 * a top radial wash) so every entry screen stays focused on its content.
 * Renders a <main> landmark for accessibility.
 *
 * The legal links render here, once, for every screen that uses this shell —
 * login, signup, forgot-password, reset-confirm, activation and restricted. They
 * are required on each of those, and putting them in the shell rather than in
 * each form means a new auth screen cannot ship without them.
 *
 * The premium glow utilities (.auth-glow / .auth-glow--* / auth-drift-*)
 * are defined in app/globals.css.
 */
export function AuthShell({
  children,
  className,
  brandName,
}: {
  children: React.ReactNode;
  className?: string;
  brandName?: string;
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="auth-glow auth-glow--primary auth-glow--1 h-[28rem] w-[28rem] -left-24 -top-24" />
        <div className="auth-glow auth-glow--secondary auth-glow--2 h-[26rem] w-[26rem] -right-24 -top-16" />
        <div className="auth-glow auth-glow--accent auth-glow--3 h-[24rem] w-[24rem] bottom-8 left-[12%]" />
        <div className="auth-glow auth-glow--success auth-glow--4 h-[26rem] w-[26rem] -bottom-24 -right-16" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      </div>
      {brandName ? (
        <div className="mb-6 text-center text-sm font-semibold tracking-tight text-muted-foreground">
          {brandName}
        </div>
      ) : null}
      <div
        className={cn(
          "mx-auto flex w-full max-w-md flex-col items-center px-4",
          className,
        )}
      >
        {children}

        <LegalLinks className="mt-6 border-t border-border/60 pt-4" />
      </div>
    </main>
  );
}
