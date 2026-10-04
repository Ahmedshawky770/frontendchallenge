# Course Platform — catalogue → course player

A working Next.js course platform: a catalogue page that filters and searches, and a course
player that plays lessons, tracks progress, shows materials, comments and a leaderboard.

Built against [`docs/system-design.md`](docs/system-design.md), which was written **before**
the implementation and is the contract every module below follows.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint       # eslint, must be clean
npx tsc --noEmit   # types, must be clean
```

No environment variables, no external services. `node scripts/generateCourseArt.mjs` regenerates
the artwork if you change the palette.

| Route | What it is |
| --- | --- |
| `/` | Catalogue — six courses, search, category chips, status filter, progress, resume banner |
| `/courses/[courseId]` | Player — video stage, lesson list, materials, comments, leaderboard, popovers |
| `/api/…` | Ten route handlers: catalogue, course detail, comments, progress, leaderboard, uploads |

`[courseId]` accepts either the course UUID or the slug, so `/courses/cloud-security-hardening`
and `/courses/3f1c…` both work.

---

## Architecture decisions

### Folder structure

```
app/                       routing only — no business logic
  (catalog)/               route group: page + loading skeleton for "/"
  courses/[courseId]/      player shell, error boundary, not-found
  api/                     HTTP contract: parse, delegate, map outcome
src/
  domain/                  types + pure functions. zero framework imports
  data/                    mock fixtures (UUIDv4 ids, no logic)
  server/                  server-only: cqrs, cache, queue, storage, repositories
  components/ui/           design-system primitives, no domain knowledge
  components/catalog/      catalogue page parts
  components/player/       course player parts
  hooks/                   reusable client behaviour
