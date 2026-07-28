"use client";

import { useMemo, useState } from "react";
import { useLocalePrefs } from "@/components/locale-provider";
import {
  activityLevel,
  buildActivityYear,
  summarizeActivity,
  type BuildDay,
  type BuildEvent,
} from "@/lib/build-activity";
import { cn } from "@/lib/utils";

// Fixed pixel geometry keeps the month labels, weekday rail, and cells on the
// same grid; percentage tracks drift once the gap is added.
const CELL = 11;
const GAP = 3;
const STEP = CELL + GAP;
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

function formatShortDay(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
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
  const gridWidth = weeks.length * STEP - GAP;
  const stats = [
    { label: "Current streak", value: `${summary.currentStreak}`, unit: summary.currentStreak === 1 ? "day" : "days" },
    { label: "Longest streak", value: `${summary.longestStreak}`, unit: summary.longestStreak === 1 ? "day" : "days" },
    { label: "Active days", value: `${summary.activeDays}`, unit: "of 365" },
    {
      label: "Busiest day",
      value: summary.busiest ? formatShortDay(summary.busiest.date) : "—",
      unit: summary.busiest ? eventLabel(summary.busiest.count).toLowerCase() : "nothing yet",
    },
  ];
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

      {/* Top padding reserves room for the tooltip, which the scroll container would otherwise clip. */}
      <div className="mt-4 overflow-x-auto pt-14">
        <div className="flex gap-2" style={{ width: "max-content" }}>
          <div className="flex flex-col" style={{ gap: GAP, paddingTop: STEP }}>
            {WEEKDAY_LABELS.map((label, index) => (
              <span
                key={index}
                className="text-app-meta flex items-center text-[9px] font-semibold tracking-[0.08em] uppercase"
                style={{ height: CELL }}
              >
                {label}
              </span>
            ))}
          </div>
          <div>
            <div className="relative" style={{ width: gridWidth, height: STEP }}>
              {monthMarks.map((mark) => (
                <span
                  key={`${mark.label}-${mark.week}`}
                  className="text-app-meta absolute top-0 text-[10px] font-semibold tracking-[0.12em] whitespace-nowrap uppercase"
                  style={{ left: mark.week * STEP }}
                >
                  {mark.label}
                </span>
              ))}
            </div>
            <div className="relative flex" style={{ gap: GAP }}>
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
                          setHovered((current) => (current?.day.date === day.date ? null : current))
                        }
                        onFocus={() => setHovered({ day, week: weekIndex, row: rowIndex })}
                        onBlur={() =>
                          setHovered((current) => (current?.day.date === day.date ? null : current))
                        }
                        style={{ width: CELL, height: CELL }}
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
              {hovered ? (
                <div
                  aria-hidden
                  className="border-app-ink bg-app-ink pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg border px-3 py-2 text-center shadow-[0_14px_30px_rgba(0,0,0,0.24)]"
                  style={{
                    width: TOOLTIP_WIDTH,
                    left: Math.min(
                      Math.max(hovered.week * STEP + CELL / 2, TOOLTIP_WIDTH / 2),
                      gridWidth - TOOLTIP_WIDTH / 2,
                    ),
                    top: hovered.row * STEP - 8,
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
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-app-label text-[12px] leading-5">
          Creates, updates, and completions across your pipeline.
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-app-meta text-[9px] font-semibold tracking-[0.12em] uppercase">Less</span>
          {LEVEL_CLASS.map((tone) => (
            <span
              key={tone}
              aria-hidden
              style={{ width: CELL, height: CELL }}
              className={cn("rounded-[2px]", tone)}
            />
          ))}
          <span className="text-app-meta text-[9px] font-semibold tracking-[0.12em] uppercase">More</span>
        </div>
      </div>

      <dl className="border-app-divider mt-auto grid grid-cols-2 gap-x-8 gap-y-6 border-t pt-7 sm:grid-cols-4">
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
