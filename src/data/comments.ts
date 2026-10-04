import { courses } from "./courses";
import { ids } from "./ids";
import { instructors, leaderboardStudents, viewer } from "./profiles";

import type { CourseComment, ViewerProfile } from "@/domain/types";

interface CommentSeed {
  author: ViewerProfile;
  body: string;
  /** Minutes before the course's last update, so relative times stay stable. */
  minutesAgo: number;
  helpfulCount: number;
}

const commenter = (index: number): ViewerProfile => leaderboardStudents[index % leaderboardStudents.length];

const commentSeeds: Record<string, CommentSeed[]> = {
  "advanced-typescript-patterns": [
    {
      author: commenter(1),
      body: "The refactor in section 3 finally made `noUncheckedIndexedAccess` click for me. We turned it on for a single package and the compiler found two live bugs in an afternoon.",
      minutesAgo: 42,
      helpfulCount: 38,
    },
    {
      author: commenter(3),
      body: "Worth flagging that the variance episode assumes you have read the TS 5.0 release notes. Would love a short recap before section 4 starts.",
      minutesAgo: 190,
      helpfulCount: 21,
    },
    {
      author: commenter(0),
      body: "Used the compile-time benchmark CSV on our monorepo — dropped build time by 41% using only the `const` extraction trick. Thank you for including the raw numbers.",
      minutesAgo: 1480,
      helpfulCount: 64,
    },
    {
      author: commenter(5),
      body: "Small correction for the migration episode: you can scope `exactOptionalPropertyTypes` per directory via a second tsconfig with references, not only per package.",
      minutesAgo: 3020,
      helpfulCount: 17,
    },
  ],
  "design-systems-in-practice": [
    {
      author: commenter(2),
      body: "The slot-versus-config section changed our review process. We now reject any component PR that adds a boolean prop without an argument that a slot is impossible.",
      minutesAgo: 95,
      helpfulCount: 29,
    },
    {
      author: commenter(6),
      body: "Adopted the three-layer token model on Monday. Our marketing site was able to switch theme without an engineering ticket, which has never happened before.",
      minutesAgo: 2210,
      helpfulCount: 52,
    },
  ],
  "applied-machine-learning": [
    {
      author: commenter(4),
      body: "The leaking-pipeline lab is brutal and brilliant. We reran it on our churn model and found the same class of bug in two features.",
      minutesAgo: 320,
      helpfulCount: 18,
    },
    {
      author: commenter(7),
      body: "Would be helpful to see the monitoring section applied to a retraining pipeline rather than a static model.",
      minutesAgo: 4100,
      helpfulCount: 11,
    },
  ],
  "growth-analytics-funnel": [
    {
      author: commenter(1),
      body: "Session stitching episode solved a two-year mystery in our analytics. Duplicate users were inflating step three by about 30%.",
      minutesAgo: 60,
      helpfulCount: 41,
    },
    {
      author: commenter(5),
      body: "The weekly growth review agenda is now our default template. It ends in decisions because the last slot is literally named 'decisions'.",
      minutesAgo: 2650,
      helpfulCount: 33,
    },
  ],
  "product-strategy-masterclass": [
    {
      author: commenter(0),
      body: "Kill criteria written first felt contrarian and then saved a quarter. We killed a bet in week three with no argument required.",
      minutesAgo: 780,
      helpfulCount: 27,
    },
    {
      author: commenter(4),
      body: "The positioning brief exercise is the hardest one and the most useful. Rewrote ours three times.",
      minutesAgo: 1900,
      helpfulCount: 15,
    },
  ],
  "cloud-security-hardening": [
    {
      author: commenter(2),
      body: "Ran the incident drill with the whole on-call rotation. The timeline template made the blameless review ten times faster.",
      minutesAgo: 240,
      helpfulCount: 44,
    },
    {
      author: commenter(6),
      body: "The effective-permissions audit script found a wildcard action we had forgotten about for two years.",
      minutesAgo: 3400,
      helpfulCount: 58,
    },
  ],
};

export const commentsBySlug: Record<string, CourseComment[]> = Object.fromEntries(
  Object.entries(commentSeeds).map(([slug, seeds]) => {
    const course = courses.find((entry) => entry.slug === slug);
    if (!course) throw new Error(`Unknown course slug in comment seed: ${slug}`);

    const updatedAt = new Date(course.updatedAt).getTime();

    return [
      slug,
      seeds.map((seed, index) => {
        const lessonId =
          seed.minutesAgo < 300
            ? (course.sections.at(-1)?.lessons.at(-1)?.id ?? null)
            : (course.sections[0]?.lessons[0]?.id ?? null);

        return {
          id: ids.comment(slug, index),
          courseId: course.id,
          lessonId,
          author: seed.author,
          body: seed.body,
          createdAt: new Date(updatedAt - seed.minutesAgo * 60_000).toISOString(),
          helpfulCount: seed.helpfulCount,
          viewerHasMarkedHelpful: false,
        };
      }),
    ];
  }),
);

/** A pinned note from the instructor, shown above the comment list. */
export const instructorPinnedComment: CourseComment = {
  id: ids.comment("pinned", 0),
  courseId: courses[0].id,
  lessonId: null,
  author: instructors.omar,
  body: "If you are stuck on the section 2 lab, the solution zip has a commented walkthrough — start there before posting here.",
  createdAt: courses[0].updatedAt,
  helpfulCount: 96,
  viewerHasMarkedHelpful: false,
};

export const viewerProfile = viewer;