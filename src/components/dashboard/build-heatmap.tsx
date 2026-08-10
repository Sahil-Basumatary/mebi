"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalePrefs } from "@/components/locale-provider";
import {
  activityLevel,
  buildActivityYear,
  summarizeActivity,
  type BuildDay,
  type BuildEvent,
} from "@/lib/build-activity";
import { cn } from "@/lib/utils";

// Pixel geometry keeps the month labels, weekday rail, and cells on the same
// grid; percentage tracks drift once the gap is added. The cell edge is measured
// from the container so a year of columns spans the full width instead of
// leaving dead space to the right of December.
const GAP = 3;
const MIN_CELL = 11;
const RAIL_WIDTH = 28;
const RAIL_GAP = 8;
const TOOLTIP_WIDTH = 168;

const LEVEL_CLASS = [
  "bg-app-wash ring-1 ring-inset ring-app-border",
  "bg-app-ink/20",
  "bg-app-ink/40",
  "bg-app-ink/65",
  "bg-app-ink",
] as const;

const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

type HoverState = {
  day: BuildDay;
  week: number;
  row: number;
};

type BuildHeatmapProps = {
  events: BuildEvent[];
  className?: string;
};

function formatDay(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00.000Z`));
}

function monthLabel(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00.000Z`));
}

function eventLabel(count: number): string {
  if (count === 0) return "No build events";
  return `${count} build event${count === 1 ? "" : "s"}`;
}

