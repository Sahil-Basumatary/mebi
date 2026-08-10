"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  MAX_EXPERTISE_TAGS,
  MAX_TAG_LENGTH,
  OTHER_OPTION,
  parseExpertiseList,
} from "@/lib/expertise-options";
import { cn } from "@/lib/utils";

type TagComboboxProps = {
  id?: string;
  name: string;
  label: string;
  options: readonly string[];
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
  tone?: "app" | "onboarding";
};

export function TagCombobox({
  id,
  name,
  label,
  options,
  defaultValue = "",
  placeholder = "Search and select…",
  hint,
  tone = "app",
}: TagComboboxProps) {
  const generatedId = useId();
  const listId = useId();
  const inputId = id ?? generatedId;
  const otherId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suppressOpenOnFocusRef = useRef(false);
  const [selected, setSelected] = useState(() => parseExpertiseList(defaultValue));
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [otherMode, setOtherMode] = useState(false);
  const [otherValue, setOtherValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const available = useMemo(() => {
    const selectedSet = new Set(selected.map((tag) => tag.toLowerCase()));
    return options.filter((option) => !selectedSet.has(option.toLowerCase()));
  }, [options, selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter((option) => option.toLowerCase().includes(q));
  }, [available, query]);

  const canAddQuery = useMemo(() => {
    const q = query.trim();
    if (!q || q.length > MAX_TAG_LENGTH) return false;
    if (q.toLowerCase() === OTHER_OPTION.toLowerCase()) return false;
    return !selected.some((tag) => tag.toLowerCase() === q.toLowerCase());
  }, [query, selected]);

  const menuItems = useMemo(() => {
    const items: Array<{ kind: "option" | "other" | "add"; label: string }> = filtered.map(
      (option) => ({ kind: "option" as const, label: option }),
    );
    items.push({ kind: "other", label: OTHER_OPTION });
    if (canAddQuery && !filtered.some((option) => option.toLowerCase() === query.trim().toLowerCase())) {
      items.unshift({ kind: "add", label: query.trim() });
    }
    return items;
  }, [filtered, canAddQuery, query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open, menuItems.length]);

  function addTag(raw: string) {
    const tag = raw.trim().slice(0, MAX_TAG_LENGTH);
    if (!tag || tag.toLowerCase() === OTHER_OPTION.toLowerCase()) return;
    setSelected((current) => {
      if (current.length >= MAX_EXPERTISE_TAGS) return current;
      if (current.some((item) => item.toLowerCase() === tag.toLowerCase())) return current;
      return [...current, tag];
    });
    setQuery("");
    setOtherValue("");
    setOtherMode(false);
    setOpen(false);
    inputRef.current?.focus();
  }

  function removeTag(tag: string) {
    setSelected((current) => current.filter((item) => item !== tag));
  }

  function chooseItem(item: (typeof menuItems)[number]) {
    if (item.kind === "other") {
      setOtherMode(true);
      setOpen(false);
      setQuery("");
      return;
    }
    addTag(item.label);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !query && selected.length) {
      removeTag(selected[selected.length - 1]);
      return;
    }
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, menuItems.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = menuItems[activeIndex];
      if (item) chooseItem(item);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const atLimit = selected.length >= MAX_EXPERTISE_TAGS;
  const isApp = tone === "app";

  return (
    <div ref={rootRef} className="flex flex-col gap-2">
      <input type="hidden" name={name} value={selected.join(", ")} />
      <label htmlFor={inputId} className={isApp ? "sr-only" : "sr-only"}>
        {label}
      </label>

      {selected.length ? (
        <ul className="flex flex-wrap gap-1.5" aria-label={`Selected ${label.toLowerCase()}`}>
          {selected.map((tag) => (
            <li
              key={tag}
              className={
                isApp
                  ? "border-app-border bg-app-surface text-app-fg inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
                  : "inline-flex max-w-full items-center gap-1 rounded-full border border-[#262626] bg-[#050505] px-2.5 py-1 text-xs text-[#ffffff]"
              }
            >
              <span className="truncate">{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
                className={
                  isApp
                    ? "text-app-muted hover:text-app-fg rounded-full p-0.5"
                    : "rounded-full p-0.5 text-[#8f8f8f] hover:text-[#ffffff]"
                }
              >
                <X size={12} strokeWidth={2} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative">
        <div
          className={
            isApp
              ? "border-app-border bg-app-canvas focus-within:border-app-accent flex items-center gap-2 rounded-md border px-3"
              : "flex items-center gap-2 border-b border-[#262626] focus-within:border-[#ffffff]"
          }
        >
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open ? `${listId}-option-${activeIndex}` : undefined}
            disabled={atLimit}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value.slice(0, MAX_TAG_LENGTH));
              setOpen(true);
              setOtherMode(false);
            }}
            onFocus={() => {
              if (suppressOpenOnFocusRef.current) {
                suppressOpenOnFocusRef.current = false;
                return;
              }
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
            placeholder={atLimit ? `Maximum ${MAX_EXPERTISE_TAGS} selected` : placeholder}
            className={
              isApp
                ? "text-app-fg placeholder:text-app-muted-2 min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"
                : "min-w-0 flex-1 bg-transparent py-3 text-[#ffffff] outline-none placeholder:text-[#606060]"
            }
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={`Toggle ${label.toLowerCase()} options`}
            disabled={atLimit}
            onMouseDown={(event) => {
              // Keep focus on the input without letting focus handlers reopen the menu.
              event.preventDefault();
            }}
            onClick={() => {
              setOpen((wasOpen) => {
                if (wasOpen) {
                  suppressOpenOnFocusRef.current = true;
                  return false;
                }
                return true;
              });
              inputRef.current?.focus();
            }}
            className={isApp ? "text-app-muted" : "text-[#8f8f8f]"}
          >
            <ChevronDown
              size={16}
              strokeWidth={1.75}
              aria-hidden
              className={cn("transition-transform", open && "rotate-180")}
            />
          </button>
        </div>

        {open && !atLimit ? (
          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            className={
              isApp
                ? "border-app-border bg-app-canvas absolute z-30 mt-1 max-h-56 w-full overflow-y-auto border py-1 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
                : "absolute z-30 mt-1 max-h-56 w-full overflow-y-auto border border-[#262626] bg-[#0b0b0b] py-1 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
            }
          >
            {menuItems.length ? (
              menuItems.map((item, index) => {
                const active = index === activeIndex;
                return (
                  <li key={`${item.kind}-${item.label}`} role="presentation">
                    <button
                      id={`${listId}-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => chooseItem(item)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm",
                        isApp
                          ? active
                            ? "bg-app-hover text-app-fg"
                            : "text-app-fg hover:bg-app-hover"
                          : active
                            ? "bg-[#151515] text-[#ffffff]"
                            : "text-[#d8d8d8] hover:bg-[#151515]",
                      )}
                    >
                      <span className="min-w-0 truncate">
                        {item.kind === "add" ? (
                          <>
                            Add “{item.label}”
                          </>
                        ) : item.kind === "other" ? (
                          <>{OTHER_OPTION}…</>
                        ) : (
                          item.label
                        )}
                      </span>
                      {item.kind === "option" && active ? (
                        <Check size={14} strokeWidth={2} aria-hidden className="shrink-0 opacity-60" />
                      ) : null}
                    </button>
                  </li>
                );
              })
            ) : (
              <li
                className={
                  isApp
                    ? "text-app-muted px-3 py-2 text-sm"
                    : "px-3 py-2 text-sm text-[#8f8f8f]"
                }
              >
                No matches. Choose Other to add your own.
              </li>
            )}
          </ul>
        ) : null}
      </div>

      {otherMode ? (
        <div
          className={
            isApp
              ? "border-app-border bg-app-surface flex flex-col gap-2 rounded-md border p-3"
              : "flex flex-col gap-2 border border-[#262626] bg-[#050505] p-3"
          }
        >
          <label
            htmlFor={otherId}
            className={
              isApp
                ? "text-app-muted text-xs font-medium"
                : "text-xs font-medium text-[#8f8f8f]"
            }
          >
            Add a custom {label.toLowerCase().replace(/s$/, "")}
          </label>
          <div className="flex gap-2">
            <input
              id={otherId}
              value={otherValue}
              onChange={(event) => setOtherValue(event.target.value.slice(0, MAX_TAG_LENGTH))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTag(otherValue);
                }
                if (event.key === "Escape") {
                  setOtherMode(false);
                  setOtherValue("");
                }
              }}
              maxLength={MAX_TAG_LENGTH}
              autoFocus
              placeholder={`e.g. ${label === "Skills" ? "FPGA Design" : "Spatial Computing"}`}
              className={
                isApp
                  ? "border-app-border bg-app-canvas text-app-fg placeholder:text-app-muted-2 min-w-0 flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:border-app-accent"
                  : "min-w-0 flex-1 border border-[#262626] bg-[#000000] px-3 py-2 text-sm text-[#ffffff] outline-none placeholder:text-[#606060] focus:border-[#ffffff]"
              }
            />
            <button
              type="button"
              onClick={() => addTag(otherValue)}
              disabled={!otherValue.trim()}
              className={
                isApp
                  ? "bg-app-accent text-app-accent-fg hover:bg-app-accent-hover rounded-md px-3 py-2 text-sm font-medium disabled:opacity-40"
                  : "rounded-md bg-[#ffffff] px-3 py-2 text-sm font-medium text-[#000000] disabled:opacity-40"
              }
            >
              Add
            </button>
          </div>
        </div>
      ) : null}

      {hint ? (
        <p className={isApp ? "text-app-muted text-xs" : "text-xs text-[#8f8f8f]"}>{hint}</p>
      ) : null}
    </div>
  );
}
