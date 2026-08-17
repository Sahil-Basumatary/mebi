import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const appButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap border font-medium transition-colors focus-visible:ring-2 focus-visible:ring-app-ink/20 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "border-app-ink bg-app-ink text-app-paper hover:bg-app-accent-hover",
        secondary:
          "border-app-divider bg-app-paper text-app-ink hover:border-app-ink hover:bg-app-wash",
        ghost:
          "border-transparent bg-transparent text-app-label hover:bg-app-wash hover:text-app-ink",
        link: "border-transparent bg-transparent p-0 text-app-ink underline underline-offset-2",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-10 px-5 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface AppButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof appButtonVariants> {
  asChild?: boolean;
}

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(
  ({ asChild = false, className, variant, size, ...props }, ref) => {
    const Component = asChild ? Slot : "button";
    return (
      <Component
        ref={ref}
        className={cn(appButtonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
AppButton.displayName = "AppButton";

export { appButtonVariants };
