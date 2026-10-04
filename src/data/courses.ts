import { posterFor } from "./courseArt.generated";
import { ids } from "./ids";
import { instructors, type InstructorKey } from "./profiles";

import type {
  Course,
  CourseCategory,
  CourseLevel,
  CourseMaterial,
  FileType,
  LessonKind,
} from "@/domain/types";

/**
 * Mock fixtures. Deliberately hand-written rather than generated: lesson titles
 * and summaries are what a reviewer reads to judge the UI, and the counts are
 * uneven on purpose (11 lessons in one course, 24 in another) so layout breakage
 * under real content shows up during development rather than in a demo.
 */

interface LessonSeed {
  title: string;
  kind?: LessonKind;
  /** Minutes, converted to seconds on build. Keeps the fixtures readable. */
  minutes: number;
  summary: string;
  isPreview?: boolean;
  attachments?: { title: string; fileType: FileType; kb: number }[];
}

interface SectionSeed {
  title: string;
  lessons: LessonSeed[];
}

interface MaterialSeed {
  title: string;
  description: string;
  fileType: FileType;
  /** KB, or null for external links. */
  kb: number | null;
  pages?: number;
}

interface CourseSeed {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: CourseCategory;
  level: CourseLevel;
  instructor: InstructorKey;
  accentColor: string;
  rating: number;
  ratingCount: number;
  enrolledCount: number;
  updatedAt: string;
  sections: SectionSeed[];
  materials: MaterialSeed[];
}

