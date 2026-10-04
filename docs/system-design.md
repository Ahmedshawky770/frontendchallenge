# System Design & Frontend Specification

> Course platform challenge — catalogue page → course player.
> Target runtime: **Next.js 16.3.8 (App Router) · React 19.2 · TypeScript 5 · Tailwind CSS v4**.

This document is written **before implementation** on purpose. It is the contract that every
module below is built against: folder boundaries, component interfaces, design tokens,
responsive rules, and the backend pipeline shape.

---

## 1. Scope

### 1.1 In scope

| Area | Requirement |
| --- | --- |
| Catalogue page (`/`) | ≥ 6 demo courses; image, title, instructor, status + progress %, Start/Resume CTA, navigates to the player |
| Player page (`/courses/[courseId]`) | Video stage, lesson meta, content list, current-lesson state, materials, progress, comments, leaderboard, popovers/overlays |
| Responsive | Desktop / Tablet / Mobile — three distinct layouts, no horizontal scroll, no overlap, no fixed sizes that break |
| Interactions | Select lesson, mark complete, toggle sidebar, immersive landscape player, open materials, post a comment, inspect a student's progress via avatar popover |
| Backend layer | Direct-to-object-storage upload pipeline (`202 Accepted`), async job queue + workers, CQRS commands/queries, cache-aside reads |
| Quality | Semantic HTML, alt text, AA contrast, keyboard operability, optimised images, small bundle, README, phased commits |

### 1.2 Out of scope

Authentication, real transcoding, a real Postgres/Valkey/S3 install, i18n routing, payments.
The backend layer is **contract-complete but adapter-swappable**: every external dependency sits
behind an interface with an in-process implementation, so the app runs with zero services but a
production deploy only swaps the adapters.

### 1.3 Reference design

The brief describes the target UI as a Figma file supplied as a flat image (deliberately, to test
UI reading). **No bitmap was present in the workspace**, so the visual system below is derived
from the written specification and encoded as explicit, measurable tokens in
[`design-tokens.md`](./design-tokens.md) rather than left to taste. Every spacing, radius,
colour and type step used by the UI resolves to a token in `app/globals.css`; no component
hard-codes a colour or an arbitrary pixel value.

---

## 2. Architectural principles

1. **No over-engineering.** One design system, one state container per page, one adapter per
   external dependency. Nothing is added until a requirement needs it.
2. **Loose coupling.** UI never imports from the data layer directly — it consumes typed
   read-model DTOs. The domain layer never imports React.
3. **camelCase identifiers** for every variable, function, field and CSS custom property.
   Files use `kebab-case` and directories use `kebab-case` — that is the React/Next ecosystem
   convention and is not a code-style identifier. No `snake_case` anywhere in code.
4. **UUIDv4 for every entity id.** Mock data ships *fixed* valid v4 strings (never generated at
   import time — that would break hydration and React `key` stability). Runtime-created entities
   (new comments, jobs, uploads) use `crypto.randomUUID()`.
5. **Heavy work leaves the request.** Nothing in an HTTP handler decodes video, resizes images
   or generates a thumbnail.
6. **Server by default.** Components are Server Components unless they need state, effects or
   browser APIs. Client boundaries are drawn at the smallest useful node.

---

## 3. Folder structure

