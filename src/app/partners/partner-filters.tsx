"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type PartnerFiltersProps = {
  skills: string[];
  interests: string[];
};

const ROLE_OPTIONS = [
  { value: "", label: "Any role" },
  { value: "BUILDER", label: "Builder" },
  { value: "SPECIALIST", label: "Specialist" },
  { value: "LEARNER", label: "Learner" },
];

const selectClass =
  "h-10 w-full appearance-none border border-[#d8d8d8] bg-[#ffffff] px-3 text-sm text-[#111111] focus:border-[#000000] focus:outline-none";

export function PartnerFilters({ skills, interests }: PartnerFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const hasFilters =
    Boolean(searchParams.get("q")) ||
    Boolean(searchParams.get("role")) ||
    Boolean(searchParams.get("skill")) ||
    Boolean(searchParams.get("interest"));

  // Free-text search is debounced so we navigate once the user pauses, not on
  // every keystroke. Structured selects below commit immediately.
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

  return (
    <div className="border border-[#d8d8d8] bg-[#ffffff]">
      <div className="grid gap-px bg-[#d8d8d8] md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <label className="relative flex items-center bg-[#ffffff]">
          <Search size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3 text-[#999999]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, skill, or interest"
            className="h-10 w-full bg-transparent pr-3 pl-9 text-sm text-[#111111] placeholder:text-[#999999] focus:outline-none"
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
        <div className="flex items-center justify-between border-t border-[#d8d8d8] px-3 py-2">
          <p className="text-xs text-[#555555]">Filters applied</p>
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#111111] transition-opacity hover:opacity-60"
          >
            <X size={13} strokeWidth={2} />
            Clear all
          </button>
        </div>
      ) : null}
    </div>
  );
}