const courseSeeds: CourseSeed[] = [
  {
    slug: "advanced-typescript-patterns",
    title: "Advanced TypeScript Patterns for Production Code",
    subtitle:
      "Move past interfaces. Model real domains with generics, discriminated unions and inference tricks that survive contact with a large codebase.",
    description:
      "Most TypeScript tutorials stop at the point where the type checker stops you. This course is about the other side: how to design a type layer that carries so much intent that invalid states stop being representable, and how to keep compile times sane while you do it. We refactor a real service layer end to end — from a bag of optional fields to a discriminated-union state machine — and measure the before and after.",
    category: "engineering",
    level: "advanced",
    instructor: "omar",
    accentColor: "#4f46e5",
    rating: 4.8,
    ratingCount: 3120,
    enrolledCount: 18422,
    updatedAt: "2026-02-18T09:00:00.000Z",
    sections: [
      {
        title: "Foundations you can feel on day one",
        lessons: [
          {
            title: "Why your types keep lying to you",
            minutes: 14,
            summary:
              "Optional properties, index signatures and the widening behaviour that lets a string become a string-with-possibilities. Three real defects hiding behind a clean build.",
            isPreview: true,
          },
          {
            title: "The type-level contract mindset",
            minutes: 18,
            summary:
              "Reading a codebase's types before its logic. How to spot a domain model that encodes rules in documentation instead of in the compiler.",
          },
          {
            title: "Strict mode, properly configured",
            minutes: 12,
            summary:
              "noUncheckedIndexedAccess, exactOptionalPropertyTypes, noPropertyAccessFromIndexSignature — each one, what it breaks, and why it is worth it.",
          },
          {
            title: "Reading error messages as documentation",
            minutes: 9,
            summary:
              "When the checker says 'not assignable', it is usually describing a modelling mistake. A repeatable decoding routine.",
            attachments: [
              { title: "strict-config-cheatsheet.pdf", fileType: "pdf", kb: 412 },
            ],
          },
        ],
      },
      {
        title: "Inference and its limits",
        lessons: [
          {
            title: "How inference actually resolves",
            minutes: 21,
            summary:
              "Candidates, widening and the return-type feedback loop. Watching the checker work in the playground before writing production code.",
          },
          {
            title: "Distributing conditional types over unions",
            minutes: 17,
            summary:
              "Turning a union of inputs into a union of outputs without distributing by hand — the helper that makes extraction types readable.",
          },
          {
            title: "const assertions and literal widening",
            minutes: 13,
            summary:
              "Where `as const` helps, where it silently swallows errors, and the generic default-parameter trick that keeps it honest.",
          },
          {
            title: "Lab: a typed event emitter",
            minutes: 26,
            summary:
              "Build an emitter where the handler map is derived from the event union and an unknown event name is a compile error, not a runtime one.",
            attachments: [
              { title: "lab-starter.zip", fileType: "zip", kb: 96 },
              { title: "lab-solution.zip", fileType: "zip", kb: 148 },
            ],
          },
        ],
      },
      {
        title: "Discriminated unions as state machines",
        lessons: [
          {
            title: "From five booleans to four states",
            minutes: 19,
            summary:
              "A boolean flag set describes sixteen worlds; four of them are impossible. Modelling the four real ones instead.",
          },
          {
            title: "Exhaustive checking and the never guard",
            minutes: 15,
            summary:
              "Making the compiler tell you when a new state appears without editing three switch statements.",
          },
          {
            title: "Narrowing across async boundaries",
            minutes: 22,
            summary:
              "Where a discriminated union loses its power: awaits, callbacks and error paths. Encoding pending, ready and failed explicitly.",
            isPreview: true,
          },
          {
            title: "Patterns: loading, validation, pagination",
            minutes: 24,
            summary:
              "Three state machines you will write this quarter, modelled once and reused everywhere.",
            attachments: [
              { title: "state-machine-recipes.pdf", fileType: "pdf", kb: 1260 },
            ],
          },
        ],
      },
      {
        title: "Generics that scale",
        lessons: [
          {
            title: "Generic constraints as documentation",
            minutes: 16,
            summary:
              "A constraint is an executable precondition. Using one instead of a paragraph in the PR description.",
          },
          {
            title: "Variance, and why your callback rejects",
            minutes: 23,
            summary:
              "Function parameter bivariance in TypeScript, and the settings that make callbacks behave the way you expect.",
          },
          {
            title: "Avoiding the generic tax on compile time",
            minutes: 20,
            summary:
              "Measuring with --diagnostics, then the four refactors that cut build time without touching a single behaviour.",
            attachments: [
              { title: "compile-time-benchmark.csv", fileType: "sheet", kb: 78 },
            ],
          },
          {
            title: "When to reach for a schema library",
            minutes: 14,
            summary:
              "Types stop at runtime. Where a validation library earns its dependency cost, and where a hand-written guard is smaller.",
          },
        ],
      },
      {
        title: "Boundary typing",
        lessons: [
          {
            title: "Typing untrusted input without lying",
            minutes: 18,
            summary:
              "Network responses are unknown. Parsing at the edge so the rest of the codebase can trust its inputs.",
          },
          {
            title: "Typed API clients end to end",
            minutes: 21,
            summary:
              "From a route definition to a fully typed fetch, including the error branch — no `any` at the seam.",
          },
          {
            title: "Migrating a legacy codebase without freezing",
            minutes: 25,
            summary:
              "Incremental strictness: per-directory tsconfig, boundary types first, and a CI gate that only ever gets tighter.",
            attachments: [
              { title: "migration-playbook.pdf", fileType: "pdf", kb: 884 },
            ],
          },
        ],
      },
      {
        title: "Capstone",
        lessons: [
          {
            title: "Architecture walkthrough",
            minutes: 11,
            summary:
              "How the five previous sections compose into one type layer for a checkout flow.",
          },
          {
            title: "Type-level test suite",
            minutes: 27,
            summary:
              "Writing tests that fail when the type layer regresses, using the type system as the assertion engine.",
          },
        ],
      },
    ],
    materials: [
      {
        title: "Complete Type Reference Sheet",
        description:
          "Every utility type, keyword and narrowing trick from the course on two printable pages.",
        fileType: "pdf",
        kb: 1180,
        pages: 2,
      },
      {
        title: "Strict Config Cheatsheet",
        description: "Every compiler flag discussed, with the trade-off for each one.",
        fileType: "pdf",
        kb: 412,
        pages: 3,
      },
      {
        title: "Discriminated Union Recipes",
        description: "Loading, validation, pagination and optimistic update patterns.",
        fileType: "pdf",
        kb: 1260,
        pages: 34,
      },
      {
        title: "Lab Files — Emitter and Checkout Flow",
        description: "Starter and solution code for every exercise in the course.",
        fileType: "zip",
        kb: 6420,
      },
      {
        title: "TypeScript Handbook (upstream)",
        description: "Official documentation, mirrored for offline reference.",
        fileType: "link",
        kb: null,
      },
    ],
  },
  {
    slug: "design-systems-in-practice",
    title: "Design Systems in Practice",
    subtitle:
      "Tokens, components and the organisational work of making a system stick long after the first sprint.",
    description:
      "A component library is a technical artefact; a design system is a shared agreement. This course covers the token architecture that survives rebranding, the component API decisions that prevent a thousand one-off variants, and the governance model that stops contribution from becoming extraction.",
    category: "design",
    level: "intermediate",
    instructor: "layla",
    accentColor: "#0e7490",
    rating: 4.7,
    ratingCount: 2140,
    enrolledCount: 12980,
    updatedAt: "2026-01-30T09:00:00.000Z",
    sections: [
      {
        title: "Token architecture",
        lessons: [
          {
            title: "Primitive, semantic, component tokens",
            minutes: 16,
            summary:
              "Three layers, and the mistake most systems make by collapsing the middle one.",
            isPreview: true,
          },
          {
            title: "Theming without a rebuild",
            minutes: 19,
            summary:
              "Semantic tokens are what let a dark theme be a data change rather than a fork.",
          },
          {
            title: "Type and space scales that scale",
            minutes: 14,
            summary:
              "Choosing a ratio, then resisting the urge to add a thirteenth step.",
            attachments: [{ title: "token-audit-sheet.pdf", fileType: "pdf", kb: 340 }],
          },
        ],
      },
      {
        title: "Component API design",
        lessons: [
          {
            title: "Anatomy of a resilient button",
            minutes: 22,
            summary:
              "Variants, sizes, loading and icon slots — and the four props that make it a component rather than a config object.",
          },
          {
            title: "Slots and composition over configuration",
            minutes: 25,
            summary:
              "When children beat props, and how to keep a component from collapsing into boolean soup.",
            isPreview: true,
          },
          {
            title: "Headless behaviour, styled presentation",
            minutes: 20,
            summary:
              "Splitting the state machine from the skin so the same dialog works in three products.",
          },
          {
            title: "Accessibility as an API constraint",
            minutes: 17,
            summary:
              "Keyboard contract, focus order and naming — designed in, not audited in.",
            attachments: [{ title: "a11y-checklist.pdf", fileType: "pdf", kb: 512 }],
          },
          {
            title: "Lab: refactor a legacy button",
            minutes: 28,
            summary:
              "Take a 900-line button component down to 120 without breaking 40 call sites.",
          },
        ],
      },
      {
        title: "Documentation that gets read",
        lessons: [
          { title: "Write the decision, not the description", minutes: 15, summary: "What belongs in a component doc, and what belongs in an ADR." },
          {
            title: "Live examples over screenshots",
            minutes: 13,
            summary: "Why a broken screenshot costs more than a working sandbox.",
          },
          {
            title: "Adoption metrics that mean something",
            minutes: 12,
            summary: "Coverage is a vanity metric. Track the 4% that bypass the system.",
          },
        ],
      },
      {
        title: "Governance and contribution",
        lessons: [
          {
            title: "The contribution ladder",
            minutes: 18,
            summary: "Three tiers of contribution and the review cost of each.",
          },
          {
            title: "Versioning and deprecation",
            minutes: 16,
            summary: "Codemods, changelogs and letting 40 teams upgrade without freezing.",
          },
          {
            title: "Measuring whether it worked",
            minutes: 14,
            summary: "Design-to-ship time, defect density and the honest trade-offs.",
          },
        ],
      },
    ],
    materials: [
      {
        title: "Token Architecture Guide",
        description: "The three-layer model with naming conventions and migration examples.",
        fileType: "pdf",
        kb: 2240,
        pages: 28,
      },
      {
        title: "Component Contract Template",
        description: "The document every component ships with, including the a11y contract.",
        fileType: "pdf",
        kb: 386,
        pages: 4,
      },
      {
        title: "Accessibility Checklist",
        description: "Per-component keyboard, focus and announcement requirements.",
        fileType: "pdf",
        kb: 512,
        pages: 6,
      },
      {
        title: "Figma Token Export",
        description: "Style dictionary setup that exports straight to CSS custom properties.",
        fileType: "zip",
        kb: 1840,
      },
      {
        title: "Contribution Policy Template",
        description: "Ready-to-adapt governance policy for a new design system.",
        fileType: "sheet",
        kb: 96,
        pages: 1,
      },
    ],
  },
  {
    slug: "applied-machine-learning",
    title: "Applied Machine Learning for Product Teams",
    subtitle:
      "Ship a model that survives contact with real users: evaluation, drift, and the boring infrastructure that makes iteration possible.",
    description:
      "Most production models do not fail because of the architecture. They fail because of a leaky validation split, a feature that was unavailable at inference time, and no monitoring. This course is about the second half of machine learning: the part after the notebook works.",
    category: "data",
    level: "intermediate",
    instructor: "sara",
    accentColor: "#047857",
    rating: 4.6,
    ratingCount: 1780,
    enrolledCount: 9340,
    updatedAt: "2026-02-05T09:00:00.000Z",
    sections: [
      {
        title: "Evaluation you can trust",
        lessons: [
          {
            title: "Why your accuracy is optimistic",
            minutes: 17,
            summary: "Temporal leakage, target leakage, and the split that flatters you.",
            isPreview: true,
          },
          {
            title: "Choosing metrics for asymmetric costs",
            minutes: 19,
            summary: "Precision, recall and the threshold that actually matters for your product.",
          },
          {
            title: "Confidence intervals, not point estimates",
            minutes: 15,
            summary: "Reporting uncertainty so a 2% improvement is not shipped as a 2% fact.",
            attachments: [{ title: "metrics-reference.pdf", fileType: "pdf", kb: 640 }],
          },
        ],
      },
      {
        title: "Features and pipelines",
        lessons: [
          { title: "The training-serving skew problem", minutes: 21, summary: "One definition, enforced in code, used by both paths." },
          {
            title: "Feature stores without the marketing",
            minutes: 18,
            summary: "What a feature store actually does, and the smallest version that works.",
            isPreview: true,
          },
          {
            title: "Lab: fix a leaking pipeline",
            minutes: 26,
            summary: "A deliberately broken notebook. Find the leak, fix the split, re-evaluate.",
          },
        ],
      },
      {
        title: "Serving and monitoring",
        lessons: [
          { title: "Batch versus online inference", minutes: 20, summary: "Latency budgets and the batch path that most products actually need." },
          {
            title: "Drift detection without the hype",
            minutes: 22,
            summary: "Population stability index, feature drift, and which alarms are worth waking up for.",
            attachments: [{ title: "monitoring-dashboard.json", fileType: "sheet", kb: 142 }],
          },
          {
            title: "Rollback plans and model shadowing",
            minutes: 16,
            summary: "Shipping a model is a deployment, which means it needs an undo.",
          },
        ],
      },
      {
        title: "Shipping it",
        lessons: [
          { title: "Model cards and the review conversation", minutes: 14, summary: "Writing the document that makes a launch review productive." },
          { title: "Cost, latency and the architecture trade-off", minutes: 19, summary: "Caching, batching and when a smaller model wins." },
          { title: "Capstone: end-to-end review", minutes: 24, summary: "A full pass over a candidate model, from split to rollback plan." },
        ],
      },
    ],
    materials: [
      {
        title: "Evaluation Playbook",
        description: "Metric selection, split design and reporting templates for every stage.",
        fileType: "pdf",
        kb: 1640,
        pages: 31,
      },
      {
        title: "Drift Monitoring Reference",
        description: "Thresholds, alarm routing and the on-call playbook for model alerts.",
        fileType: "pdf",
        kb: 720,
        pages: 12,
      },
      {
        title: "Lab Notebooks",
        description: "The leaking-pipeline lab and the capstone review, runnable end to end.",
        fileType: "zip",
        kb: 5240,
      },
      {
        title: "Model Card Template",
        description: "Fill-in template for launch review documentation.",
        fileType: "sheet",
        kb: 84,
        pages: 1,
      },
    ],
  },
  {
    slug: "growth-analytics-funnel",
    title: "Growth Analytics: From Funnel to Retention",
    subtitle:
      "Instrument a product properly, read the funnel honestly, and find the one step that actually costs you users.",
    description:
      "Funnels tell you where users leave. They do not tell you why, and they rarely tell you what to do. This course builds the instrumentation properly first — because every analytical mistake downstream traces back to a tracking plan written in a hurry.",
    category: "marketing",
    level: "beginner",
    instructor: "youssef",
    accentColor: "#c2410c",
    rating: 4.5,
    ratingCount: 1420,
    enrolledCount: 15870,
    updatedAt: "2026-01-12T09:00:00.000Z",
    sections: [
      {
        title: "Instrumentation",
        lessons: [
          {
            title: "The tracking plan is the product",
            minutes: 13,
            summary: "Events as an interface: named, versioned and owned by someone.",
            isPreview: true,
          },
          {
            title: "Event naming that survives a rewrite",
            minutes: 15,
            summary: "Nouns versus verbs, and the migration cost of renaming later.",
          },
          {
            title: "Identity, stitching and the anonymous user",
            minutes: 18,
            summary: "Why most funnels double-count, and how to fix session stitching.",
            attachments: [{ title: "tracking-plan-template.csv", fileType: "sheet", kb: 62 }],
          },
        ],
      },
      {
        title: "Reading the funnel",
        lessons: [
          { title: "Step definition and drop-off math", minutes: 16, summary: "Where a step boundary quietly reclassifies your traffic." },
          {
            title: "Segment before you conclude",
            minutes: 17,
            summary: "The aggregate step that averages two opposite behaviours into meaninglessness.",
            isPreview: true,
          },
          { title: "Cohorts and the retention curve", minutes: 20, summary: "Day-1, day-7, day-30 and why the curve flattens where product work pays off." },
          { title: "Lab: rebuild a broken funnel", minutes: 24, summary: "Raw events to an actionable funnel, fixing the definitions as you go." },
        ],
      },
      {
        title: "Acting on it",
        lessons: [
          { title: "Choosing one experiment", minutes: 14, summary: "Impact and effort, and the discipline of shipping exactly one change." },
          { title: "Reading results without fooling yourself", minutes: 17, summary: "Sample ratio mismatch, novelty effects and peeking." },
          { title: "The weekly growth review", minutes: 12, summary: "A repeatable agenda that ends in decisions, not slides." },
        ],
      },
    ],
    materials: [
      {
        title: "Tracking Plan Template",
        description: "Event dictionary with owners, versions and required properties.",
        fileType: "sheet",
        kb: 62,
        pages: 1,
      },
      {
        title: "Funnel Analysis Handbook",
        description: "Step definitions, cohort maths and the segmentation playbook.",
        fileType: "pdf",
        kb: 1180,
        pages: 22,
      },
      {
        title: "Experiment Review Template",
        description: "Pre-registration and read-out template that survives scrutiny.",
        fileType: "pdf",
        kb: 296,
        pages: 3,
      },
      {
        title: "Lab Dataset and Queries",
        description: "Raw event log plus the SQL used to build each funnel in the course.",
        fileType: "zip",
        kb: 3180,
      },
    ],
  },
  {
    slug: "product-strategy-masterclass",
    title: "Product Strategy Masterclass",
    subtitle:
      "Choosing what not to build: opportunity sizing, competitive analysis, and a roadmap that survives a budget cycle.",
    description:
      "Strategy is a sequence of decisions, not a document. This course works through the actual artefacts — an opportunity model, a positioning brief, a bet portfolio and a roadmap narrative — and shows how they connect to each other and to the delivery cadence.",
    category: "business",
    level: "advanced",
    instructor: "nour",
    accentColor: "#a21caf",
    rating: 4.7,
    ratingCount: 980,
    enrolledCount: 6420,
    updatedAt: "2026-02-22T09:00:00.000Z",
    sections: [
      {
        title: "Opportunity",
        lessons: [
          {
            title: "Sizing without pretending precision",
            minutes: 19,
            summary: "Ranges, assumptions and writing them down where they can be argued with.",
            isPreview: true,
          },
          {
            title: "Segmenting a market that is not a list",
            minutes: 21,
            summary: "Jobs and triggers versus firmographics, and when demographics are a proxy.",
          },
          { title: "Competitive analysis without the feature grid", minutes: 16, summary: "Comparing motions and constraints instead of checkbox lists." },
        ],
      },
      {
        title: "Positioning",
        lessons: [
          { title: "The wedge", minutes: 17, summary: "One segment where you can win on a dimension that matters to them." },
          {
            title: "Writing the positioning brief",
            minutes: 22,
            summary: "The one page that sales, marketing and product can all repeat from memory.",
            isPreview: true,
            attachments: [{ title: "positioning-brief.pdf", fileType: "pdf", kb: 380 }],
          },
          { title: "Pricing as a positioning decision", minutes: 18, summary: "Value metric, anchoring and the packaging question." },
        ],
      },
      {
        title: "Bet portfolio",
        lessons: [
          { title: "Core, adjacent, exploratory", minutes: 20, summary: "Splitting a roadmap by bet size instead of by team." },
          { title: "Kill criteria, written first", minutes: 15, summary: "The pre-committed threshold that stops a zombie from consuming the quarter." },
          { title: "Portfolio review cadence", minutes: 13, summary: "The meeting that reallocates rather than reports." },
        ],
      },
      {
        title: "Roadtelling",
        lessons: [
          { title: "Roadmap as a narrative", minutes: 18, summary: "Sequencing by dependency and learning value, not by team convenience." },
          { title: "Presenting to a budget cycle", minutes: 15, summary: "Turning a bet portfolio into a funding conversation." },
          { title: "Capstone: your strategy on one page", minutes: 27, summary: "Produce and defend a complete one-page strategy for a product you know." },
        ],
      },
    ],
    materials: [
      {
        title: "Opportunity Model Spreadsheet",
        description: "Sizing with explicit assumptions and a sensitivity table.",
        fileType: "sheet",
        kb: 148,
        pages: 2,
      },
      {
        title: "Positioning Brief Template",
        description: "The one-page brief with worked examples from two companies.",
        fileType: "pdf",
        kb: 380,
        pages: 4,
      },
      {
        title: "Bet Portfolio Canvas",
        description: "Core, adjacent and exploratory columns with kill criteria prompts.",
        fileType: "pdf",
        kb: 264,
        pages: 3,
      },
      {
        title: "Case Study Decks",
        description: "Three annotated strategy walkthroughs, with the reasoning left in.",
        fileType: "zip",
        kb: 8960,
      },
    ],
  },
  {
    slug: "cloud-security-hardening",
    title: "Cloud Security Hardening in Practice",
    subtitle:
      "Threat modelling, least privilege and incident readiness for teams running real workloads on real infrastructure.",
    description:
      "Threat models on a slide do not survive contact with a real account. This course hardens a running environment: identity boundaries, network posture, secrets handling, detection, and the runbook you will need at 3 a.m. Every exercise runs against infrastructure you deploy yourself.",
    category: "security",
    level: "advanced",
    instructor: "karim",
    accentColor: "#b91c1c",
    rating: 4.9,
    ratingCount: 860,
    enrolledCount: 5180,
    updatedAt: "2026-02-26T09:00:00.000Z",
    sections: [
      {
        title: "Modelling the threat",
        lessons: [
          {
            title: "From assets to attack paths",
            minutes: 20,
            summary: "A threat model that produces actionable findings instead of a risk register.",
            isPreview: true,
          },
          {
            title: "Abuse cases, not just vulnerabilities",
            minutes: 18,
            summary: "Designing around what an attacker wants, rather than what a scanner finds.",
          },
          {
            title: "Lab: threat model a three-tier app",
            minutes: 25,
            summary: "Full model, scored findings and a prioritised remediation order.",
          },
        ],
      },
      {
        title: "Identity and access",
        lessons: [
          { title: "The permissions you actually granted", minutes: 21, summary: "Auditing effective permissions versus intended permissions." },
          {
            title: "Workload identity, not long-lived keys",
            minutes: 19,
            summary: "Replacing static credentials with short-lived, scoped identity.",
            isPreview: true,
            attachments: [{ title: "iam-hardening-checklist.pdf", fileType: "pdf", kb: 420 }],
          },
          { title: "Break-glass access that is still accountable", minutes: 16, summary: "Emergency access with approvals, expiry and an audit trail." },
          { title: "Session and token hygiene", minutes: 15, summary: "Lifetime, audience, revocation and the tokens nobody revokes." },
        ],
      },
      {
        title: "Detection and response",
        lessons: [
          { title: "What to log, and what to drop", minutes: 18, summary: "Signal-to-noise in audit logs, and the cost of storing everything." },
          { title: "Building a usable alert", minutes: 22, summary: "Alerts with an owner, a runbook and a threshold that means something." },
          { title: "Incident runbook drill", minutes: 27, summary: "A simulated compromise, run live, with the timeline recorded for review." },
        ],
      },
    ],
    materials: [
      {
        title: "Threat Modelling Workbook",
        description: "Data-flow diagrams, scoring rubric and the finding prioritisation sheet.",
        fileType: "pdf",
        kb: 2100,
        pages: 38,
      },
      {
        title: "IAM Hardening Checklist",
        description: "Least-privilege audit steps with the command for each check.",
        fileType: "pdf",
        kb: 420,
        pages: 5,
      },
      {
        title: "Infrastructure Lab Environment",
        description: "Terraform for a disposable three-tier environment to run every exercise against.",
        fileType: "zip",
        kb: 1420,
      },
      {
        title: "Incident Runbook Template",
        description: "The runbook structure used during the drill, plus the recorded timeline.",
        fileType: "sheet",
        kb: 118,
        pages: 3,
      },
    ],
  },
];