```
frontendchallenge/
├── app/                                  # App Router — routing only, no business logic
│   ├── layout.tsx                        # <html>/<body>, fonts, metadata, skip link
│   ├── globals.css                       # Tailwind v4 entry + @theme design tokens
│   ├── page.tsx                          # "/" catalogue (Server Component)
│   ├── courses/[courseId]/
│   │   ├── page.tsx                      # player shell (Server Component, awaits params)
│   │   ├── loading.tsx                   # streamed skeleton
│   │   └── error.tsx                     # client error boundary (Next 16 `retry` prop)
│   └── api/                              # HTTP contract (route handlers)
│       ├── courses/route.ts
│       ├── courses/[courseId]/route.ts
│       ├── courses/[courseId]/comments/route.ts
│       ├── courses/[courseId]/progress/route.ts
│       ├── courses/[courseId]/leaderboard/route.ts
│       ├── uploads/route.ts              # 202 + pre-signed PUT URL
│       ├── uploads/complete/route.ts     # storage webhook → enqueue
│       └── uploads/[uploadId]/route.ts   # job status
├── src/
│   ├── components/
│   │   ├── ui/                           # design-system primitives (no domain knowledge)
│   │   ├── catalog/                      # catalogue page parts
│   │   └── player/                       # course player parts
│   ├── data/                             # mock fixtures (UUIDv4 ids, no logic)
│   ├── domain/                           # types + pure functions, zero framework imports
│   ├── hooks/                            # reusable client-side behaviour
│   ├── server/                           # server-only: cqrs, cache, queue, storage, repos
│   └── actions/                          # "use server" Server Action entry points
├── scripts/generateCourseArt.mjs         # sharp: build-time image pipeline
├── public/course-art/                    # generated WebP posters + LQIP blur data
└── docs/                                 # this document, design tokens, API contract
```

**Import rule (enforced by review):**

```
app/**  →  src/components/**  →  src/domain/**
                                    ↑
src/server/** ─────────────────────┘   (server-only, imports domain + data, never components)
```

`src/domain` imports nothing from `src/components`, `src/server`, `app`, React or Next.
That is what makes it unit-testable and keeps the read model portable.

---

## 4. Domain model

```ts
type Uuid = string;              // RFC 4122 v4
type IsoDateTime = string;       // "2026-03-04T10:12:00.000Z"

interface Course {
  id: Uuid;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: CourseCategory;
  level: "beginner" | "intermediate" | "advanced";
  instructor: Instructor;
  posterUrl: string;
  posterBlurDataUrl: string;
  accentColor: string;
  rating: number;
  ratingCount: number;
  enrolledCount: number;
  totalDurationSeconds: number;
  updatedAt: IsoDateTime;
  sections: CourseSection[];
  materials: CourseMaterial[];
}

interface CourseSection {
  id: Uuid;
  courseId: Uuid;
  title: string;
  lessons: Lesson[];
}

interface Lesson {
  id: Uuid;
  sectionId: Uuid;
  courseId: Uuid;
  index: number;              // 1-based, stable ordering
  title: string;
  kind: "video" | "reading" | "quiz";
  durationSeconds: number;
  isPreview: boolean;
  summary: string;
  resources: LessonResource[];
}

interface LessonResource {
  id: Uuid;
  lessonId: Uuid;
  title: string;
  fileType: "pdf" | "zip" | "link" | "sheet";
  sizeBytes: number;
  url: string;
}

interface CourseMaterial {
  id: Uuid;
  courseId: Uuid;
  title: string;
  description: string;
  fileType: "pdf" | "zip" | "sheet" | "link";
  sizeBytes: number | null;   // null = external link, no size
  pages: number | null;       // pdf/sheet only
  url: string;
}

interface EnrollmentProgress {
  courseId: Uuid;
  completedLessonIds: Uuid[];
  lastLessonId: Uuid | null;
  updatedAt: IsoDateTime;
}

interface CourseComment {
  id: Uuid;
  courseId: Uuid;
  lessonId: Uuid | null;
  author: Instructor | ViewerProfile;
  body: string;
  createdAt: IsoDateTime;
  helpfulCount: number;
  viewerHasMarkedHelpful: boolean;
}

interface LeaderboardEntry {
  rank: number;
  student: ViewerProfile;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  streakDays: number;
}

interface ViewerProfile {
  id: Uuid;
  name: string;
  avatarUrl: string;
  role: "instructor" | "student";
  headline: string;
}
```

### 4.1 Progress maths (pure, `src/domain/progress.ts`)

```
totalLessons       = sum(section.lessons.length)
completedLessons   = |{ lessonId ∈ completedLessonIds : lessonId ∈ course }|   // set, deduped
progressPercent    = totalLessons === 0 ? 0 : round(completedLessons / totalLessons * 100)
courseDuration     = sum(lesson.durationSeconds)                              // header + card
status             = completed === 0        → "not-started"
                    completed === total     → "completed"
                    otherwise               → "in-progress"
```

