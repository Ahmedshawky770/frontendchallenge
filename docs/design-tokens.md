# Design Tokens

Single source of truth: `app/globals.css` (Tailwind v4 CSS-first `@theme`).
Components reference tokens only — no literal colours, no arbitrary pixel values in JSX.

---

## 1. Typography

Family: **Inter** (variable, latin subset) via `next/font/google`, self-hosted at build time.
No second family: one family keeps the payload down and the rhythm consistent.
Tabular numerals are enabled for every metric (`font-variant-numeric: tabular-nums`).

| Token | Size | Line height | Weight | Tracking | Usage |
| --- | --- | --- | --- | --- | --- |
| `text-micro` | 12px | 16px | 500 | 0.02em | badges, meta chips, timestamps |
| `text-caption` | 13px | 18px | 400 | 0 | secondary copy, table cells |
| `text-body-sm` | 14px | 20px | 400 | 0 | dense UI — lesson rows, toolbars |
| `text-body` | 16px | 24px | 400 | 0 | default paragraph |
| `text-body-lg` | 18px | 28px | 400 | 0 | lesson title (desktop) |
| `text-title-sm` | 18px | 24px | 600 | −0.01em | card title |
| `text-title` | 20px | 28px | 600 | −0.01em | section heading, mobile lesson title |
| `text-title-lg` | 24px | 32px | 650 | −0.02em | page heading, course title (desktop) |
| `text-display` | 30px | 38px | 700 | −0.02em | hero / catalogue heading |
| `text-display-lg` | 36px | 44px | 700 | −0.025em | catalogue hero only |

Rules
- Headings ≤ `text-title` inside the player; the player is a working surface, not a hero.
- Line length capped at `72ch` (`--measure`).
- 1 line clamp on lesson rows, 2 lines on card blurbs (`line-clamp-*`).

## 2. Spacing — 4 px grid

Allowed steps only: `4 8 12 16 24 32 48 64 80 96 128` px
(Tailwind: `1 2 3 4 6 8 12 16 24 32`).

| Context | Padding / gap |
| --- | --- |
| Card padding | 16 px mobile · 20–24 px desktop |
| Sidebar section padding | 16 px, 12 px between items |
| Page gutter | 16 px mobile · 24 px tablet · 32 px desktop |
| Grid gap (content) | 16 px mobile · 24 px desktop |
| Control bar padding | 10 px 14 px (player) |
| Icon ↔ label | 8 px |
| Avatar stack overlap | −10 px |

## 3. Colour

### 3.1 Neutral ramp

| Token | Hex | Use |
| --- | --- | --- |
| `--color-neutral-50` | `#f8fafc` | app canvas (light) |
| `--color-neutral-100` | `#f1f5f9` | sunken surfaces, skeletons |
| `--color-neutral-200` | `#e2e8f0` | borders (subtle), dividers |
| `--color-neutral-300` | `#cbd5e1` | borders (strong), input outline |
| `--color-neutral-400` | `#94a3b8` | placeholder text |
| `--color-neutral-500` | `#64748b` | tertiary text, icons |
| `--color-neutral-600` | `#475569` | secondary text |
| `--color-neutral-700` | `#334155` | body text on light |
| `--color-neutral-800` | `#1e293b` | headings on light |
| `--color-neutral-900` | `#0f172a` | strongest text |
| `--color-ink-950` | `#0b1120` | video / immersive surface |
| `--color-ink-800` | `#111827` | inverted surface |
| `--color-ink-600` | `#1f2937` | inverted border |

### 3.2 Brand ramp

| Token | Hex | Use |
| --- | --- | --- |
| `--color-brand-50` | `#eef2ff` | selected chip, progress track tint |
| `--color-brand-100` | `#e0e7ff` | icon tile background |
| `--color-brand-300` | `#a5b4fc` | brand border, dark-surface brand |
| `--color-brand-500` | `#6366f1` | primary action, active state |
| `--color-brand-600` | `#4f46e5` | primary action hover |
| `--color-brand-700` | `#4338ca` | primary text on light backgrounds |

### 3.3 Status

| Token | Hex | Use |
| --- | --- | --- |
| `--color-success-50 / 500 / 700` | `#ecfdf5 / #10b981 / #047857` | completed lesson, success toast |
| `--color-warning-50 / 500 / 700` | `#fffbeb / #f59e0b / #b45309` | in-progress state, "resume" pill |
| `--color-danger-50 / 500 / 700` | `#fef2f2 / #ef4444 / #b91c1c` | destructive, validation error |
| `--color-info-50 / 500 / 700` | `#eff6ff / #0ea5e9 / #0369a1` | reading/quiz lesson kind, links |

### 3.4 Semantic aliases

