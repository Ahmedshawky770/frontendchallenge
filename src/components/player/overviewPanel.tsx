"use client";

import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { formatCount, formatDurationLong, formatInteger } from "@/domain/format";
import type { Course, FlatLesson } from "@/domain/types";

export interface OverviewPanelProps {
  course: Course;
  lesson: FlatLesson | null;
}

/** Default "Overview" tab: what this lesson covers, plus the course context. */
export function OverviewPanel({ course, lesson }: OverviewPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="lesson-summary-heading" className="flex flex-col gap-2">
        <h2 id="lesson-summary-heading" className="text-title-sm font-semibold text-text-primary">
          About this lesson
        </h2>
        <p className="measure text-body text-text-secondary">
          {lesson?.summary ??
            "Pick a lesson from the course content to see its summary, materials and discussion."}
        </p>

        {lesson && lesson.resources.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-2">
            {lesson.resources.map((resource) => (
              <li
                key={resource.id}
                className="flex items-center gap-3 rounded-control border border-border bg-surface-sunken px-3 py-2"
              >
                <Icon name="paperclip" size={16} className="shrink-0 text-text-tertiary" />
                <span className="min-w-0 flex-1">
                  <span className="clampOne block text-body-sm font-medium text-text-primary">
                    {resource.title}
                  </span>
                  <span className="text-caption text-text-tertiary" data-numeric>
                    {resource.fileType.toUpperCase()}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <Card padding="md" tone="surface" as="section" aria-labelledby="about-course-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2 id="about-course-heading" className="text-title-sm font-semibold text-text-primary">
              About this course
            </h2>
            <p className="measure mt-2 text-body-sm text-text-secondary">{course.description}</p>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
              <Stat label="Lessons" value={formatInteger(course.sections.reduce((total, section) => total + section.lessons.length, 0))} />
              <Stat label="Sections" value={formatInteger(course.sections.length)} />
              <Stat label="Duration" value={formatDurationLong(course.sections.reduce((total, section) => total + section.lessons.reduce((sum, lesson) => sum + lesson.durationSeconds, 0), 0))} />
              <Stat label="Students" value={formatCount(course.enrolledCount)} />
            </dl>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:w-56 sm:flex-col sm:items-start">
            <Avatar src={course.instructor.avatarUrl} name={course.instructor.name} size="lg" />
            <div className="min-w-0">
              <p className="clampOne text-body-sm font-semibold text-text-primary">
                {course.instructor.name}
              </p>
              <p className="clampTwo text-caption text-text-secondary">{course.instructor.title}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-caption text-text-tertiary" data-numeric>
                <Icon name="users" size={14} />
                {formatCount(course.instructor.studentsCount)} students
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-caption text-text-tertiary">{label}</dt>
      <dd className="clampOne text-body font-semibold text-text-primary" data-numeric>
        {value}
      </dd>
    </div>
  );
}