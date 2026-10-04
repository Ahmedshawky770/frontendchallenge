import { avatarFor } from "./courseArt.generated";
import { ids } from "./ids";

import type { Instructor, ViewerProfile } from "@/domain/types";

function instructorProfile(
  key: string,
  name: string,
  title: string,
  studentsCount: number,
): Instructor {
  return {
    id: ids.profile(key),
    name,
    avatarUrl: avatarFor(key).url,
    role: "instructor",
    headline: title,
    title,
    studentsCount,
  };
}

function studentProfile(key: string, name: string, headline: string): ViewerProfile {
  return {
    id: ids.profile(key),
    name,
    avatarUrl: avatarFor(key).url,
    role: "student",
    headline,
  };
}

export const instructors = {
  omar: instructorProfile(
    "omar-nasser",
    "Omar Nasser",
    "Staff Engineer · TypeScript core contributor",
    61400,
  ),
  layla: instructorProfile(
    "layla-haddad",
    "Layla Haddad",
    "Principal Engineer · Design Systems",
    48200,
  ),
  sara: instructorProfile(
    "sara-mansour",
    "Sara Mansour",
    "ML Research Lead · Ex-Data Scientist",
    27900,
  ),
  youssef: instructorProfile(
    "youssef-adel",
    "Youssef Adel",
    "Growth Lead · Ex-Head of Lifecycle",
    33500,
  ),
  nour: instructorProfile(
    "nour-el-sayed",
    "Nour El-Sayed",
    "VP Product · 3 exits, 2 acquisitions",
    19800,
  ),
  karim: instructorProfile(
    "karim-fathy",
    "Karim Fathy",
    "Cloud Security Architect · CISSP",
    22100,
  ),
} as const;

export type InstructorKey = keyof typeof instructors;

/** The signed-in learner. Progress, comments and the leaderboard are all scoped to them. */
export const viewer: ViewerProfile = {
  id: ids.profile("viewer"),
  name: "Ahmed Shawky",
  avatarUrl: avatarFor("hana-mostafa").url,
  role: "student",
  headline: "Frontend Engineer · Next.js",
};

/**
 * Leaderboard cohort, strongest first. Percentages are per-student fixture data;
 * the viewer is injected by the leaderboard query so the learner can find their
 * own standing in the list.
 */
export const leaderboardStudents: ViewerProfile[] = [
  studentProfile("hana-mostafa", "Hana Mostafa", "Frontend Engineer · Alexandria"),
  studentProfile("mai-akhtar", "Mai Akhtar", "Product Designer · Amman"),
  studentProfile("tarek-ibrahim", "Tarek Ibrahim", "Backend Engineer · Cairo"),
  studentProfile("dina-shalaby", "Dina Shalaby", "Data Analyst · Casablanca"),
  studentProfile("omar-nasser", "Ziad Ramadan", "SRE · Riyadh"),
  studentProfile("bilal-omar", "Bilal Omar", "Full-stack Developer · Tunis"),
  studentProfile("ziad-ramadan", "Nour Fahmy", "Growth Analyst · Dubai"),
  studentProfile("karim-fathy", "Karim Emad", "DevOps Engineer · Berlin"),
];

export const leaderboardStreaks = [24, 19, 17, 12, 9, 7, 5, 3] as const;