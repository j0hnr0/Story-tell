# Storytell — scroll-driven illustrated storytelling app

## Context

Storytell is a personal gift project: an app for reading illustrated stories aloud to one person.
The core experience is **scrollytelling** — a full-screen illustration sits behind the story text, and
as you scroll through the text while reading aloud, the artwork cross-fades to the next scene at
exactly the right beat. Chapter changes get a bigger visual moment.

Decisions already made:

| Question | Answer |
| --- | --- |
| Advance mechanic | **Scroll-driven** — image cross-fades when new text crosses screen center |
| Content source | **Backend + web authoring** — stories in Postgres, added without reinstalling |
| Her device | **iPhone** — distribution was open; this plan commits to a **PWA** |
| Artwork | **AI-generated illustrations**, one per beat |

### Why PWA instead of Expo / React Native

- Expo Go on iOS means she installs Expo's app and reads inside it, with Expo branding — it breaks on
  every SDK bump. A true standalone iOS build requires a **$99/yr Apple Developer account** and
  **TestFlight builds that expire every 90 days**.
- A PWA is **$0**: Safari → Share → *Add to Home Screen* gives a real icon that launches full-screen
  with no browser chrome. For an experience that is images + text + scrolling, this is
  indistinguishable from native.
- It reuses the **exact stack already in `../Link-sharing-app`** (Next 16, Tailwind 4, Prisma 7,
  Supabase, NextAuth) — so effort goes into the story engine, not into learning a new ecosystem.
- Reversible: the reader is a URL, so wrapping it in Capacitor later for a real App Store build
  discards none of this work.

**Intended outcome:** open a story on your phone, read aloud while thumb-scrolling, and the art
changes with the narrative — and she can reopen any story herself, from her home screen, anytime.

---

## How we work across the week

This is a multi-session build, so session continuity is part of the setup. Three files, three
distinct jobs — **the plan does not go in `CLAUDE.md`.**

| File | Job | When it loads |
| --- | --- | --- |
| `CLAUDE.md` | Stable conventions: stack, commands, structure, patterns | **Every session, automatically** |
| `docs/PLAN.md` | This document — full spec + roadmap | On demand |
| `docs/PROGRESS.md` | What's done, what's next, decisions made | Read at the start of each session |

`CLAUDE.md` answers *"how do we write code here"* and should rarely change. `PROGRESS.md` answers
*"where did we leave off"* and changes every session. Merging them is what makes a `CLAUDE.md` rot —
compare the `Responsive Design Status` section in `../Note-taking-web-app/CLAUDE.md`, which pins exact
line numbers and is already drifting out of date while costing context on every message.

**End-of-session ritual:** update `Done` / `Next up`, append anything decided to `Decisions made`, then
commit. **Start-of-session ritual:** say *"read docs/PROGRESS.md and continue"* — that one line
rebuilds full context, so no session starts cold.

Keep each session scoped to roughly one phase from the build order below. The phases are deliberately
sized so each ends at a working, committable state rather than mid-refactor.

---

## Stack

Mirror `../Link-sharing-app` so conventions carry over — **App Router, Tailwind v4 via
`@tailwindcss/postcss`** — with one deliberate departure: this project is **TypeScript**
(`strict: true`, `tsconfig.json`), not JavaScript, so Prisma's generated model types flow through
the services.

- **Next.js 16** (App Router, Turbopack) — deployed to Vercel
- **Tailwind CSS v4**
- **Prisma 7** + `@prisma/adapter-pg` → **Supabase Postgres**
- **Supabase Storage** for illustration files (`@supabase/supabase-js`)
- **NextAuth v4** (credentials) — exactly two accounts, `AUTHOR` and `READER`
- **`use-debounce`** for progress saving (already used in `../Note-taking-web-app`)
- Cross-fades in **plain CSS transitions** — no animation library needed; opacity transitions on
  stacked images are GPU-composited and smoother than a JS-driven library here

---

## Data model — `prisma/schema.prisma`

The central abstraction is a **Beat**: one illustration + one chunk of narration. Everything else
hangs off that.

