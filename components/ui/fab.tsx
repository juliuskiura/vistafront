import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Premium floating-action-button (FAB) used as a circular icon button.
 *
 * Round, single-color circle with a soft shadow. `sm` is sized for
 * in-card controls (e.g. the close button on the mobile navigation
 * drawer), `md` and `lg` for actual floating actions.
 */
const fabVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none shadow-lg hover:shadow-xl focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:
          "border-border bg-background text-foreground hover:bg-input/50",
        "outline-primary":
          "border-primary/30 bg-background text-primary hover:bg-primary/10",
        "primary-inverse":
          "bg-primary-foreground text-primary hover:bg-primary-foreground/80",
        destructive:
          "bg-destructive text-destructive-50 hover:bg-destructive/80",
      },
      size: {
        sm: "h-10 w-10 [&_svg:not([class*='size-'])]:size-5",
        md: "h-12 w-12 [&_svg:not([class*='size-'])]:size-6",
        lg: "h-14 w-14 [&_svg:not([class*='size-'])]:size-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

function Fab({
  className,
  variant = "default",
  size = "md",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof fabVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="fab"
      className={cn(fabVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Fab, fabVariants };
