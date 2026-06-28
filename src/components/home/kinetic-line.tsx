"use client";

import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type KineticLineProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "span" | "p" | "h1" | "h2" | "h3";
  variant?: "default" | "headline";
};

export function KineticLine({
  children,
  className,
  delay = 0,
  as: Component = "div",
  variant = "default",
}: KineticLineProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const setNodeRef = useCallback((node: HTMLElement | null) => {
    ref.current = node;
  }, []);
  const style = { transitionDelay: `${delay}ms` } as CSSProperties;
  const revealClassName =
    variant === "headline"
      ? cn(
          "block transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:translate-y-0 motion-reduce:opacity-100",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        )
      : cn(
          "block transition-[opacity,transform] duration-500 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        );
  const lineClassName = cn(
    revealClassName,
    className,
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      const frame = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px 12% 0px", threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (Component === "span") {
    return (
      <span ref={setNodeRef} style={style} className={lineClassName}>
        {children}
      </span>
    );
  }

  if (Component === "p") {
    return (
      <p ref={setNodeRef} style={style} className={lineClassName}>
        {children}
      </p>
    );
  }

  if (Component === "h1") {
    return (
      <h1 ref={setNodeRef} style={style} className={lineClassName}>
        {children}
      </h1>
    );
  }

  if (Component === "h2") {
    return (
      <h2 ref={setNodeRef} style={style} className={lineClassName}>
        {children}
      </h2>
    );
  }

  if (Component === "h3") {
    return (
      <h3 ref={setNodeRef} style={style} className={lineClassName}>
        {children}
      </h3>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className={lineClassName}>
      {children}
    </div>
  );
}
