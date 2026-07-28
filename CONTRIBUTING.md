# Contributing to mebi

Thanks for helping. mebi is a KCL-focused platform for finding project partners, shipping builds together, and publishing verified proof. Keep changes small, reviewable, and secure.

## Before you start

1. Open an issue for non-trivial work (features, schema changes, auth/security).
2. Fork the repo and branch from `main`.
3. Prefer one concern per PR. We review and ship in small chunks.

## Local setup

```bash
pnpm install
cp .env.example .env
# fill Clerk, DATABASE_URL, and optional Blob / AI keys
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Use Node 20+ and `pnpm` (lockfile is `pnpm-lock.yaml`).

## Development norms

- **TypeScript** stays strict. Do not weaken types to silence errors.
- **Server Actions / route handlers** own writes. Pages read via server components.
- **AuthZ** goes through membership helpers (`requireProjectMember`, etc.). Never trust client-supplied ownership.
- **Secrets** stay in `.env` / Vercel. Never commit keys, tokens, or dump files.
- **UI** follows the editorial product language in `docs/design-system.md` for authenticated surfaces.
- **Commits** use conventional prefixes (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`). Prefer natural, incremental history over one giant perfect commit.

## Checks before opening a PR

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

If you touch Prisma schema, include a migration and explain the rollback story in the PR.

## Pull requests

- Fill out the PR template.
- Link the issue.
- Describe the risk surface (auth, data, public pages) when relevant.
- Add screenshots or short recordings for UI changes.
- Keep the diff focused. Split unrelated cleanup into a follow-up.

## Security

If you find a vulnerability, do **not** open a public issue. Email the maintainer through GitHub (Sahil Basumatary) with steps to reproduce and impact. We will acknowledge and coordinate a fix before any disclosure.

## Code of conduct

Participation is governed by [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
