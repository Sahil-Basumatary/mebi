"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FEATURED_STORIES } from "@/lib/stories";

// Positions only — the story content is shared with the homepage grid so both
// surfaces stay identical. Order matches FEATURED_STORIES.
const NODE_POSITIONS = [
  { x: 50, y: 15 },
  { x: 85, y: 62 },
  { x: 18, y: 68 },
];

const STORY_NODES = FEATURED_STORIES.map((story, index) => ({
  ...story,
  ...NODE_POSITIONS[index],
}));

const PLAIN_NODES = [
  { x: 24, y: 33 },
  { x: 78, y: 30 },
  { x: 57, y: 88 },
];

const HUB = { x: 50, y: 50 };

const EDGES: [{ x: number; y: number }, { x: number; y: number }][] = [
  [HUB, STORY_NODES[0]],
  [HUB, STORY_NODES[1]],
  [HUB, STORY_NODES[2]],
  [STORY_NODES[0], PLAIN_NODES[0]],
  [STORY_NODES[0], PLAIN_NODES[1]],
  [STORY_NODES[1], PLAIN_NODES[1]],
  [STORY_NODES[1], PLAIN_NODES[2]],
  [STORY_NODES[2], PLAIN_NODES[0]],
  [STORY_NODES[2], PLAIN_NODES[2]],
];

export function HeroConstellation() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [last, setLast] = useState(0);
  const active = STORY_NODES[last];

  function focusNode(index: number) {
    setHovered(index);
    setLast(index);
  }

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 100 100" role="presentation" className="h-full w-full overflow-visible">
        <circle cx="52" cy="50" r="44" fill="none" stroke="#efefef" strokeWidth="0.5" />
        <circle cx="52" cy="50" r="30" fill="none" stroke="#f2f2f2" strokeWidth="0.5" />
        {EDGES.map(([from, to], index) => {
          const isActive =
            hovered !== null &&
            (from === STORY_NODES[hovered] || to === STORY_NODES[hovered]);
          return (
            <line
              key={index}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isActive ? "#000000" : "#d4d4d4"}
              strokeWidth={isActive ? 1 : 0.6}
              className="transition-all duration-200"
            />
          );
        })}
        {PLAIN_NODES.map((node, index) => (
          <circle
            key={index}
            cx={node.x}
            cy={node.y}
            r="1.7"
            fill="#ffffff"
            stroke="#000000"
            strokeWidth="0.8"
          />
        ))}
        <circle cx={HUB.x} cy={HUB.y} r="4.2" fill="#ffffff" />
        <circle cx={HUB.x} cy={HUB.y} r="3.2" fill="#000000" />
      </svg>

      {STORY_NODES.map((node, index) => (
        <button
          key={node.category}
          type="button"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          onMouseEnter={() => focusNode(index)}
          onMouseLeave={() => setHovered(null)}
          onFocus={() => focusNode(index)}
          onBlur={() => setHovered(null)}
          aria-label={`${node.category} story: ${node.title}`}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-2"
        >
          <span
            className={cn(
              "block h-3 w-3 rounded-full bg-[#000000] ring-2 ring-[#ffffff] transition-transform duration-200",
              hovered === index ? "scale-150" : "scale-100",
            )}
          />
        </button>
      ))}

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 right-[104%] z-20 w-60 -translate-y-1/2 border border-[#1a1a1a] bg-[#000000] text-left shadow-[0_24px_60px_rgba(0,0,0,0.22)] transition-all duration-200",
          hovered === null ? "translate-x-2 opacity-0" : "translate-x-0 opacity-100",
        )}
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#0d0d0d]">
          {active.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={active.image} alt={active.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center border-b border-[#1a1a1a]">
              <span className="text-[9px] font-semibold tracking-[0.3em] text-[#3a3a3a] uppercase">
                Image coming soon
              </span>
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[#8f8f8f] uppercase">
            {active.category} · {active.date}
          </p>
          <p className="mt-2 font-[family-name:var(--font-newsreader)] text-sm leading-snug font-light text-[#ffffff]">
            {active.title}
          </p>
        </div>
      </div>

      <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-semibold tracking-[0.2em] whitespace-nowrap text-[#bcbcbc] uppercase">
        Hover the nodes
      </span>
    </div>
  );
}
