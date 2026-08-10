# Design system

mebi's authenticated product UI is an editorial canvas: paper surfaces, ink type, hairline dividers, serif display, mono microlabels. The shell chrome (nav) is inverted. Marketing and auth stay on their own always-dark palette.

## Rules

1. One hero object per page, nameable in one word.
2. The spine carries one next action, never a metric row.
3. Numbers appear only where the number is the subject.
4. No two pages distinguishable only by copy.
5. The rail is contextual or absent, never decorative.

## Colour tokens

Use semantic `app-*` tokens. Do not hardcode hex in product pages.

| Token | Light | Role |
|-------|-------|------|
| `app-canvas` | `#ffffff` | Page background |
| `app-fg` | `#000000` | Primary foreground |
| `app-paper` | `#ffffff` | Card / section surface |
| `app-ink` | `#000000` | Strong text / fills |
| `app-divider` | `#d8d8d8` | Hairline borders and grid gaps |
| `app-label` | `#555555` | Eyebrow labels |
| `app-body` | `#333333` | Body copy on paper |
| `app-meta` | `#8f8f8f` | Secondary mono labels |
| `app-wash` | `#f7f7f7` | Empty / hover wash |
| `app-chip` | `#f4f4f4` | Chip / tag background |
| `app-signal` | `#ff4d4d` | Unread / error only |

Chrome tokens (`app-chrome*`) power the top and bottom nav. Marketing tokens (`canvas`, `surface`, `foreground`, …) stay for `/`, auth, and onboarding.

Dark mode flips every `app-*` token via `.dark` on `<html>`. Toggle lives in the account menu and Settings → Appearance.

## Type scale

| Utility | Size | Use |
|---------|------|-----|
| `text-eyebrow` | 12px | Section eyebrows, uppercase |
| `text-meta` | 11px | Rail labels, microcopy |
| `text-chip` | 10px | Chips, kbd hints |
| `text-body` | 17px | Default prose |
| `text-body-sm` | 16px | Dense prose (projects) |
| `text-display` | clamp | Serif page titles |

Tracking: `tracking-eyebrow` (0.3em), `tracking-rail` (0.24em), `tracking-chip` (0.16em), `tracking-meta` (0.08em), `tracking-display` (-0.04em).

Fonts: Guardian Sans (`font-sans`) for UI, Newsreader (`font-serif`) for display, system mono for metadata.

## Layout primitives

Prefer `src/components/layout/*` over hand-rolled page markup:

- `PageHeader` — eyebrow + serif title + optional aside
- `Section` — section header row + body
- `HairlineGrid` / `HairlineCell` — `gap-px` divider grid
- `EmptyState` — wash block + CTA
- `Stat` — single labelled value (use sparingly; never in the spine)
- `Chip` — skill / interest / status pill
- `ProgressBar` — build progress
- `UserRow` — avatar + name + role
- `StatusSpine` — identity, streak, one next action (owned by the group layout)

Shared display helpers live in `src/lib/user-display.ts` (`ROLE_LABEL`, `displayName`, `initials`). Next-action resolution lives in `src/lib/next-action.ts`.

## Shell

Authenticated routes live under `src/app/(app)/`:

| Route | Hero object | Rail |
|-------|-------------|------|
| `/home` | Build path | none |
| `/projects` | Project brief | Timeline |
| `/partners` | Directory | Filters |
| `/inbox` | Request queue | Pending preview |
| `/proof` | Completed records | none |

The group layout owns chrome, the status spine, and the `@rail` parallel slot. Pages do not import `AppShell` directly. `/dashboard`, `/community`, and `/events` redirect for persisted bookmarks.

## Dark mode checklist

1. Prefer `app-*` tokens in every product surface under `src/app/(app)` and shared layout/dashboard components.
2. Marketing (`src/components/home/*`) and auth stay fixed dark.
3. Modal scrims may stay `bg-black/…` so they do not invert in dark mode.
4. Confetti / generative particle colours may stay literal hex.
