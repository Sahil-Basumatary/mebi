# Design system

Hackollab's authenticated product UI is a cool-grey canvas with paper surfaces, ink type, hairline dividers, and mono microlabels. Nav chrome stays navy. Marketing and auth stay on their own always-dark palette. Onboarding uses the light product tokens.

## Rules

1. One hero object per page, nameable in one word.
2. The spine carries one next action, never a metric row.
3. Numbers appear only where they describe the object on screen. No page-level KPI strips. Counts live in titles, tabs, filter bars, table headers, or identity rows. Hide zero unless the zero is the action.
4. No two pages distinguishable only by copy.
5. The rail is contextual or absent, never decorative.
6. Forum keeps its VLR red/blue identity (`.forum-theme`).
7. Leaderboard layout is frozen; inherit tokens only.
8. One compact masthead, then one bordered content well. Filters, tabs, column labels, rows, and empty results attach inside that well. Do not stack a boxed title, a boxed filter, a second heading, and a nested empty card.
9. Internal gutter is `px-4`. Rows use `py-2.5`. Controls stay at least `h-10`. Align search icons and row content to that gutter.
10. Empty states are contextual. `variant="inline"` sits inside a list well. `variant="panel"` is only for a standalone well. No viewport-filling empty cards.
11. One primary action per page. Do not repeat the same CTA in the header, empty state, and rail. Empty copy does not restyle a header button. Rails never duplicate the page action.

## Colour tokens

Use semantic `app-*` tokens. Do not hardcode hex in product pages.

| Token              | Light     | Dark      | Role                                          |
| ------------------ | --------- | --------- | --------------------------------------------- |
| `app-canvas`       | `#e8eaed` | `#12151a` | Page background                               |
| `app-paper`        | `#ffffff` | `#1c2128` | Card / section surface                        |
| `app-ink`          | `#1a1d21` | `#eef1f4` | Strong text                                   |
| `app-accent`       | `#1f6feb` | `#4d8fd6` | Primary actions, active tabs, progress, focus |
| `app-accent-hover` | `#1858c4` | `#3a7bc4` | Primary hover                                 |
| `app-link`         | `#1f6feb` | `#6ba8e8` | Inline links                                  |
| `app-signal`       | `#c23c3c` | `#e06570` | Unread, warning, destructive                  |
| `app-divider`      | `#d4d7dc` | `#2c333c` | Hairline borders                              |
| `app-label`        | `#5c6370` | `#9aa3ad` | Eyebrow labels                                |
| `app-body`         | `#2d3238` | `#c5ccd4` | Body copy                                     |
| `app-meta`         | `#6b7280` | `#7d8691` | Secondary labels                              |
| `app-wash`         | `#f3f5f7` | `#1a1f26` | Empty / hover wash                            |
| `app-chip`         | `#eef1f4` | `#232933` | Chip background                               |
| `app-chrome`       | `#1b1f24` | `#15181d` | Nav chrome (stays dark)                       |

Chrome tokens (`app-chrome*`) power the top and bottom nav. Marketing tokens (`canvas`, `surface`, `foreground`, …) stay for `/` and auth.

Dark mode flips product `app-*` tokens via `.dark` on `<html>`. Toggle lives in the account menu and Settings → Appearance. Chrome does not invert to white.

## Type scale

| Utility        | Size  | Use                         |
| -------------- | ----- | --------------------------- |
| `text-eyebrow` | 12px  | Section eyebrows, uppercase |
| `text-meta`    | 11px  | Rail labels, microcopy      |
| `text-chip`    | 10px  | Chips, kbd hints            |
| `text-body`    | 17px  | Default prose               |
| `text-body-sm` | 16px  | Dense prose (projects)      |
| `text-display` | clamp | Page titles                 |

Tracking: `tracking-eyebrow` (0.3em), `tracking-rail` (0.24em), `tracking-chip` (0.16em), `tracking-meta` (0.08em), `tracking-display` (-0.04em).

Fonts: Roboto (`font-sans`) for product UI and titles (`font-medium`). Marketing `/` display type uses Newsreader (`font-serif` + `font-light`) inside `.marketing` only. `--font-serif` stays aliased to Roboto everywhere else so leftover classes cannot resurrect Times. System mono for metadata.

## Layout primitives

Prefer `src/components/layout/*` over hand-rolled page markup:

- `PageHeader` — eyebrow + medium sans title. `density="compact"` for product list pages. Leaderboard stays `density="display"` and unboxed. `actions` holds page CTAs.
- `Section` — secondary header + body, used when the block is not already a `DataList`.
- `EmptyState` — `panel` for a standalone well, `inline` inside `DataList`. Do not use `fill`.
- `DataList` / `PanelHeader` / `ListColumns` / `DataRow` — one bordered well; section labels attach inside the well as `PanelHeader`. Rows share `px-4`.
- `Chip` — skill / interest / status pill (`tone="signal"` for unread)
- `ProgressBar` — build progress (accent fill)
- `UserRow` — avatar + name + role
- `StatusSpine` — identity, streak, one next action (owned by the group layout)
- `AppButton` — product CTA (`primary` accent, `danger` signal)

Shared display helpers live in `src/lib/user-display.ts` (`ROLE_LABEL`, `displayName`, `initials`). Next-action resolution lives in `src/lib/next-action.ts`. Brand wordmarks live in `public/brand/` and render through `BrandMark`. Site chrome footers live in `SiteFooter` (`marketing` on `/`, `public` on `/privacy` `/u` `/b`, `compact` on auth). Do not add a full footer inside the signed-in app shell.

## Shell

Authenticated routes live under `src/app/(app)/`:

| Route       | Hero object       | Rail            |
| ----------- | ----------------- | --------------- |
| `/home`     | Build path        | none            |
| `/projects` | Project brief     | Timeline        |
| `/partners` | Directory         | none            |
| `/inbox`    | Request queue     | Pending preview |
| `/proof`    | Completed records | none            |

The group layout owns chrome, the status spine, and the `@rail` parallel slot. Pages do not import `AppShell` directly. `/dashboard`, `/community`, and `/events` redirect for persisted bookmarks.

## Dark mode checklist

1. Prefer `app-*` tokens in every product surface under `src/app/(app)` and shared layout/dashboard components.
2. Marketing (`src/components/home/*`) and auth stay fixed dark.
3. Onboarding uses light product tokens, not the marketing palette.
4. Modal scrims may stay `bg-black/…` so they do not invert in dark mode.
5. Confetti / generative particle colours may stay literal hex.
6. Forum uses `--forum-blue` / `--forum-red` only inside `.forum-theme`.