Progress is derived, never stored twice. A `Set` membership test keeps the maths O(n).

---

## 5. Design tokens

Full table in [`design-tokens.md`](./design-tokens.md). Summary of the contract:

- **Type scale** — 12 / 13 / 14 / 16 / 18 / 20 / 24 / 30 / 36 px, one family (Inter), tabular
  numerals for all metrics.
- **Spacing** — 4 px base grid, only steps `1 2 3 4 6 8 12 16 24 32` (4 → 128 px).
- **Radii** — 6 / 8 / 12 / 16 / 999 px.
- **Colour** — one neutral ramp (50…900), one brand ramp (50…700), plus `success`, `warning`,
  `danger`, `info`. Every text/background pair used in the UI is listed in the tokens doc with
  its measured contrast ratio.
- **Elevation** — four shadows (`xs`, `sm`, `md`, `lg`), all low-alpha neutral.
- **Motion** — 150 ms (micro) / 220 ms (layout) / 320 ms (overlay) `cubic-bezier(.2,.8,.2,1)`;
  every animation is disabled under `prefers-reduced-motion: reduce`.

Implementation: Tailwind v4 CSS-first `@theme` in `app/globals.css`. No `tailwind.config.js`.

---

## 6. Frontend architecture

### 6.1 Server / Client split

| Route | Rendering | Client islands |
| --- | --- | --- |
| `/` | Server Component, static | `catalogFilters` (search + category chips), `courseCardActions` (resume-aware CTA) |
| `/courses/[courseId]` | Server Component shell (`generateStaticParams` + `notFound()`) | one island: `coursePlayer` |

The player page is a single client island **by design**: the video stage, the lesson list, the
progress ring, the sidebar toggle and the tab strip form one interaction loop that must stay
consistent — splitting it across islands would either duplicate state or add waterfalls. Inside
the island, state is one reducer; each panel is a plain function of that state.

Everything expensive stays on the server: the course read model, the comment list and the
leaderboard are fetched during the server render and handed over as serialisable props.

### 6.2 Player state machine (`src/components/player/playerReducer.ts`)

One reducer, explicit actions, no `useEffect` state derivation.

```ts
type PlayerAction =
  | { type: "selectLesson"; lessonId: Uuid }
  | { type: "toggleLessonComplete"; lessonId: Uuid }
  | { type: "nextLesson" } | { type: "previousLesson" }
  | { type: "setActiveTab"; tab: PlayerTab }
  | { type: "toggleSidebar"; collapsedBy: "user" | "viewport" }
  | { type: "setSectionExpanded"; sectionId: Uuid; expanded: boolean }
  | { type: "toggleMaterials"; materialId: Uuid | null }
  | { type: "addComment"; comment: CourseComment }
  | { type: "enterImmersive" } | { type: "exitImmersive" }
  | { type: "openStudentCard"; studentId: Uuid } | { type: "closeStudentCard" };
```

Derived during render, never stored: `currentLesson`, `nextLesson`, `previousLesson`,
`progressPercent`, `courseStatus`. Deriving in the selector layer means a state change can never
leave the UI showing a stale percentage.

`?lesson=<uuid>` seeds the initial lesson (server reads `searchParams` and passes it down), and
selection is mirrored into the address bar with `history.replaceState` so a lesson is
shareable/bookmarkable without triggering a router navigation.

### 6.3 Responsive strategy — three layouts, not two

| Breakpoint | Layout |
| --- | --- |
| ≥ 1280 px (desktop) | 12-col grid. Video + lesson column (`minmax(0,1fr)`) and a fixed 380 px sidebar. Sidebar collapse animates `380px → 0px`, video expands to full width. |
| 768–1279 px (tablet) | Single column. Sidebar content moves *below* the lesson column and renders inline (no drawer), video stays 16:9. |
| < 768 px (mobile) | Video becomes `position: sticky; top: 0` below the 56 px app bar, full-bleed width, `z-index` above content. Content list moves into a bottom sheet. A sticky bottom bar exposes prev / next / list. |

