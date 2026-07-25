"use client";

import {
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

type Align = "start" | "end";

type MenuCoords = {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function measureMenu(
  anchor: DOMRect,
  {
    width,
    preferredMaxHeight,
    gap,
    padding,
    align,
  }: {
    width: number;
    preferredMaxHeight: number;
    gap: number;
    padding: number;
    align: Align;
  },
): MenuCoords {
  const spaceBelow = window.innerHeight - anchor.bottom - padding;
  const spaceAbove = anchor.top - padding;
  // Prefer below; flip only when below is tight and above has more room.
  const comfort = Math.min(preferredMaxHeight, 200);
  const openUp = spaceBelow < comfort && spaceAbove > spaceBelow;
  const available = (openUp ? spaceAbove : spaceBelow) - gap;
  const maxHeight = Math.max(96, Math.min(preferredMaxHeight, available));
  const rawLeft = align === "end" ? anchor.right - width : anchor.left;
  const left = clamp(rawLeft, padding, window.innerWidth - width - padding);

  if (openUp) {
    return {
      left,
      width,
      maxHeight,
      bottom: window.innerHeight - anchor.top + gap,
    };
  }

  return {
    left,
    width,
    maxHeight,
    top: anchor.bottom + gap,
  };
}

export function AnchoredMenu({
  open,
  onClose,
  anchorRef,
  children,
  width,
  preferredMaxHeight = 320,
  align = "end",
  gap = 4,
  padding = 8,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  width: number;
  preferredMaxHeight?: number;
  align?: Align;
  gap?: number;
  padding?: number;
  className?: string;
}) {
  const [coords, setCoords] = useState<MenuCoords | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }

    let frame = 0;

    function place() {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCoords(
        measureMenu(rect, {
          width,
          preferredMaxHeight,
          gap,
          padding,
          align,
        }),
      );
    }

    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    }

    place();
    window.addEventListener("resize", schedule);
    // Nested scroll panes (settings modal) fire scroll on ancestors.
    window.addEventListener("scroll", schedule, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [open, anchorRef, width, preferredMaxHeight, gap, padding, align]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  if (!open || !coords || typeof document === "undefined") return null;

  const style: CSSProperties = {
    position: "fixed",
    left: coords.left,
    width: coords.width,
    maxHeight: coords.maxHeight,
    top: coords.top,
    bottom: coords.bottom,
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[130]" onClick={onClose} />
      <div
        role="menu"
        style={style}
        className={`border-app-border bg-app-canvas z-[131] overflow-y-auto rounded-[10px] border p-1 shadow-[0_3px_6px_rgba(0,0,0,0.08),0_9px_24px_rgba(0,0,0,0.14)] ${className}`}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
