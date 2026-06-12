"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "./icon-button";

export interface WindowProps {
  title: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}

export function Window({ title, trigger, open, onOpenChange, children, className }: WindowProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            "border-border bg-surface shadow-window fixed top-1/2 left-1/2 z-50 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border focus:outline-none",
            className,
          )}
        >
          <div className="border-border flex items-center justify-between border-b px-5 py-3">
            <Dialog.Title className="text-sm font-semibold tracking-tight">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <IconButton label="Close">
                <X size={18} strokeWidth={1.75} />
              </IconButton>
            </Dialog.Close>
          </div>
          <div className="px-5 py-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
