"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { cn } from "@/lib/utils";

export function DiscoverFilters({
  stacks,
  resultCount,
  className,
}: {
  stacks: string[];
  resultCount: number;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const hasFilters =
    Boolean(searchParams.get("q")) ||
    Boolean(searchParams.get("stack")) ||
    Boolean(searchParams.get("sort"));

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (query.trim() === current) return;
      commit("q", query.trim());
    }, 300);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function commit(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const encoded = next.toString();
    router.replace(encoded ? `${pathname}?${encoded}` : pathname, { scroll: false });
  }

  function clearAll() {
    setQuery("");
    router.replace(pathname, { scroll: false });
  }

  const selectClass =
    "h-10 w-full appearance-none border-0 bg-app-paper px-4 text-sm text-app-ink focus:outline-none";

  return (
    <div className={cn("bg-app-paper", className)}>
      <div className="bg-app-divider grid gap-px md:grid-cols-[minmax(0,1.6fr)_1fr_1fr]">
        <label className="bg-app-paper relative flex items-center">
          <span className="sr-only">Search projects</span>
          <Search
            size={16}
            strokeWidth={1.75}
            aria-hidden
            className="text-app-meta pointer-events-none absolute left-4"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects"
            className="text-app-ink placeholder:text-app-meta h-10 w-full bg-transparent pr-4 pl-10 text-sm outline-none"
          />
        </label>
        <select
          value={searchParams.get("stack") ?? ""}
          onChange={(event) => commit("stack", event.target.value)}
          className={selectClass}
          aria-label="Filter by technology"
        >
          <option value="">Any technology</option>
          {stacks.map((stack) => (
            <option key={stack} value={stack}>
              {stack}
            </option>
          ))}
        </select>
        <select
          value={searchParams.get("sort") ?? ""}
          onChange={(event) => commit("sort", event.target.value)}
          className={selectClass}
          aria-label="Sort projects"
        >
          <option value="">Recently active</option>
          <option value="progress">Most progress</option>
          <option value="team">Largest team</option>
        </select>
      </div>
      <div className="border-app-divider flex h-10 items-center justify-between border-y px-4">
        <span className="text-app-meta text-xs tabular-nums">
          {resultCount} project{resultCount === 1 ? "" : "s"}
        </span>
        {hasFilters ? (
          <AppButton type="button" variant="ghost" size="sm" onClick={clearAll}>
            <X size={13} strokeWidth={2} aria-hidden />
            Clear
          </AppButton>
        ) : null}
      </div>
    </div>
  );
}
