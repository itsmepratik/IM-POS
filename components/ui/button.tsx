import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground relative transition-all duration-200 ease-in-out active:transition-none " +
          "shadow-chonky-primary hover:translate-y-[-2px] hover:shadow-chonky-primary-hover active:translate-y-[3px] active:shadow-chonky-primary-active",
        destructive:
          "bg-destructive text-destructive-foreground relative transition-all duration-200 ease-in-out active:transition-none " +
          "shadow-chonky-destructive hover:translate-y-[-2px] hover:shadow-chonky-destructive-hover active:translate-y-[3px] active:shadow-chonky-destructive-active",
        outline:
          "border border-input bg-background shadow-sm shadow-black/5 hover:bg-accent hover:text-accent-foreground transition-colors",
        secondary:
          "bg-secondary text-secondary-foreground relative transition-all duration-200 ease-in-out active:transition-none " +
          "shadow-chonky-secondary hover:translate-y-[-2px] hover:shadow-chonky-secondary-hover active:translate-y-[3px] active:shadow-chonky-secondary-active",
        ghost: "hover:bg-accent hover:text-accent-foreground transition-colors",
        link: "text-primary underline-offset-4 hover:underline transition-colors",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-10 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
