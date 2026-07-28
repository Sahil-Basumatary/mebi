"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type PartnerFiltersProps = {
  skills: string[];
  interests: string[];
  layout?: "bar" | "stack";
  className?: string;
};

const ROLE_OPTIONS = [
  { value: "", label: "Any role" },
  { value: "BUILDER", label: "Builder" },
  { value: "SPECIALIST", label: "Specialist" },
  { value: "LEARNER", label: "Learner" },
];

export function PartnerFilters({
  skills,
  interests,
  layout = "bar",
  className,
}: PartnerFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const stacked = layout === "stack";

  const hasFilters =
    Boolean(searchParams.get("q")) ||
    Boolean(searchParams.get("role")) ||
    Boolean(searchParams.get("skill")) ||
    Boolean(searchParams.get("interest"));

  useEffect(() => {
    const handle = setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (query.trim() === current) return;
      commit("q", query.trim());
    }, 300);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function commit(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function clearAll() {
    setQuery("");
    router.replace(pathname, { scroll: false });
  }

  const selectClass = cn(
    "h-10 w-full appearance-none border border-app-divider bg-app-paper px-3 text-sm text-app-ink focus:border-app-ink focus:outline-none",
  );

  return (
    <div className={cn("border-app-divider bg-app-paper border", stacked && "border-0", className)}>
      <div
        className={cn(
          "bg-app-divider grid gap-px",
          stacked ? "grid-cols-1" : "md:grid-cols-[1.6fr_1fr_1fr_1fr]",
        )}
      >
        <label className="bg-app-paper relative flex items-center">
          <span className="sr-only">Search partners</span>
          <Search
            size={16}
            strokeWidth={1.75}
            aria-hidden
            className="text-app-meta pointer-events-none absolute left-3"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, skill, or interest"
            aria-label="Search partners"
            className="text-app-ink placeholder:text-app-meta h-10 w-full bg-transparent pr-3 pl-9 text-sm focus:outline-none"
          />
        </label>
        <select
          value={searchParams.get("role") ?? ""}
          onChange={(event) => commit("role", event.target.value)}
          className={selectClass}
          aria-label="Filter by role"
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={searchParams.get("skill") ?? ""}
          onChange={(event) => commit("skill", event.target.value)}
          className={selectClass}
          aria-label="Filter by skill"
        >
          <option value="">Any skill</option>
          {skills.map((skill) => (
            <option key={skill} value={skill}>
              {skill}
            </option>
          ))}
        </select>
        <select
          value={searchParams.get("interest") ?? ""}
          onChange={(event) => commit("interest", event.target.value)}
          className={selectClass}
          aria-label="Filter by interest"
        >
          <option value="">Any interest</option>
          {interests.map((interest) => (
            <option key={interest} value={interest}>
              {interest}
            </option>
          ))}
        </select>
      </div>
      {hasFilters ? (
        <div className="border-app-divider flex items-center justify-between border-t px-3 py-2">
          <p className="text-app-label text-xs">Filters applied</p>
          <button
            type="button"
            onClick={clearAll}
            className="text-app-ink inline-flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-60"
          >
            <X size={13} strokeWidth={2} />
            Clear all
          </button>
        </div>
      ) : null}
    </div>
  );
}