```prisma
enum Role     { AUTHOR READER }
enum Status   { DRAFT PUBLISHED }

model User {
  id           String     @id @default(cuid())
  email        String     @unique
  name         String?
  passwordHash String
  role         Role       @default(READER)
  progress     Progress[]
  reactions    Reaction[]
}

model Story {
  id          String    @id @default(cuid())
  title       String
  subtitle    String?
  coverUrl    String?
  stylePrompt String?   // shared AI-art style suffix — keeps illustrations visually consistent
  status      Status    @default(DRAFT)
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  chapters    Chapter[]
  beats       Beat[]
}

model Chapter {
  id      String @id @default(cuid())
  storyId String
  index   Int            // 0-based order
  title   String
  story   Story  @relation(fields: [storyId], references: [id], onDelete: Cascade)
  beats   Beat[]
  @@unique([storyId, index])
}

model Beat {
  id           String     @id @default(cuid())
  storyId      String
  chapterId    String?
  index        Int              // 0-based order within the whole story
  text         String     @db.Text
  imageUrl     String
  imageAlt     String?
  blurDataUrl  String?          // tiny base64 placeholder -> instant paint, no flash
  focalPoint   String     @default("50% 50%")  // CSS object-position; keeps faces framed on tall phones
  transitionMs Int        @default(700)
  story        Story      @relation(fields: [storyId], references: [id], onDelete: Cascade)
  chapter      Chapter?   @relation(fields: [chapterId], references: [id], onDelete: SetNull)
  reactions    Reaction[]
  @@unique([storyId, index])
}

model Progress {
  id            String   @id @default(cuid())
  userId        String
  storyId       String
  lastBeatIndex Int      @default(0)
  updatedAt     DateTime @updatedAt
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, storyId])
}

model Reaction {
  id        String   @id @default(cuid())
  userId    String
  beatId    String
  emoji     String   @default("♥")
  note      String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  beat      Beat     @relation(fields: [beatId], references: [id], onDelete: Cascade)
  @@unique([userId, beatId])
}
```

---

## The reading engine (the heart of the app)

**`app/(reader)/story/[id]/page.tsx`** — server component, fetches story + chapters + beats ordered
by `index`, passes to the client reader.

**`components/reader/StoryReader.tsx`** — client component. Three stacked layers:

### Layer 1 — fixed image stage (`position: fixed; inset: 0; z-index: 0`)

Render **every** beat image absolutely positioned on top of each other, all `opacity-0` except the
active one:

```jsx
<div className="fixed inset-0 -z-10">
  {beats.map((b, i) => (
    <img
      key={b.id}
      src={b.imageUrl}
      alt={b.imageAlt ?? ""}
      style={{ objectPosition: b.focalPoint, transitionDuration: `${b.transitionMs}ms` }}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity ease-out
                  ${i === active ? "opacity-100 animate-kenburns" : "opacity-0"}`}
    />
  ))}
