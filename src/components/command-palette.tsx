"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SearchHit, SearchResults } from "@/lib/search-types";

type PageHit = SearchHit & { run?: () => void };

const PAGES: PageHit[] = [
  { id: "page:/home", label: "Home", hint: "Home", href: "/home" },
  { id: "page:/projects", label: "Projects", hint: "Projects", href: "/projects" },
  { id: "page:/discover", label: "Discover", hint: "Discover", href: "/discover" },
  { id: "page:/partners", label: "Partners", hint: "People", href: "/partners" },
  { id: "page:/forum", label: "Forum", hint: "Forum", href: "/forum" },
  { id: "page:/inbox", label: "Inbox", hint: "Requests", href: "/inbox" },
  { id: "page:/proof", label: "Proof", hint: "Proof", href: "/proof" },
  { id: "page:/leaderboard", label: "Leaderboard", hint: "Standings", href: "/leaderboard" },
];

type PaletteItem = PageHit & { group: string };

function filterPages(query: string): PageHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return PAGES;
  return PAGES.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.hint.toLowerCase().includes(q) ||
      item.href.includes(q),
  );
}

export function CommandPalette({
  open,
  onClose,
  onOpenSettings,
}: {
  open: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<{ q: string; data: SearchResults } | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      void fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
        credentials: "same-origin",
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((data: SearchResults | null) => {
          if (data) setHits({ q, data });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 200);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  const items = useMemo(() => {
    const pages = filterPages(query);
    const settings: PaletteItem = {
      id: "action:settings",
      label: "Open settings",
      hint: "Preferences",
      href: "",
      group: "Actions",
      run: onOpenSettings,
    };
    const grouped: PaletteItem[] = pages.map((item) => ({ ...item, group: "Pages" }));
    const q = query.trim().toLowerCase();
    if (!q || settings.label.toLowerCase().includes(q) || settings.hint.toLowerCase().includes(q)) {
      grouped.push(settings);
    }
    const remote = hits && hits.q === query.trim() ? hits.data : null;
    if (remote) {
      grouped.push(
        ...remote.people.map((item) => ({ ...item, group: "People" })),
        ...remote.projects.map((item) => ({ ...item, group: "Projects" })),
        ...remote.threads.map((item) => ({ ...item, group: "Forum" })),
      );
    }
    return grouped;
  }, [query, hits, onOpenSettings]);

  function run(item: PaletteItem) {
    if (item.run) {
      item.run();
    } else if (item.href) {
      router.push(item.href);
    }
    onClose();
  }

  if (!open || typeof document === "undefined") return null;

  const emptyQuery = query.trim().length === 0;
  const searching = query.trim().length >= 2 && loading;
  const noMatches = items.length === 0 && !searching;
  const safeActive = items.length === 0 ? 0 : Math.min(active, items.length - 1);

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-start justify-center bg-black/35 px-4 pt-[12vh]">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="border-app-border bg-app-canvas relative z-[141] w-full max-w-xl overflow-hidden rounded-none border shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              onClose();
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => Math.min(index + 1, Math.max(items.length - 1, 0)));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
            }
            if (event.key === "Enter" && items[safeActive]) {
              event.preventDefault();
              run(items[safeActive]);
            }
          }}
          aria-label="Search people, projects, and forum"
          placeholder="Search people, projects, forum…"
          className="border-app-border text-app-fg placeholder:text-app-muted-2 h-12 w-full border-b bg-transparent px-4 text-[15px] outline-none"
        />
        <ul className="max-h-80 overflow-y-auto p-1.5" role="listbox">
          {noMatches ? (
            <li className="text-app-muted px-3 py-6 text-center text-sm">No matches</li>
          ) : (
            items.map((item, index) => {
              const showGroup = index === 0 || items[index - 1]?.group !== item.group;
              return (
                <li key={item.id} role="option" aria-selected={index === safeActive}>
                  {showGroup ? (
                    <p className="text-app-muted px-3 pt-2 pb-1 text-[11px] font-semibold tracking-[0.08em] uppercase">
                      {item.group}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => run(item)}
                    className={
                      index === safeActive
                        ? "bg-app-hover text-app-fg flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm"
                        : "text-app-fg hover:bg-app-hover flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors"
                    }
                  >
                    <span className="truncate">{item.label}</span>
                    <span className="text-app-muted-2 ml-3 shrink-0 text-xs">{item.hint}</span>
                  </button>
                </li>
              );
            })
          )}
          {emptyQuery ? null : searching ? (
            <li className="text-app-muted px-3 py-2 text-xs">Searching…</li>
          ) : null}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
