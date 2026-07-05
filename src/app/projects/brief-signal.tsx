"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type BriefField = "name" | "description" | "techStack" | "estimatedTime";

type BriefSignal = Record<BriefField, boolean>;

const EMPTY_SIGNAL: BriefSignal = {
  name: false,
  description: false,
  techStack: false,
  estimatedTime: false,
};

// Thresholds live here so the form only ever reports raw values and the
// definition of a "strong brief" stays in one place.
const RULES: Record<BriefField, (value: string) => boolean> = {
  name: (value) => value.trim().length >= 3,
  description: (value) => value.trim().length >= 60,
  techStack: (value) => value.trim().length > 0,
  estimatedTime: (value) => value.trim().length > 0,
};

const SignalContext = createContext<BriefSignal>(EMPTY_SIGNAL);
const ReportContext = createContext<(field: BriefField, value: string) => void>(() => {});

export function BriefSignalProvider({ children }: { children: ReactNode }) {
  const [signal, setSignal] = useState<BriefSignal>(EMPTY_SIGNAL);
  const report = useCallback((field: BriefField, value: string) => {
    const filled = RULES[field](value);
    setSignal((current) => (current[field] === filled ? current : { ...current, [field]: filled }));
  }, []);
  return (
    <SignalContext.Provider value={signal}>
      <ReportContext.Provider value={report}>{children}</ReportContext.Provider>
    </SignalContext.Provider>
  );
}

export function useBriefReport() {
  return useContext(ReportContext);
}

function FlatCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mt-1 flex h-4 w-4 shrink-0 items-center justify-center border transition-colors duration-300",
        checked ? "border-[#000000] bg-[#000000]" : "border-[#c4c4c4] bg-transparent",
      )}
    >
      <svg viewBox="0 0 12 12" fill="none" className="h-2.5 w-2.5">
        <path
          d="M2 6.4 4.8 9 10 3.6"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("transition-colors duration-300", checked ? "stroke-[#ffffff]" : "stroke-transparent")}
        />
      </svg>
    </span>
  );
}

const CHECKLIST: { field: BriefField; label: string; hint: string }[] = [
  { field: "name", label: "Project named", hint: "Crisp and searchable" },
  { field: "description", label: "Problem described", hint: "A sentence or two of real substance" },
  { field: "techStack", label: "Stack suggested", hint: "Lets specialists self-select" },
  { field: "estimatedTime", label: "Time estimated", hint: "Sets the commitment level" },
];

export function BriefChecklist() {
  const signal = useContext(SignalContext);
  const done = CHECKLIST.filter((item) => signal[item.field]).length;
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.24em] text-[#555555] uppercase">
        Live Checklist
      </p>
      <ul className="mt-4 grid gap-3.5">
        {CHECKLIST.map((item) => {
          const filled = signal[item.field];
          return (
            <li key={item.field} className="flex items-start gap-3">
              <FlatCheckbox checked={filled} />
              <div>
                <p
                  className={cn(
                    "text-[15px] font-medium transition-colors duration-300",
                    filled ? "text-[#000000]" : "text-[#555555]",
                  )}
                >
                  {item.label}
                </p>
                <p className="mt-0.5 text-[13px] text-[#8f8f8f]">{item.hint}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 font-mono text-[11px] tracking-[0.2em] text-[#8f8f8f] uppercase">
        {done === CHECKLIST.length ? "Ready to publish" : `${done} / ${CHECKLIST.length} signals`}
      </p>
    </div>
  );
}
