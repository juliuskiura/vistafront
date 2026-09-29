"use client";

import Link from "next/link";
import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

/**
 * An action rendered in the banner's action slot.
 *
 * Two shapes, because not every action is a label plus an icon. The default
 * renders the banner's own link/button; a feature that needs a *rich* trigger —
 * a card with its own layout, an icon row, a dropdown — passes `node` and owns
 * the markup entirely. Modelling them as one union rather than one bag with
 * seven optionals is what stops `icon`/`href`/`node` from being supplied
 * together, which TypeScript would otherwise accept and the renderer would
 * silently ignore two thirds of.
 */
export type BannerAction =
  | {
      label: string;
      icon: LucideIcon;
      href?: string;
      onClick?: () => void;
      variant?: "primary" | "secondary";
      node?: never;
    }
  | {
      /** Used for the React key and the fallback accessible name. */
      label: string;
      /** Rendered verbatim in place of the default link/button. */
      node: React.ReactNode;
      icon?: never;
      href?: never;
      onClick?: never;
      variant?: never;
    };

interface BannerProps {
  title: string;
  description?: string;
  actions?: BannerAction[];
  className?: string;
  children?: React.ReactNode;
  descriptionClassName?: string;
}

const glowOrbs = [
  "absolute -left-16 -top-16 h-64 w-64 rounded-full bg-[#4d7fff]/60 blur-3xl",
  "absolute right-0 top-1/3 h-72 w-72 rounded-full bg-[#7a5cff]/40 blur-3xl",
  "absolute -bottom-20 left-1/4 h-72 w-72 rounded-full bg-[#00e5ff]/40 blur-3xl",
  "absolute -right-8 -bottom-8 h-56 w-56 rounded-full bg-[#19e664]/30 blur-3xl",
];

function BannerGlowOrbs() {
  return (
    <>
      {glowOrbs.map((cls, i) => (
        <div key={i} className={cls} />
      ))}
    </>
  );
}

export function Banner({
  title,
  description,
  actions,
  className,
  children,
  descriptionClassName,
}: BannerProps) {
  return (
    <div
      className={cn(
        "relative -mx-4 -mt-4 flex flex-col justify-between gap-4 bg-gradient-to-r from-primary-600 to-secondary-600 p-6 text-white md:-mx-6 md:-mt-6 md:flex-row md:items-center",
        className,
      )}
    >
      {/* <BannerGlowOrbs /> */}
      {children && (
        <div className="pointer-events-none absolute inset-0">
          {children}
        </div>
      )}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p
            className={cn(
              "mt-1 text-sm text-primary-100 max-w-xl leading-relaxed",
              descriptionClassName,
            )}
          >
            {description}
          </p>
        )}
      </div>
      
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {actions.map((action) => {
            if ("node" in action) {
              return <Fragment key={action.label}>{action.node}</Fragment>;
            }

            const Icon = action.icon;
            const baseClasses =
              "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all";
            const variantClasses =
              action.variant === "secondary"
                ? "border border-primary-300 text-white hover:bg-primary-900/90 hover:border-white hover:text-white"
                : "bg-white text-primary-700 hover:bg-primary-50";

            if (action.href) {
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className={cn(baseClasses, variantClasses)}
                >
                  <Icon className="size-4" />
                  {action.label}
                </Link>
              );
            }

            return (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={cn(baseClasses, variantClasses)}
              >
                <Icon className="size-4" />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
    
  );
}