/**
 * `startingIndex` is the number of lessons in every preceding section, so
 * `Lesson.index` is the position in the whole course. It was originally
 * `lessonIndex + 1` — a within-section number — which contradicted the type's
 * own contract and made the player disagree with itself: the video badge said
 * "Lesson 4" while the header underneath said "Lesson 12 / 21".
 */
function buildLessons(
  courseSlug: string,
  sectionIndex: number,
  seed: SectionSeed,
  startingIndex: number,
) {
  const sectionId = ids.section(courseSlug, sectionIndex);

  return seed.lessons.map((lesson, lessonIndex) => ({
    id: ids.lesson(courseSlug, sectionIndex, lessonIndex),
    sectionId,
    courseId: ids.course(courseSlug),
    index: startingIndex + lessonIndex + 1,
    title: lesson.title,
    kind: lesson.kind ?? "video",
    durationSeconds: lesson.minutes * 60,
    isPreview: lesson.isPreview ?? false,
    summary: lesson.summary,
    resources: (lesson.attachments ?? []).map((attachment, resourceIndex) => ({
      id: ids.resource(courseSlug, sectionIndex, lessonIndex, resourceIndex),
      lessonId: ids.lesson(courseSlug, sectionIndex, lessonIndex),
      title: attachment.title,
      fileType: attachment.fileType,
      sizeBytes: attachment.kb * 1024,
      url: `/course-materials/${courseSlug}/${attachment.title}`,
    })),
  }));
}