Rules that prevent breakage:

- Every grid track is `minmax(0, 1fr)` so a long title can never force horizontal scroll.
- Every text block is `min-w-0` + `truncate` / `line-clamp-2`.
- `overflow-x: clip` on `body` is a **safety net**, not the fix — the layout is fluid first.
- All tap targets ≥ 44 × 44 px on mobile (`--tapTarget` token).
- Layout is driven by CSS (grid + container queries) not by JS width sniffing; JS only toggles
  state (e.g. "user collapsed the sidebar"), never *decides* the layout.

### 6.4 Immersive / landscape mode (mobile "fullscreen")

Three cooperating mechanisms, each with an explicit fallback:

1. **Fullscreen** — `requestFullscreen()` on the stage element (iOS Safari uses
   `webkitRequestFullscreen`; feature-detected).
2. **Orientation lock** — `screen.orientation.lock("landscape")` inside the fullscreen promise
   chain. Supported on Android Chrome/Edge; **not supported on iOS Safari** — the `try/catch`
   degrades to fullscreen-only and the CSS landscape media query still applies if the user
   rotates manually.
3. **CSS landscape layout** — `@media (orientation: landscape) and (max-height: 560px)` collapses
   the meta strip and enlarges controls so the video dominates a short viewport.

Escape always exits: `fullscreenchange`, `orientationchange`, and the explicit close button all
call `exitImmersive`.

### 6.5 Component inventory

**Primitives (`src/components/ui/`)** — `button`, `iconButton`, `badge`, `card`, `progressBar`,
`progressRing`, `avatar`, `tooltip`, `modal`, `bottomSheet`, `tabs`, `segmentedControl`,
`skeleton`, `icon` (inline SVG sprite, no icon dependency), `visuallyHidden`, `spinner`.

**Catalogue (`src/components/catalog/`)** — `catalogPage`, `catalogToolbar`,
`categoryFilterChips`, `courseGrid`, `courseCard`, `courseCardProgress`, `statusPill`,
`emptyCatalogState`.

**Player (`src/components/player/`)** — `coursePlayer` (island root), `videoStage`,
`videoControls`, `videoPlaylist`, `lessonHeader`, `playerTabs`, `contentSidebar`,
`sectionAccordion`, `lessonRow`, `materialsPanel`, `materialRow`, `commentsPanel`,
`commentComposer`, `commentCard`, `leaderboardPanel`, `studentProgressCard` (popover),
`mobileLessonSheet`, `playerBottomBar`, `courseProgressSummary`.

Every leaf component is ≤ ~120 lines, takes explicit typed props, and has no internal data
fetching.

### 6.6 Popups / overlay states (explicitly required by the brief)

| # | State | Trigger | Behaviour |
| --- | --- | --- | --- |
| 1 | Student progress popover | Click / `Enter` on a leaderboard avatar | Anchored card: avatar, name, streak, progress bar, completed-lesson count. Dismiss on `Esc`, outside click, or route change. `role="dialog"`, focus moved in and restored. |
| 2 | Material preview modal | Click a material row | `role="dialog"`, focus trapped, `Esc` closes, PDF shown as an embedded preview panel with size/type metadata and a download action. |
| 3 | Lesson list bottom sheet | Mobile sticky-bar "list" button | Snap-point sheet, drag handle, `aria-modal`, body scroll locked. |
| 4 | Sidebar collapse state | Desktop toggle | Sidebar → 0, video → full width, button `aria-expanded` flips, state survives resize. |
| 5 | Immersive video overlay | Fullscreen / rotate control | Stage fills viewport, controls auto-hide after 2.5 s idle, reappear on pointer move. |
| 6 | Toast | Mark lesson complete / comment posted | `aria-live="polite"`, auto-dismiss 3 s, respects reduced motion. |
| 7 | Empty + skeleton states | Slow data, no comments | Skeletons on route load; a designed empty state (icon + copy) when a lesson has no comments. |

