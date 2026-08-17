export type ShortcutId =
  | "search"
  | "openSettings"
  | "openShortcuts"
  | "goHome"
  | "goProjects"
  | "goPartners"
  | "goInbox"
  | "goProof"
  | "goForum"
  | "toggleTheme";

export type ShortcutBindingMap = Record<ShortcutId, string>;

export type ShortcutDefinition = {
  id: ShortcutId;
  label: string;
  group: "General" | "Navigation" | "Appearance";
  defaultCombo: string;
};

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  { id: "search", label: "Search", group: "General", defaultCombo: "meta+k" },
  {
    id: "openSettings",
    label: "Open settings",
    group: "General",
    defaultCombo: "meta+,",
  },
  {
    id: "openShortcuts",
    label: "Keyboard shortcuts",
    group: "General",
    defaultCombo: "meta+/",
  },
  { id: "goHome", label: "Go to Home", group: "Navigation", defaultCombo: "g+h" },
  {
    id: "goProjects",
    label: "Go to Projects",
    group: "Navigation",
    defaultCombo: "g+p",
  },
  {
    id: "goPartners",
    label: "Go to Partners",
    group: "Navigation",
    defaultCombo: "g+a",
  },
  {
    id: "goInbox",
    label: "Go to Requests",
    group: "Navigation",
    defaultCombo: "g+r",
  },
  {
    id: "goProof",
    label: "Go to Proof",
    group: "Navigation",
    defaultCombo: "g+o",
  },
  {
    id: "goForum",
    label: "Go to Forum",
    group: "Navigation",
    defaultCombo: "g+f",
  },
  {
    id: "toggleTheme",
    label: "Toggle light / dark",
    group: "Appearance",
    defaultCombo: "meta+shift+l",
  },
];

export const DEFAULT_SHORTCUT_BINDINGS: ShortcutBindingMap = Object.fromEntries(
  SHORTCUT_DEFINITIONS.map((item) => [item.id, item.defaultCombo]),
) as ShortcutBindingMap;

const SHORTCUT_IDS = new Set<string>(SHORTCUT_DEFINITIONS.map((item) => item.id));

function normalizeToken(token: string): string {
  const lower = token.trim().toLowerCase();
  if (lower === "cmd" || lower === "command" || lower === "⌘") return "meta";
  if (lower === "control" || lower === "⌃") return "ctrl";
  if (lower === "option" || lower === "⌥") return "alt";
  if (lower === "shift" || lower === "⇧") return "shift";
  if (lower === "escape") return "esc";
  if (lower === ",") return ",";
  if (lower === "/") return "/";
  if (lower === " ") return "space";
  return lower;
}

export function normalizeCombo(raw: string): string | null {
  const parts = raw
    .split("+")
    .map(normalizeToken)
    .filter(Boolean);
  if (parts.length === 0) return null;

  const mods = new Set(["ctrl", "alt", "shift", "meta"]);
  // Two letter keys with no modifiers = sequence chord (g then h).
  if (
    parts.length === 2 &&
    !mods.has(parts[0]) &&
    !mods.has(parts[1]) &&
    /^[a-z0-9]$/.test(parts[0]) &&
    /^[a-z0-9]$/.test(parts[1])
  ) {
    return `${parts[0]}+${parts[1]}`;
  }

  const key = parts[parts.length - 1];
  if (!key || key.length === 0) return null;
  const usedMods = new Set(parts.slice(0, -1));
  const ordered: string[] = [];
  if (usedMods.has("ctrl")) ordered.push("ctrl");
  if (usedMods.has("alt")) ordered.push("alt");
  if (usedMods.has("shift")) ordered.push("shift");
  if (usedMods.has("meta")) ordered.push("meta");
  // Reject unknown modifier tokens.
  if (ordered.length !== usedMods.size) return null;
  if (!/^[a-z0-9]$/.test(key) && ![",", "/", "esc", "space", "enter"].includes(key)) {
    return null;
  }
  return [...ordered, key].join("+");
}

export function comboFromKeyboardEvent(event: KeyboardEvent): string | null {
  if (["Control", "Alt", "Shift", "Meta"].includes(event.key)) return null;
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("ctrl");
  if (event.altKey) parts.push("alt");
  if (event.shiftKey) parts.push("shift");
  if (event.metaKey) parts.push("meta");
  const key = normalizeToken(event.key === " " ? "space" : event.key);
  if (!key) return null;
  return normalizeCombo([...parts, key].join("+"));
}

export function formatCombo(combo: string): string {
  if (isSequenceCombo(combo)) {
    const [a, b] = combo.split("+");
    return `${a.toUpperCase()} then ${b.toUpperCase()}`;
  }
  const isApple =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  return combo
    .split("+")
    .map((part) => {
      if (part === "meta") return isApple ? "⌘" : "Ctrl";
      if (part === "ctrl") return isApple ? "⌃" : "Ctrl";
      if (part === "alt") return isApple ? "⌥" : "Alt";
      if (part === "shift") return isApple ? "⇧" : "Shift";
      if (part === "esc") return "Esc";
      if (part === "space") return "Space";
      if (part === ",") return ",";
      if (part === "/") return "/";
      return part.toUpperCase();
    })
    .join(isApple ? "" : "+");
}

export function mergeShortcutBindings(raw: unknown): ShortcutBindingMap {
  const merged: ShortcutBindingMap = { ...DEFAULT_SHORTCUT_BINDINGS };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return merged;
  }
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!SHORTCUT_IDS.has(key) || typeof value !== "string") continue;
    const normalized = normalizeCombo(value);
    if (normalized) {
      merged[key as ShortcutId] = normalized;
    }
  }
  return merged;
}

export function findBindingConflicts(
  bindings: ShortcutBindingMap,
): Partial<Record<ShortcutId, ShortcutId>> {
  const seen = new Map<string, ShortcutId>();
  const conflicts: Partial<Record<ShortcutId, ShortcutId>> = {};
  for (const id of Object.keys(bindings) as ShortcutId[]) {
    const combo = bindings[id];
    const other = seen.get(combo);
    if (other) {
      conflicts[id] = other;
      conflicts[other] = id;
    } else {
      seen.set(combo, id);
    }
  }
  return conflicts;
}

export function eventMatchesCombo(event: KeyboardEvent, combo: string): boolean {
  const pressed = comboFromKeyboardEvent(event);
  return pressed === combo;
}

// Sequence chords like g+h: first key arms a short window for the second.
export function isSequenceCombo(combo: string): boolean {
  const parts = combo.split("+");
  return parts.length === 2 && !["ctrl", "alt", "shift", "meta"].includes(parts[0]);
}
