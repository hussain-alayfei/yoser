# Sakan 360

Housing journey platform — React + Vite front end, Express + tRPC back end, Drizzle ORM on MySQL.

## Stack

- **Client** — React 19, Vite 7, Tailwind 4, Radix UI, wouter, TanStack Query
- **Server** — Express, tRPC 11, Drizzle ORM, MySQL
- **Tests** — Vitest

## Getting started

```bash
pnpm install
pnpm dev
```

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run the dev server with hot reload |
| `pnpm build` | Build the client and bundle the server to `dist/` |
| `pnpm start` | Run the production build |
| `pnpm check` | Type-check without emitting |
| `pnpm test` | Run the test suite |
| `pnpm db:push` | Generate and apply Drizzle migrations |

## Deploying

`master` is the only branch — push to it and the deployment picks it up.

```bash
pnpm build
pnpm start
```

## Layout

```
client/    React app (pages, components, hooks)
server/    Express + tRPC API
shared/    Types and constants used by both
drizzle/   Database schema and migrations
```
