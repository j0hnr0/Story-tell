# CLAUDE.md

Guidance for Claude Code when working in this repository.

> **At the start of a session, read [`docs/PROGRESS.md`](./docs/PROGRESS.md)** — it holds current
> phase, what's done, and what's next. Full spec is in [`docs/PLAN.md`](./docs/PLAN.md).
>
> Keep this file small and stable. It loads into context on *every* message, so it holds only durable
> conventions — never progress notes, task lists, or line-number references.

## What this is

Storytell is a **scrollytelling** reader: a full-screen illustration sits behind the story text, and
as you scroll while reading aloud, the artwork cross-fades to the next scene. Built as an installable
**PWA** (Add to Home Screen on iOS), not a native app.

## Development commands

```bash
npm install              # deps (postinstall runs prisma generate once Prisma is added)
npm run dev              # dev server → http://localhost:3000
npm run build            # prisma generate && next build
npm start                # production server
npm run lint             # eslint

npx prisma migrate dev --name <name>   # create + apply migration
npx prisma db push                     # push schema without a migration
npx prisma studio                      # database GUI
```

Test on a real phone over the LAN — `npm run dev -- -H 0.0.0.0`, then open `http://<pc-ip>:3000`.
Desktop-only testing hides the iOS Safari toolbar and safe-area bugs this app is most prone to.

## Stack

- **Next.js 16** (App Router, Turbopack) — **TypeScript**, `strict: true`; `tsconfig.json`
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- **Prisma 7** + `@prisma/adapter-pg` → Supabase Postgres
- **Supabase Storage** for illustrations
- **NextAuth v4** credentials — two accounts only, roles `AUTHOR` and `READER`
- Animation is **plain CSS transitions**. Do not add an animation library.

Conventions mirror `../Link-sharing-app` and `../Note-taking-web-app`.

## Structure — feature-based (target)

Code is organised **by feature, not by file type**. A feature owns its components, hooks, and data
access together in one folder. `/app` is routing only.

```
/app                          # ROUTING ONLY — thin pages that import from /features
  /(reader)/story/[id]/page.tsx
  /author/page.tsx
  /author/story/[id]/page.tsx
  /api/...                    # route handlers: validate → delegate to a feature service → respond
/features
  /reader                     # the scrollytelling engine
    /components               # StoryReader, ImageStage, BeatSection, ChapterCard
    /hooks                    # useActiveBeat, useImagePreload, useWakeLock, useFontSize
    /services                 # story fetching for the reader
    index.ts                  # public API — the ONLY thing other features import from
  /story                      # Story / Chapter / Beat CRUD
  /author                     # editor UI + image upload
  /auth                       # NextAuth config, session helpers, role checks
  /progress                   # resume-where-you-left-off
  /reactions                  # hearts on beats
/components/ui                # shared, feature-agnostic presentational primitives
/lib                          # genuinely global: prisma client, supabase client, utils
/prisma/schema.prisma
/docs                         # PLAN.md (spec), PROGRESS.md (session log)
middleware.ts                 # route protection, at project root
```

### Feature-structure rules

1. **`/app` contains no logic.** A page reads params, calls a feature service, renders a feature
   component. If a page file grows past ~30 lines, the logic belongs in a feature.
2. **Features are self-contained.** Components, hooks, and services for one concern live together —
   when working on the reader, everything is in `features/reader`.
3. **Import across features only through `index.ts`.** Never reach into another feature's internals
   (`features/story/components/BeatRow` is off-limits from outside `features/story`).
4. **Promote on the second use, not the first.** Something needed by two features moves to
   `/components/ui` or `/lib`. Do not pre-emptively put things there "in case".
5. **When features must share data logic**, the owning feature exposes it — `features/story` owns
   Beat queries, and `features/reader` imports them from `features/story`.
6. `/lib` is for infrastructure with no domain meaning (Prisma client, Supabase client, formatters).
   Business logic never lives there.

## Core domain model

A **Beat** is the atomic unit: one illustration + one chunk of narration, ordered by `index`.
`Story → Chapter → Beat`. Progress and Reactions hang off Beat.

## Scrollytelling invariants

These are load-bearing. Breaking one makes the app feel broken in ways that are hard to trace.

1. **`svh`, never `vh`** — iOS Safari's collapsing toolbar makes `vh` layouts jump mid-scroll.
2. **Always preload beats `active+1` and `active+2`** — otherwise a cross-fade reveals a blank frame.
3. **The scrim is mandatory** — a gradient over the art layer. AI illustrations vary unpredictably in
   brightness and the text must stay readable over all of them.
4. **Active beat comes from `IntersectionObserver`**, not scroll-offset math. It self-corrects for
   variable text length, font-size changes, and rotation.
5. **Respect `prefers-reduced-motion`** — disable Ken Burns drift, shorten fades.
6. This app is **read out loud**. Anything that interrupts a spoken sentence (screen dimming, a
   layout jump, an unreadable line) is a real bug, not a polish item.

## Code conventions

- DB access goes through that feature's `services/`, never inline in a route handler or a component.
- API routes: validate session → extract `userId` → call the feature service → return status.
- Every protected route verifies the session user owns the resource.
