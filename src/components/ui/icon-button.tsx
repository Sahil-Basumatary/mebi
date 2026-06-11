import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, label, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={cn(
          "text-foreground hover:bg-hover focus-visible:ring-foreground/20 inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-55",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";