---

## 7. Backend layer

### 7.1 Why route handlers *and* Server Actions

| Surface | Used by | Reason |
| --- | --- | --- |
| Server Components → query handlers | first paint of `/` and the player | zero client waterfall, no HTTP hop |
| Server Actions → command handlers | comments, progress toggles | progressive enhancement, single round-trip, `useActionState` pending/validation built in |
| `app/api/*` route handlers | external consumers **and** the upload pipeline | the browser `PUT`s bytes straight to object storage; a webhook must be a public HTTP endpoint |

All three converge on the same command/query handlers, so behaviour cannot drift between them.

### 7.2 Media upload pipeline (asynchronous, request-safe)

```
 client                 app server (thin)              object storage        worker
   │  POST /api/uploads ─────────────────►  sign PUT URL (HMAC, 15 min TTL)
   │  ◄─── 202 Accepted { uploadId, uploadUrl, statusUrl }
   │
   │  PUT <uploadUrl> ─────────────────────────────────►  raw bytes never
   │                                                     touch the Node app
   │  POST /api/uploads/complete ───────►  verify signature + size + type
   │  ◄─── 202 Accepted { jobId }          enqueue(media.process)
   │                                               └──► dequeue (concurrency 2)
   │                                                          transcode / resize /
   │                                                          thumbnail → store
   │  GET /api/uploads/:id (poll) ◄──────────────────────────── write asset row
   │  ◄─── 200 { status, derivedWidths, posterUrl }
```

Non-negotiables implemented:

- **`202 Accepted`**, never `201`, on both the sign and the complete step — the resource is
  *queued*, not created.
- **No request handler ever touches file bytes.** The app only signs and verifies.
- **Bounded concurrency** in the worker pool (default 2) — this is the "protect CPU/memory"
  requirement; an unbounded `for` loop over jobs is the failure mode being avoided.
- **Idempotency**: re-posting `complete` for the same `uploadId` returns the existing job
  instead of enqueuing a duplicate.
- **UUIDv4** `uploadId` and `jobId`.
- Production swap points are named: `objectStorage`, `mediaQueue`, `mediaRepository`.
  BullMQ + Valkey + S3/R2 drop in behind those three interfaces.

### 7.3 CQRS

```
src/server/
├── cqrs/
│   ├── commands/     createComment · toggleLessonProgress · issueUploadUrl · confirmUpload
│   └── queries/      listCourses · getCourseDetail · getLessonComments · getCourseProgress · getLeaderboard
├── cache/            cacheAside (lazy load + TTL + stampede guard) · memoryStore · valkeyStore
├── queue/            mediaQueue interface · memoryMediaQueue
├── storage/          objectStorage interface · signedUrlSigner · localObjectStorage
└── repositories/     courseRepository · commentRepository · progressRepository · assetRepository
```

- **Command handlers** validate input, mutate through a repository, invalidate the affected
  cache tags, and return a serialisable result. They never read for rendering.
- **Query handlers** are read-only, DTO-returning, and *always* go through `cacheAside`.

### 7.4 Cache-aside (lazy loading)

```
read(key)          → hit  : return value
                   → miss : load() → store(key, value, ttl) → return value
invalidate(prefix) → drop matching keys on every write in the same bounded scope
```

- TTLs: course detail 300 s, catalogue list 120 s, leaderboard 30 s (shortest, most volatile).
- **Stampede guard**: concurrent misses for the same key share one in-flight promise instead of
  N simultaneous loads.
- Stores are swappable; the in-process store is a TTL + size-bounded LRU so a long-running dev
  server cannot grow without limit.

### 7.5 Security notes

- Pre-signed URLs are HMAC-signed and expire; the complete-step re-verifies the signature rather
  than trusting the client.
- Object keys are UUID-based, never user-supplied strings → no path traversal.
- Server-only modules import `server-only`, so an accidental client import fails at build.
- Command handlers treat every argument as untrusted and validate before persisting.

