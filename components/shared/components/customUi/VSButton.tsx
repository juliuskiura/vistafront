import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

const vsButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[40px] border border-black/10 p-[15px] text-base font-bold select-none transition-all outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "[--vs-fill:var(--primary-600)] [--vs-fill-hover:var(--primary-500)] [--vs-on-fill:var(--primary-50)] [--vs-ink:var(--primary)] [--vs-wash:var(--primary)] [--vs-top:var(--primary-400)] [--vs-bottom:var(--primary-700)]",
        secondary:
          "[--vs-fill:var(--color-secondary-600)] [--vs-fill-hover:var(--color-secondary-500)] [--vs-on-fill:var(--color-secondary-50)] [--vs-ink:var(--color-secondary-500)] [--vs-wash:var(--color-secondary-500)] [--vs-top:var(--color-secondary-400)] [--vs-bottom:var(--color-secondary-700)]",
        accent:
          "[--vs-fill:var(--color-accent-600)] [--vs-fill-hover:var(--color-accent-500)] [--vs-on-fill:var(--color-accent-50)] [--vs-ink:var(--color-accent-500)] [--vs-wash:var(--color-accent-500)] [--vs-top:var(--color-accent-400)] [--vs-bottom:var(--color-accent-700)]",
        destructive:
          "[--vs-fill:var(--color-destructive-600)] [--vs-fill-hover:var(--color-destructive-500)] [--vs-on-fill:var(--color-destructive-50)] [--vs-ink:var(--color-destructive-500)] [--vs-wash:var(--color-destructive-500)] [--vs-top:var(--color-destructive-400)] [--vs-bottom:var(--color-destructive-700)]",
      },
      appearance: {
        solid:
          "bg-[var(--vs-fill)] text-[var(--vs-on-fill)] hover:bg-[var(--vs-fill-hover)] border-transparent",
        threeD:
          "bg-[var(--vs-fill)] text-[var(--vs-on-fill)] [text-shadow:rgba(0,0,0,0.35)_0_1px_1px] shadow-[inset_0_6px_0px_-5px_var(--vs-top),0_4px_10px_-5px_var(--vs-bottom)] hover:bg-[var(--vs-fill-hover)] active:translate-y-px active:shadow-[inset_0_2px_0px_-1px_var(--vs-top),0_2px_4px_-3px_var(--vs-bottom)] border-transparent",
        outline:
          "bg-transparent text-[var(--vs-ink)] border border-[color:color-mix(in_oklab,var(--vs-ink)_40%,transparent)] hover:bg-[color:color-mix(in_oklab,var(--vs-wash)_10%,transparent)] hover:text-[var(--vs-ink)]",
        ghost:
          "bg-transparent text-[var(--vs-ink)] border-transparent hover:bg-[color:color-mix(in_oklab,var(--vs-wash)_10%,transparent)] hover:text-[var(--vs-ink)]",
      },
      size: {
        sm: "px-4 py-1.5 text-xs",
        md: "px-8 py-2.5 text-sm",
        lg: "px-10 py-3 text-base",
        xl: "px-14 py-5 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      appearance: "solid",
      size: "md",
    },
  }
)

function VSButton({
  className,
  variant,
  appearance,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof vsButtonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      className={cn(vsButtonVariants({ variant, appearance, size, className }))}
      {...props}
    />
  )
}

export { VSButton, vsButtonVariants }