scripts/                   artwork pipeline
docs/                      system design, design tokens, api contract
```

The dependency rule is one-directional and points inward: `app → components → domain`, with
`server` and `data` as leaves that nothing in `components/ui` may import. A primitive that knows
about a `Course` is not a primitive.

`src/domain` imports nothing from React, Next, or the server layer. That is what lets the same
pure functions compute a progress percentage during a server render, inside a reducer, and in a
route handler without a branch.

### Server and Client Components

| Route | Rendering | Client JS |
| --- | --- | --- |
| `/` | Server Component, per request (reads `searchParams`) | one island: `catalogFilters` |
| `/courses/[courseId]` | Server Component shell, per request (reads `?lesson=`) | one island: `coursePlayer` |

**The player is one island by design.** The video stage, lesson list, progress ring, sidebar
toggle and tab strip are a single interaction loop: selecting a lesson has to update the stage,
the active row, the prev/next buttons, the progress percentage and the URL together. Split
across islands that either duplicates state or adds render waterfalls. Inside the island, state
is one reducer (`playerReducer.ts`) and every panel is a pure function of it.

**The catalogue is almost entirely server-rendered.** Filter state lives in the URL, so the
server renders the filtered grid — a filtered catalogue is shareable, bookmarkable and correct
before hydration. The grid, the cards, the chips and the resume banner ship zero JavaScript;
only `catalogFilters` is a client component, and its entire job is moving the user between URLs.

Two deliberate departures from `docs/system-design.md`:

- **The resume CTA is a `Link`, not the `courseCardActions` island the spec listed.** Navigation
  already is client behaviour that `next/link` handles and prefetches; an island would hydrate a
  component to compute a label the server has already computed.
- **The site header is scoped to the catalogue route, not the root layout.** The player is a
  focused single-task surface with its own breadcrumb and a sticky video column; a persistent
  header above it eats vertical space the video needs. One shell per route also keeps the
  player's `--app-bar-height` describing something that is actually on screen — an earlier
  version of the sidebar stuck itself `--app-bar-height` below the viewport top and floated a
  full bar lower than the video column beside it.

Data that crosses the server/client boundary is a serialisable read model, not a live entity:
`CourseDetail` carries the course, flattened lessons, progress and metrics, so the island does
not recompute anything the server already knew.

### Images and performance

All artwork is **generated**, not downloaded, by `scripts/generateCourseArt.mjs`:

- every asset lands at exactly the dimensions the UI reserves, so nothing is fetched twice and
  nothing shifts while images decode;
- output is WebP (`quality 72`), ~15 kB per poster and ~1 kB per avatar;
- a 24 px LQIP is inlined as a base64 `blurDataURL`, so first paint is never blocked on an
  image request;
- each course gets **two** poster variants. The catalogue thumbnail carries the course title and
  a category/level kicker, because a thumbnail is what a learner scans for in a grid. The player
  gets a text-free `-stage` variant, because the stage overlays its own lesson title, play button
  and control bar on the lower third — reusing the thumbnail there put a title underneath the
  controls.

Every image goes through `next/image` with a real `sizes` value, so the browser picks from
`srcset` instead of downloading a 1280 px file for a 96 px avatar. `placeholder="blur"` prevents
layout shift, and `preload` (Next 16's replacement for the deprecated `priority`) is set on the
catalogue's LCP image and the player stage only.

Measured on a production build (`next build && next start`), transfer sizes gzipped:

| | catalogue `/` | player `/courses/[id]` |
| --- | --- | --- |
| HTML | 16.9 kB | 16.8 kB |
| CSS | 9.6 kB | 9.6 kB |
| JS | 184 kB | 210 kB |

The JS is dominated by the React 19 + Next runtime baseline: seven chunks are shared between the
two routes, and the catalogue's own application code is roughly 20 kB of that 184 kB. There is
no icon package — the ~40 glyphs the player needs are an inline SVG registry
(`components/ui/icon.tsx`), because a dependency for 40 paths costs more bundle than the rest of
the client island put together. There is no state library, no date library and no CSS-in-JS;
the runtime dependencies are `next`, `react` and `react-dom`.

Fonts are self-hosted through `next/font`, which downloads them at build time and emits a
`font-display: swap` `@font-face` with a preloaded subset — no render-blocking request to a third
party, and no layout shift when the face swaps.

### Responsive strategy

Three layouts, not two, and all of them are CSS:

| Breakpoint | Layout |
| --- | --- |
| ≥ 1280 px | 12-column grid: video column `minmax(0,1fr)` + 380 px sidebar. Collapsing the sidebar animates the column wider; the stage keeps its reserved 16:9 box. |
| 768–1279 px | Single column, sidebar content inline below the lesson column, no drawer. |
| < 768 px | Stage is `sticky top-0`, full-bleed; the content list becomes a bottom sheet; a sticky bottom bar exposes prev / next / list. |

Rules that keep it from breaking:

- every grid track is `minmax(0, 1fr)`, so a long unbroken title shrinks its column instead of
  forcing horizontal scroll;
- every text block is `min-w-0` with `truncate` / `line-clamp-*`;
- tap targets are ≥ 44 px on mobile (`--tapTarget`);
- layout is CSS grid and media queries, never a JS width check. `useMediaQuery` exists only for
  behaviour CSS cannot express (disabling the control auto-hide timer, closing the sheet when the
  viewport grows), so a slow hydration cannot produce a broken first paint;
- `overflow-x: clip` on `body` is a safety net, not the fix.

Verified with headless Firefox at 390 px, 834 px and 1440 px against a production build.

### State and data flow

**Read side (CQRS queries).** Query handlers are read-only, return serialisable DTOs, and are the
only callers of `cacheAside`. `listCourses` returns the filtered grid, per-category counts, the
unfiltered total and the resume candidate in one call, because three of those are derived from the
same unfiltered read — aggregating in the handler rather than the page means one handler, one
cache contract, and no chance of the components disagreeing about what "6 courses" means.

**Write side (CQRS commands).** Commands validate their input and return a typed
`CommandResult`. Route handlers never contain business logic; the error envelope and the
error-code-to-status mapping live in one shared adapter so no endpoint invents its own status for
the same failure.

**Caching.** Cache-aside with TTLs (course detail 300 s, catalogue 120 s, leaderboard 30 s) over
a TTL + size-bounded in-memory store, with an in-flight promise per key so concurrent misses for
the same key share one load instead of N. Writes invalidate by prefix in the same bounded scope.

Filter values are **allow-listed** (`parseCatalogFilter`) before they reach a cache key. Filter
values come from the URL and keys are built from them, so passing raw strings through would let a
caller mint one cache entry per invented `?q=` — turning a shared cache into a memory-exhaustion
vector.

**Progress is always derived, never stored twice.** `computeMetrics` is a pure function of the
completed-lesson set; the percentage, the status and the resume target are all recomputed during
render, so a state change cannot leave the UI showing a stale number.

### Design system

Tokens live in `app/globals.css` under Tailwind v4's `@theme`, so they are available as
first-class utilities (`text-text-secondary`, `rounded-control`, `max-w-shell`). The scale is
deliberately shallow — 41 colours across 11 role families, 10 type sizes, 10 radii, 4 shadows —
because a token system earns its keep by being too small to be wrong. Note that colours are named
by **role**, not by hue (`--color-danger`, `--color-text-tertiary`), which is what lets the dark
player stage and the light catalogue share one vocabulary. Full reference in
[`docs/design-tokens.md`](docs/design-tokens.md).

Status is never carried by colour alone: every status badge pairs a hue with an icon and a word.
Progress is exposed as `role="progressbar"` with `aria-valuenow`.

### Accessibility

- Semantic landmarks throughout: one `h1` per page, `<article>` per course, `<nav>`,
  `<main>`, `<aside>`, `<dl>` for stat pairs, `<footer>`.
- The tab strip follows the ARIA authoring practices — only the active tab is in the tab order,
  arrow keys move between them, and panels carry `aria-labelledby` back to the strip.
- `Modal` moves focus in, traps it, closes on Escape and backdrop, locks background scroll, and
  returns focus to the trigger.
- The student-progress popover anchors to the focused control, which is correct whether it was
  opened by mouse or by keyboard.
- Alt text is on every image. Decorative artwork (a card thumbnail whose meaning is carried by the
  adjacent title) is `alt=""` with `aria-hidden`, and the meaningful avatar names its person.
- Every icon-only control has an accessible name; icon glyphs are `aria-hidden` by default.
- `prefers-reduced-motion` disables the control auto-hide timer and the transitions.

---

## Bugs found and fixed during verification

Static review found the first three. The rest were found only by driving a real browser — they are
invisible to `tsc`, to `eslint`, and to reading the server-rendered HTML, because each one is a
question about whether a click lands where the user aimed.

1. **The entire course content list was unclickable on desktop.** The sidebar doubles as a mobile
   bottom sheet, and the rule that hides a closed sheet — `pointer-events-none` — was written
   unprefixed, so it also applied at `lg`, where the same element is a plain grid column.
   `pointer-events` inherits, so every section header and every lesson row inherited it. The
   sidebar rendered, looked correct, and responded to nothing. Fixed with `max-lg:`, which also
   keeps the rule from colliding with the separate `lg:` rule that hides a *deliberately collapsed*
   sidebar.
2. **The progress popover rendered off-screen.** It was centred on its trigger with
   `translateX(-50%)`, so a 288 px card on a 32 px avatar near the left edge put 130 px of itself
   outside the viewport, and one opened near the bottom overflowed the other way. Placement is now
   resolved where both boxes are known — it flips above the trigger when there is no room below,
   and clamps horizontally to the viewport.
3. **Arrow keys did not move between tabs.** The tablist changed the selection, but React does not
   move DOM focus when an element's `tabIndex` flips to `-1`, so the focus ring stayed behind and
   the next arrow press computed from the wrong index.
4. **The mobile video stage was not full-bleed.** It sat inside the page's 12 px gutter. A negative
   margin alone was not enough, because `w-full` pins the used width and the stage would overhang
   only on the left; the width now comes from the flex parent, so the negative margin widens it
   evenly.
5. **The tab strip scrolled the whole page sideways on a phone.** Four tabs do not fit 390 px and
   the underline variant had no scroll container. It had been invisible because an ancestor's
   `overflow-hidden` clipped it — the same ancestor that caused bug 1.
6. **Touch targets in the video control bar were 36 px**, below the documented 44 px
   (`--tap-target`). They are now 44 px on phones and stay 36 px from `sm`, which fits because the
   lesson title in the control bar is already hidden below `lg`.
7. **Every button showed the default cursor.** Tailwind's preflight does not set one, so the whole
   player read as inert until hover.
8. **`screen.orientation` was read during render** in `useImmersiveMode`. Client components still
   render on the server and `screen` does not exist there. Now resolved inside the callbacks that
   need it.
9. **Lesson numbers disagreed with themselves.** `Lesson.index` was built per-section while its
   own type comment said course-wide, so the video badge said "Lesson 4" directly above a header
   saying "Lesson 12 / 21". Now course-wide.
10. **The control bar never auto-hid.** `videoStage` re-armed its idle timer from an effect
    watching `transport.currentTime`, which ticks four times a second while playing — so the timer
    was reset forever. It now re-arms from pointer activity only; scrubbing raises pointer events
    that bubble to the stage, so a seek reveals the controls for free.
11. **The catalogue claimed a sort order it did not apply** ("Sorted by most recently updated" over
    fixture order). Sorting now happens in the repository, so the statement is true for the page
    and the route handler alike.
12. **"Clear filters" reloaded the page instead of clearing.** `toSearchParams` returns `""` when
    every filter is at its default, and an `href=""` resolves to the current URL. The prefix now
    lives in one helper, `catalogHref`, so no call site can forget it.
13. **Unknown course slugs returned HTTP 200.** A root-level `loading.tsx` wraps every route in a
    Suspense boundary, and `notFound()` thrown after streaming starts can only produce a soft 404.
    Moving the catalogue's skeleton into a `(catalog)` route group scopes the boundary and restores
    a real `404`.

### How they were verified

- `npm run lint` and `npx tsc --noEmit` are clean.
- `npm run build` succeeds; every route prerenders or renders on demand as declared.
- 30 interaction checks driven with a real browser (Chromium via Playwright) against the production
  server: catalogue filtering, search, empty state and clear-filters; lesson selection, marking
  complete, progress updates, prev/next, playback, the leaderboard popover, the material preview
  modal, posting a comment, and sidebar collapse on desktop; then on a 390 px viewport, no
  horizontal scroll, a full-bleed sticky stage, 44 px tap targets, the bottom-bar content sheet,
  and arrow-key tab navigation. Zero console errors on both routes.
- Layout checked visually with headless Firefox at 390 px, 834 px and 1440 px.

---

## Known trade-offs

- **`?lesson=` makes the player dynamic.** It reads `searchParams`, so the route renders per
  request instead of being prerendered from `generateStaticParams`. A static route would give a
  hard 404 for unknown slugs *and* a faster TTFB; the deep link is worth the trade here, and the
  cache-aside read keeps the render to a map lookup.
- **No `loading.tsx` on the player.** That is what buys the hard 404 above. The player reads
  in-memory fixtures with no I/O wait, so a skeleton would guard a latency this app does not have.
  A real deployment with a database should add one back and move the existence check into
  `proxy.ts`.
- **Progress is in-memory.** It resets when the server restarts, which the footer says. A real
  deployment writes through the command handlers to Postgres; nothing above the repository layer
  would change.
- **No real video.** The challenge ships no media assets and no encoder, so rather than render a
  dead `<video>` tag, `useVideoTransport` owns the state a real element would (status, time,
  duration, volume, rate, seek) and a timer advances it. Every caller already speaks in those
  terms, so swapping in a real stream replaces the body of that one hook.
- **The in-memory cache is per-process.** Correct for one instance; a multi-instance deployment
  wants Valkey or Redis behind the same `cacheAside` interface, which is why the store is behind
  that seam.

## Commit history

Each commit is a working stage, in the order the work happened:

```
chore: bootstrap next 16 app router project
docs: add system design, design tokens and api contract
feat: add design tokens, domain model, uuidv4 mock data and ui primitives
feat: add readable generated artwork and correct lesson numbering
feat: add course player shell, video stage and lesson navigation
feat: add cqrs server layer, upload pipeline and cache-aside reads
feat: add course catalogue page
fix: repair interaction, responsive and accessibility defects found in review
docs: add readme with architecture decisions and verification notes
```