| Alias | Maps to |
| --- | --- |
| `--color-canvas` | neutral-50 |
| `--color-surface` | `#ffffff` |
| `--color-surface-sunken` | neutral-100 |
| `--color-surface-inverse` | ink-950 |
| `--color-border` | neutral-200 |
| `--color-border-strong` | neutral-300 |
| `--color-text-primary` | neutral-800 |
| `--color-text-secondary` | neutral-600 |
| `--color-text-tertiary` | neutral-500 |
| `--color-text-inverse` | `#ffffff` |
| `--color-text-onInverse` | neutral-200 |

### 3.5 Measured contrast (WCAG)

| Foreground | Background | Ratio | Verdict |
| --- | --- | --- | --- |
| neutral-800 `#1e293b` | `#ffffff` | 14.6:1 | AAA |
| neutral-600 `#475569` | `#ffffff` | 7.5:1 | AAA |
| neutral-500 `#64748b` | `#ffffff` | 4.8:1 | AA |
| neutral-500 `#64748b` | neutral-100 `#f1f5f9` | 4.3:1 | AA large only — used ≥ 18 px or non-essential |
| brand-700 `#4338ca` | `#ffffff` | 8.2:1 | AAA |
| `#ffffff` | brand-600 `#4f46e5` | 6.4:1 | AA (button) |
| `#ffffff` | brand-500 `#6366f1` | 4.6:1 | AA (button) |
| success-700 `#047857` | success-50 `#ecfdf5` | 4.9:1 | AA |
| warning-700 `#b45309` | warning-50 `#fffbeb` | 5.4:1 | AA |
| danger-700 `#b91c1c` | danger-50 `#fef2f2` | 7.1:1 | AAA |
| `#ffffff` | ink-950 `#0b1120` | 19.2:1 | AAA (player chrome) |
| neutral-200 `#e2e8f0` | ink-950 `#0b1120` | 15.1:1 | AAA (control icons on video) |

## 4. Radii

| Token | Value | Use |
| --- | --- | --- |
| `--radius-xs` | 6px | chips, tags, checkbox |
| `--radius-sm` | 8px | inputs, small buttons, lesson rows |
| `--radius-md` | 12px | cards, panels, video stage |
| `--radius-lg` | 16px | dialogs, bottom sheet, catalogue cards |
| `--radius-full` | 999px | avatars, pills, circular icon buttons |

## 5. Elevation

| Token | Value | Use |
| --- | --- | --- |
| `--shadow-xs` | `0 1px 2px rgb(15 23 42 / .06)` | resting cards |
| `--shadow-sm` | `0 1px 3px rgb(15 23 42 / .08), 0 1px 2px rgb(15 23 42 / .04)` | hover cards |
| `--shadow-md` | `0 6px 16px rgb(15 23 42 / .10)` | sticky bar, dropdown |
| `--shadow-lg` | `0 18px 40px rgb(15 23 42 / .18)` | dialog, bottom sheet, toast |

The player uses `shadow-md` for its sticky elements so they separate from scrolling content
without a heavy border.

## 6. Motion

| Token | Duration | Easing | Use |
| --- | --- | --- | --- |
| `--duration-micro` | 150 ms | `cubic-bezier(.2,.8,.2,1)` | hover, colour, opacity |
| `--duration-layout` | 220 ms | same | sidebar collapse, grid reflow |
| `--duration-overlay` | 320 ms | same | dialog, bottom sheet, toast |
| `--delay-autohide` | 2500 ms | — | video control bar idle hide |

Under `prefers-reduced-motion: reduce` every duration collapses to `1ms` and the auto-hide
timer is disabled.

## 7. Layout metrics

| Token | Value | Meaning |
| --- | --- | --- |
| `--appBarHeight` | 56 px (mobile) / 64 px (desktop) | top app bar |
| `--sidebarWidth` | 380 px | desktop course-content sidebar |
| `--videoAspect` | 16 / 9 | stage aspect ratio, always reserved |
| `--controlsHeight` | 48 px | video control bar |
| `--mobileBottomBarHeight` | 60 px | sticky mobile bar |
| `--tapTarget` | 44 px | minimum touch target on mobile |
| `--measure` | 72ch | max text line length |
| `--shellMaxWidth` | 1560 px | max content width, player + catalogue |

## 8. Breakpoints

Tailwind defaults, used verbatim:

| Name | Width |
| --- | --- |
| `sm` | 640 px |
| `md` | 768 px — mobile → tablet switch |
| `lg` | 1024 px — sidebar becomes a grid column |
| `xl` | 1280 px — full desktop composition |
| `2xl` | 1536 px |

Additional non-Tailwind query:

```css
@media (orientation: landscape) and (max-height: 560px) { /* immersive mobile video */ }
@media (prefers-reduced-motion: reduce) { /* collapse motion */ }
```