</div>
```

- A slow `@keyframes kenburns` (`scale(1) → scale(1.08)` over ~20s) on the active image gives quiet
  life so a static illustration never feels frozen.
- **Preload beats `active+1` and `active+2`** (`new Image().src = …` in an effect) so a fade never
  reveals a blank frame — this is the single most common way scrollytelling feels broken.
- Respect `prefers-reduced-motion`: disable Ken Burns, shorten fades.

### Layer 2 — readability scrim

`fixed inset-0 -z-[5] bg-gradient-to-t from-black/85 via-black/55 to-black/25` plus a light
`backdrop-blur-[2px]`. Non-negotiable — AI art has unpredictable brightness and text must stay
legible over all of it.

### Layer 3 — scrolling narration

One `<section data-beat="{i}">` per beat, each `min-h-[70svh]` (use `svh`, not `vh` — iOS Safari's
toolbar makes `vh` jump). Detect the active beat with a single **`IntersectionObserver`** using a
thin band across the vertical middle:

```js
const io = new IntersectionObserver(
  (entries) => {
    entries
      .filter((e) => e.isIntersecting)
      .forEach((e) => setActive(Number(e.target.dataset.beat)));
  },
  { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
);
```

This is deliberately **not** scroll-offset math: it self-corrects for variable text lengths, font-size
changes, and rotation, and it costs nothing per frame.

### Chapter moments

When `beats[active].chapterId !== beats[prev].chapterId`, render a full-bleed chapter card
(`ChapterCard.tsx`) — chapter title fading up over a briefly darkened stage, with a longer
`transitionMs`. This is the "next chapter" moment, given its own visual weight.

### Read-aloud comfort (this app is *read out loud* — these matter)

- **Screen wake lock** — `navigator.wakeLock.request("screen")` while reading, released on unmount.
  Without it the phone dims mid-sentence. Re-acquire on `visibilitychange`.
- **Font-size control** — three sizes persisted in `localStorage`.
- **Progress save** — debounced (~1.5s) `POST /api/progress` on active-beat change → "Continue
  reading" on the home screen.
- **Double-tap a beat → heart** (`POST /api/reactions`), so you can see afterward which moments landed.

---

## Authoring (desktop web, `AUTHOR` only)

Gated in `middleware.ts` on the NextAuth token's `role`, matching the middleware pattern already in
both sibling projects.

- `app/author/page.tsx` — story list, create / publish / unpublish
- `app/author/story/[id]/page.tsx` — chapter + beat editor: reorderable beat list, each beat a
  textarea plus an image dropzone
- `app/api/upload/route.ts` — receives the file, uploads to a Supabase Storage bucket, generates the
  `blurDataUrl`, returns the public URL
- A **Preview** button opening the real reader inside a phone-sized frame

**AI art consistency note:** store a `stylePrompt` on the Story and append it to every image prompt
(same medium, palette, lighting, character description). Without a fixed suffix, illustrations drift
in style between beats and the story stops feeling like one book. Generate portrait (~1024×1536) to
match phone aspect.

---

## PWA setup (iOS-specific — easy to get subtly wrong)

- `app/manifest.json` (Next metadata route): `display: "standalone"`, `theme_color`,
  `background_color`, 192/512 icons **plus a `maskable` icon**
- `apple-touch-icon` at **180×180** and `<meta name="apple-mobile-web-app-capable" content="yes">` —
  iOS ignores the manifest icon and will render a blurry screenshot without these
- `viewport-fit=cover` + `env(safe-area-inset-*)` padding so text clears the notch and home indicator
- A small service worker caching the app shell and already-viewed illustrations, so an opened story
  still works with no signal
- Deploy to Vercel; send her the URL once with Add-to-Home-Screen instructions

---

## Build order

Sequenced so the risky, delightful part is proven first.

| Phase | Deliverable |
| --- | --- |
| **0** | Scaffold Next 16 + Tailwind 4. **One hardcoded story in a local JSON file + 5 images in `/public`.** Build `StoryReader` and get the scroll-driven cross-fade feeling right. No DB, no auth. |
| **1** | Prisma + Supabase. Move the story into Postgres; reader loads from DB. Seed script with the Phase 0 story. |
| **2** | NextAuth (two accounts), `Progress`, PWA manifest + icons + service worker. Installable on her iPhone. |
| **3** | Author UI + Supabase Storage upload. New stories without touching code. |
| **4** | Chapter cards, hearts, wake lock, font sizing. Optional later: recorded narration audio synced to beats. |

Phase 0 is the one that decides whether the whole idea feels magical — do not skip ahead of it.

---

## Verification

- **Phase 0, the important test:** `npm run dev`, open the dev server **on the actual phone** over
  the LAN (`http://<pc-ip>:3000`), and read a story aloud start to finish. Confirm: fades land on the
  right sentence, no blank frames, text stays legible over every illustration, no jump when Safari's
  toolbar hides. Desktop-only testing will not surface the `vh`/toolbar and safe-area problems.
- **Reader states:** first-open, resume-from-progress, last beat / story end, single-beat story,
  a very long beat and a two-word beat.
- **PWA install:** Safari → Add to Home Screen → confirm correct icon, no browser chrome on launch,
  safe-area padding correct, and an already-read story opens in Airplane Mode.
- **Auth:** `READER` account hitting `/author` redirects; `AUTHOR` reaches it.
- **Author round-trip:** create story → upload 3 images → publish → appears on her account without a
  reinstall.
- **Accessibility/motion:** enable *Reduce Motion* in iOS settings; Ken Burns stops, fades shorten,
  reading still works.