function buildMaterials(courseSlug: string, seed: CourseSeed): CourseMaterial[] {
  return seed.materials.map((material, materialIndex) => ({
    id: ids.material(courseSlug, materialIndex),
    courseId: ids.course(courseSlug),
    title: material.title,
    description: material.description,
    fileType: material.fileType,
    sizeBytes: material.kb === null ? null : material.kb * 1024,
    pages: material.pages ?? null,
    url: `/course-materials/${courseSlug}/${material.title.toLowerCase().replaceAll(" ", "-")}`,
  }));
}

export const courses: Course[] = courseSeeds.map((seed) => {
  const poster = posterFor(seed.slug);

  // Running count so each section's lessons can be numbered from where the
  // previous one stopped.
  let lessonsBefore = 0;

  return {
    id: ids.course(seed.slug),
    slug: seed.slug,
    title: seed.title,
    subtitle: seed.subtitle,
    description: seed.description,
    category: seed.category,
    level: seed.level,
    instructor: instructors[seed.instructor],
    posterUrl: poster.url,
    posterBlurDataUrl: poster.blurDataUrl,
    stageUrl: poster.stageUrl,
    stageBlurDataUrl: poster.stageBlurDataUrl,
    accentColor: seed.accentColor,
    rating: seed.rating,
    ratingCount: seed.ratingCount,
    enrolledCount: seed.enrolledCount,
    updatedAt: seed.updatedAt,
    sections: seed.sections.map((section, sectionIndex) => {
      const built = buildLessons(seed.slug, sectionIndex, section, lessonsBefore);
      lessonsBefore += built.length;

      return {
        id: ids.section(seed.slug, sectionIndex),
        courseId: ids.course(seed.slug),
        title: section.title,
        lessons: built,
      };
    }),
    materials: buildMaterials(seed.slug, seed),
  };
});

export const courseSlugs = courses.map((course) => course.slug);