---

## 8. Naming conventions

| Thing | Convention | Example |
| --- | --- | --- |
| variables, functions, fields, methods | camelCase | `completedLessonIds`, `formatDuration` |
| React components | PascalCase | `ContentSidebar`, `ProgressRing` |
| hooks | camelCase + `use` | `useLocalProgress`, `useMediaQuery` |
| files & folders | kebab-case (ecosystem convention) | `course-player.tsx`, `src/components/player/` |
| CSS custom properties | camelCase inside `--` | `--color-brand-600`, `--radius-card` |
| types / interfaces | PascalCase | `CourseSection`, `PlayerAction` |
| constants | camelCase | `defaultLessonTab` |
| API paths | kebab-case segments | `/api/uploads/complete` |

`snake_case` is not used anywhere in code.

---

## 9. Performance budget

| Metric | Target | How |
| --- | --- | --- |
| Client JS | < 130 kB gzip for the player route | one client island, zero runtime deps, inline SVG icons instead of an icon package |
| Fonts | 1 family, subset, self-hosted | `next/font/google` Inter, `display: "swap"`, only the weights used |
| Images | WebP, explicit `sizes`, LQIP blur | generated once by `scripts/generateCourseArt.mjs` via `sharp`; served through `next/image` |
| Above-the-fold art | preloaded, everything else lazy | `preload` on the player poster (note: Next 16 deprecated `priority`), default `loading="lazy"` elsewhere |
| Network | no request waterfall on first paint | Server Components resolve data during render |
| Layout stability | CLS ≈ 0 | every media box has an intrinsic aspect ratio reserved via `aspect-ratio` |

## 10. Accessibility contract

- Landmarks: `header` (app bar) → `main` → `aside` (course content) → `footer`.
- Skip-to-content link as the first focusable element.
- Video: labelled region, keyboard-operable custom control bar, focus visible on every control.
- Lesson list is a real list; the current item uses `aria-current="true"`.
- Collapse/expand controls expose `aria-expanded` + `aria-controls`; dialogs are `role="dialog"`
  with a focus trap and focus restoration.
- Progress changes are announced through an `aria-live="polite"` region.
- All interactive targets ≥ 44 × 44 px on mobile; text contrast ≥ 4.5:1, large text ≥ 3:1.
- `prefers-reduced-motion` disables transitions and the video auto-hide timer.
- Every `<Image>` has meaningful `alt`; decorative images use `alt=""`.

## 11. Git strategy (phased commits)

| # | Commit | Contents |
| --- | --- | --- |
| 1 | `chore: bootstrap next 16 app router project` | scaffold |
| 2 | `docs: add system design, design tokens and api contract` | this document set |
| 3 | `feat: add design tokens, domain model and uuidv4 mock data` | `globals.css`, `src/domain`, `src/data` |
| 4 | `feat: add ui primitives and generated course artwork` | `src/components/ui`, art pipeline |
| 5 | `feat: add course catalogue page` | `/` + `src/components/catalog` |
| 6 | `feat: add course player shell, video stage and lesson navigation` | player core |
| 7 | `feat: add materials, comments, leaderboard and popover states` | player panels |
| 8 | `feat: add cqrs server layer, upload pipeline and cache-aside reads` | `src/server`, `app/api` |
| 9 | `perf: optimise imagery, fonts and bundle` | image/font/bundle work |
| 10 | `test: verify lint, types, production build and responsive layout` | verification |
| 11 | `docs: write readme with architecture decisions` | README |

## 12. Verification checklist

- [ ] `npm run lint` — clean
- [ ] `npx tsc --noEmit` — clean
- [ ] `npm run build` — succeeds (Turbopack)
- [ ] No horizontal scrollbar at 320 / 375 / 768 / 1024 / 1440 px
- [ ] Lesson selection, completion, sidebar toggle, immersive mode, comment posting verified
- [ ] Keyboard-only pass over every interactive element
- [ ] Long titles / 60-lesson course do not break the layout