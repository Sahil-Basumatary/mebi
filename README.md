# mebi

Find project partners at KCL, ship builds together, and publish verified proof.

Built by [Sahil Basumatary](https://github.com/Sahil-Basumatary).

## Stack

Next.js (App Router) · TypeScript · Tailwind · PostgreSQL / Prisma · Clerk · Vercel

## Setup

Node 20+, `pnpm`.

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Sign-up is gated to `*@kcl.ac.uk` via Clerk Allowlist.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Local app |
| `pnpm lint` / `pnpm typecheck` | Checks |
| `pnpm build:ci` | Generate + Next build (no migrate) |
| `pnpm build` | Migrate + generate + Next build (prod) |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md). Licensed under [MIT](./LICENSE).
