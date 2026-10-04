import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

import type { CourseStatus } from "@/domain/types";

const statusConfig: Record<
  CourseStatus,
  { label: string; tone: "neutral" | "brand" | "success"; icon: "circle" | "play" | "checkCircle" }
> = {
  "not-started": { label: "Not started", tone: "neutral", icon: "circle" },
  "in-progress": { label: "In progress", tone: "brand", icon: "play" },
  completed: { label: "Completed", tone: "success", icon: "checkCircle" },
};

/**
 * Course status as a badge.
 *
 * Status is carried by an icon as well as a colour, so it survives greyscale and
 * is not colour-only for low-vision users.
 */
export function StatusPill({ status, className = "" }: { status: CourseStatus; className?: string }) {
  const { label, tone, icon } = statusConfig[status];

  return (
    <Badge tone={tone} className={className}>
      <Icon name={icon} size={12} />
      {label}
    </Badge>
  );
}