export function BuildHeatmap({ events, className }: BuildHeatmapProps) {
  const { resolvedTimezone } = useLocalePrefs();
  const [hovered, setHovered] = useState<HoverState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  // Server and first client render both use UTC, then the grid settles onto the
  // viewer's real zone once the provider detects it — no hydration mismatch.
  const days = useMemo(() => buildActivityYear(events, resolvedTimezone), [events, resolvedTimezone]);
  const weeks = useMemo(() => {
    const columns: BuildDay[][] = [];
    for (let index = 0; index < days.length; index += 7) {
      columns.push(days.slice(index, index + 7));
    }
    return columns;
  }, [days]);
  const monthMarks = useMemo(() => {
    const marks: { week: number; label: string }[] = [];
    let previous = "";
    weeks.forEach((week, weekIndex) => {
      const label = monthLabel(week[0].date);
      if (label !== previous) {
        marks.push({ week: weekIndex, label });
        previous = label;
      }
    });
    // A partial leading month has no room for its label, so drop it like GitHub does.
    if (marks.length > 1 && marks[1].week - marks[0].week < 3) marks.shift();
    return marks;
  }, [weeks]);
  const summary = useMemo(() => summarizeActivity(days), [days]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      setViewport(entries[0]?.contentRect.width ?? 0);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Below MIN_CELL the squares stop being readable, so narrow screens keep the
  // floor and scroll horizontally instead. Rounding down with a 1px margin stops
  // a sub-pixel overflow from flickering the scrollbar in and out.
  const cell = useMemo(() => {
    if (!viewport) return MIN_CELL;
    const track = viewport - RAIL_WIDTH - RAIL_GAP - (weeks.length - 1) * GAP - 1;
    return Math.max(MIN_CELL, Math.floor((track / weeks.length) * 100) / 100);
  }, [viewport, weeks.length]);
  const step = cell + GAP;
  const gridWidth = weeks.length * step - GAP;
  const stats = [
    {
      label: "Current streak",
      value: `${summary.currentStreak}`,
      unit: summary.currentStreak === 1 ? "day" : "days",
    },
    {
      label: "Longest streak",
      value: `${summary.longestStreak}`,
      unit: summary.longestStreak === 1 ? "day" : "days",
    },
    { label: "Active days", value: `${summary.activeDays}`, unit: "of 365" },
  ];
  const anchorX = hovered
    ? RAIL_WIDTH + RAIL_GAP + hovered.week * step + cell / 2 - scrollLeft
    : 0;
  const tooltipLeft = viewport
    ? Math.min(Math.max(anchorX, TOOLTIP_WIDTH / 2), viewport - TOOLTIP_WIDTH / 2)
    : anchorX;
  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-app-label text-[12px] font-semibold tracking-[0.3em] uppercase">
          Build activity
        </p>
        <p className="text-app-meta font-mono text-[11px] tracking-[0.08em]">
          {new Intl.NumberFormat("en-GB").format(summary.total)} build event
          {summary.total === 1 ? "" : "s"} in the last year
        </p>
      </div>

      {/* The tooltip lives outside the scroll box, which clips both axes once
          overflow-x is set, so no empty band has to be reserved above the grid. */}
      <div className="relative mt-4">
        <div
          ref={scrollRef}
          className="overflow-x-auto"
          onScroll={(event) => setScrollLeft(event.currentTarget.scrollLeft)}
        >
          <div className="flex" style={{ width: "max-content", gap: RAIL_GAP }}>
            <div
              className="flex flex-col"
              style={{ gap: GAP, paddingTop: step, width: RAIL_WIDTH }}
            >
              {WEEKDAY_LABELS.map((label, index) => (
                <span
                  key={index}
                  className="text-app-meta flex items-center text-[9px] font-semibold tracking-[0.08em] uppercase"
                  style={{ height: cell }}
                >
                  {label}
                </span>
              ))}
            </div>
            <div>
              <div className="relative" style={{ width: gridWidth, height: step }}>
                {monthMarks.map((mark) => (
                  <span
                    key={`${mark.label}-${mark.week}`}
                    className="text-app-meta absolute top-0 text-[10px] font-semibold tracking-[0.12em] whitespace-nowrap uppercase"
                    style={{ left: mark.week * step }}
                  >
                    {mark.label}
                  </span>
                ))}
              </div>
              <div className="flex" style={{ gap: GAP }}>
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col" style={{ gap: GAP }}>
                    {week.map((day, rowIndex) => {
                      const level = activityLevel(day.count);
                      const isHovered = hovered?.day.date === day.date;
                      return (
                        <button
                          key={day.date}
                          type="button"
                          aria-label={`${formatDay(day.date)}: ${eventLabel(day.count).toLowerCase()}`}
                          onMouseEnter={() => setHovered({ day, week: weekIndex, row: rowIndex })}
                          onMouseLeave={() =>
                            setHovered((current) =>
                              current?.day.date === day.date ? null : current,
                            )
                          }
                          onFocus={() => setHovered({ day, week: weekIndex, row: rowIndex })}
                          onBlur={() =>
                            setHovered((current) =>
                              current?.day.date === day.date ? null : current,
                            )
                          }
                          style={{ width: cell, height: cell }}
                          className={cn(
                            "rounded-[2px] transition-shadow duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink",
                            LEVEL_CLASS[level],
                            isHovered && "shadow-[0_0_0_1.5px_var(--app-ink)]",
                          )}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {hovered ? (
          <div
            aria-hidden
            className="border-app-ink bg-app-ink pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg border px-3 py-2 text-center shadow-[0_14px_30px_rgba(0,0,0,0.24)]"
            style={{
              width: TOOLTIP_WIDTH,
              left: tooltipLeft,
              top: step + hovered.row * step - 8,
            }}
          >
            <p className="text-app-paper font-serif text-sm leading-snug font-light">
              {eventLabel(hovered.day.count)}
            </p>
            <p className="text-app-meta mt-1 font-mono text-[10px] tracking-[0.08em]">
              {formatDay(hovered.day.date)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-app-meta text-[9px] font-semibold tracking-[0.12em] uppercase">Less</span>
          {LEVEL_CLASS.map((tone) => (
            <span
              key={tone}
              aria-hidden
              style={{ width: MIN_CELL, height: MIN_CELL }}
              className={cn("rounded-[2px]", tone)}
            />
          ))}
          <span className="text-app-meta text-[9px] font-semibold tracking-[0.12em] uppercase">More</span>
        </div>
      </div>

      <dl className="border-app-divider mt-auto grid grid-cols-2 gap-x-8 gap-y-6 border-t pt-7 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="text-app-label text-[10px] font-semibold tracking-[0.18em] uppercase">
              {stat.label}
            </dt>
            <dd className="text-app-ink mt-3 font-serif text-3xl leading-none font-light">
              {stat.value}
            </dd>
            <dd className="text-app-meta mt-2 font-mono text-[10px] tracking-[0.08em]">{stat.unit}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
