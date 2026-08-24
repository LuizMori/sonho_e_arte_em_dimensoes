import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full label-caps disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-navy text-cream-light hover:bg-magenta",
        outline: "border border-navy text-navy hover:border-magenta hover:text-magenta",
        ghost: "text-navy hover:text-magenta",
        light: "bg-cream-light text-navy hover:bg-orange hover:text-cream-light",
      },
      size: {
        default: "px-7 py-3.5",
        sm: "px-5 py-2.5 text-[11px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  }
);

Button.displayName = "Button";
