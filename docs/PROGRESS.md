# Progress

Session log for Storytell. Read this at the start of every session.
Full spec lives in [PLAN.md](./PLAN.md).

## Current phase

**Phase 0** — scroll-driven reader with a hardcoded story (no DB, no auth)

## Done

- Repo initialised (`git init`, branch `main`)
- Project docs created: `CLAUDE.md`, `docs/PLAN.md`, `docs/PROGRESS.md`

## Next up

1. Scaffold Next.js 15 + Tailwind CSS v4 (JavaScript, App Router, `jsconfig.json`)
2. Drop 5 placeholder illustrations into `public/stories/demo/`
3. Write `lib/demo-story.js` — one hardcoded story, ~5 beats across 2 chapters
4. Build `components/reader/StoryReader.jsx` — the three-layer scrollytelling engine
5. Test it **on the actual phone** over the LAN before going any further

## Decisions made

- **2026-08-29** — PWA (Next.js) over Expo / React Native. She's on iPhone; a standalone iOS
  build needs a $99/yr Apple Developer account and TestFlight builds expire every 90 days.
  Add to Home Screen gets ~95% of the experience for $0, and reuses the existing Next stack.
- **2026-08-29** — Scroll-driven advance via `IntersectionObserver`, not tap-to-advance and not
  scroll-offset math. Self-corrects for variable text length and font size.
- **2026-08-29** — Cross-fades in plain CSS transitions; no animation library.
- **2026-08-29** — Docs split three ways (`CLAUDE.md` = conventions, `docs/PLAN.md` = spec,
  `docs/PROGRESS.md` = session log) so `CLAUDE.md` stays small and doesn't rot.

## Open questions / blockers

- Story content itself — needs writing (the app is the easy half)
- AI image generation tool not yet chosen; whichever one, lock a single `stylePrompt` per story
  so illustrations don't drift in style between beats

---

### End-of-session ritual

Update **Done** / **Next up**, append anything decided to **Decisions made**, then commit.

### Start-of-session ritual

Say: *"read docs/PROGRESS.md and continue"*
