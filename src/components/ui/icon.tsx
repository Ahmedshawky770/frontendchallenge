/**
 * Inline SVG icon set.
 *
 * One component with a path registry instead of an icon package: the player
 * needs ~30 glyphs, and a dependency for 30 paths costs more bundle than the
 * whole rest of the client island. Every glyph is drawn on a 24×24 grid with a
 * 1.75 stroke so weights match across the set.
 */

export type IconName =
  | "arrowLeft"
  | "bookOpen"
  | "check"
  | "checkCircle"
  | "chevronDown"
  | "chevronLeft"
  | "chevronRight"
  | "chevronUp"
  | "clock"
  | "download"
  | "file"
  | "fileText"
  | "filter"
  | "list"
  | "lock"
  | "maximize"
  | "menu"
  | "message"
  | "minimize"
  | "minimizeSidebar"
  | "minimizeSidebarAlt"
  | "paperclip"
  | "pause"
  | "play"
  | "plus"
  | "quiz"
  | "rotate"
  | "search"
  | "settings"
  | "sparkles"
  | "star"
  | "trophy"
  | "users"
  | "volume"
  | "volumeMuted"
  | "x";

const paths: Record<IconName, string> = {
  arrowLeft: "M19 12H5m0 0 6-6m-6 6 6 6",
  bookOpen: "M12 6.5C10.5 5 8.5 4.5 6 4.5H4.5A1.5 1.5 0 0 0 3 6v12a1.5 1.5 0 0 0 1.5 1.5H6c2.5 0 4.5.5 6 2 1.5-1.5 3.5-2 6-2h1.5A1.5 1.5 0 0 0 21 18V6a1.5 1.5 0 0 0-1.5-1.5H18c-2.5 0-4.5.5-6 2Zm0 0V19.5",
  check: "m5 12.5 4.5 4.5L19 7.5",
  checkCircle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-3.5-9.2 2.5 2.5 4.5-4.6",
  chevronDown: "m6 9.5 6 6 6-6",
  chevronLeft: "m14.5 6-6 6 6 6",
  chevronRight: "m9.5 6 6 6-6 6",
  chevronUp: "m6 14.5 6-6 6 6",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13.5V12l3.5 2",
  download: "M12 3.5v11m0 0 4-4m-4 4-4-4M4.5 19.5h15",
  file: "M14 3.5H7.5A1.5 1.5 0 0 0 6 5v14a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19V7.5L14 3.5Zm0 0V7a.5.5 0 0 0 .5.5H18",
  fileText: "M14 3.5H7.5A1.5 1.5 0 0 0 6 5v14a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19V7.5L14 3.5Zm0 0V7a.5.5 0 0 0 .5.5H18M9 12.5h6M9 16h4",
  filter: "M4 6.5h16M7 12h10m-7 5.5h4",
  list: "M8.5 7h11M8.5 12h11M8.5 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01",
  lock: "M7.5 10.5V8a4.5 4.5 0 1 1 9 0v2.5M6.5 10.5h11A1.5 1.5 0 0 1 19 12v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-7a1.5 1.5 0 0 1 1.5-1.5Z",
  maximize: "M9 4.5H4.5V9M15 4.5h4.5V9M9 19.5H4.5V15m10.5 4.5h4.5V15",
  menu: "M4 7h16M4 12h16M4 17h16",
  message: "M4.5 6.5A1.5 1.5 0 0 1 6 5h12a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 18 16h-7.6L6 19.5V16h0a1.5 1.5 0 0 1-1.5-1.5v-8Z",
  minimize: "M9 9H4.5M15 9h4.5M9 15H4.5M15 15h4.5",
  minimizeSidebar: "M4 5.5h16v13H4v-13Zm10 0v13",
  minimizeSidebarAlt: "M4 5.5h16v13H4v-13Zm6 0v13",
  paperclip: "M17.5 10.5 11 17a3.5 3.5 0 0 1-5-5l6.6-6.6a2.3 2.3 0 0 1 3.3 3.3l-6.6 6.6a1.2 1.2 0 0 1-1.7-1.7l5.9-5.9",
  pause: "M9 5.5v13M15 5.5v13",
  play: "M8 5.2v13.6l11-6.8L8 5.2Z",
  plus: "M12 5v14M5 12h14",
  quiz: "M5 4.5h14v15H5v-15Zm3.5 4.5h7M8.5 13h4",
  rotate: "M4.5 12a7.5 7.5 0 1 0 2.3-5.4M4.5 4.5V9h4.5",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4 4",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7.5 7.5 0 0 0-2-1.2l-.3-2.5H10l-.3 2.5c-.7.3-1.4.7-2 1.2l-2.3-1-2 3.4 2 1.5a7.4 7.4 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1c.6.5 1.3.9 2 1.2l.3 2.5h3.9l.3-2.5c.7-.3 1.4-.7 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z",
  sparkles: "M12 4.5 13.4 9l4.6 1.4-4.6 1.4L12 16.5l-1.4-4.7L6 10.4 10.6 9 12 4.5ZM18 15l.7 2.3 2.3.7-2.3.7L18 21l-.7-2.3-2.3-.7 2.3-.7L18 15Z",
  star: "m12 4.5 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4-3.9-3.8 5.4-.8L12 4.5Z",
  trophy: "M7 4.5h10v4a5 5 0 0 1-10 0v-4Zm0 1.5H4.5v1A3.5 3.5 0 0 0 8 10.5m9-4.5h2.5v1a3.5 3.5 0 0 1-3.5 3.5M12 13.5v3.5m-3.5 2.5h7M9.5 19.5h5v-2.5h-5v2.5Z",
  users: "M15.5 19.5v-1.5a3.5 3.5 0 0 0-3.5-3.5H7a3.5 3.5 0 0 0-3.5 3.5v1.5M9.5 11a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Zm11 8.5v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.5 4.6a3.25 3.25 0 0 1 0 6.3",
  volume: "M4.5 9.5h3l4-3.5v12l-4-3.5h-3v-5Zm10-1a4.5 4.5 0 0 1 0 7m2.5-9.5a8 8 0 0 1 0 12",
  volumeMuted: "M4.5 9.5h3l4-3.5v12l-4-3.5h-3v-5ZM15 10l4.5 4.5m0-4.5L15 14.5",
  x: "M6 6l12 12M18 6 6 18",
};

export interface IconProps {
  name: IconName;
  /** Pixel size of the square viewport. Defaults to 20. */
  size?: number;
  className?: string;
  /** Provide a label to expose the icon to assistive tech; omit for decorative use. */
  title?: string;
}

export function Icon({ name, size = 20, className, title }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
      className={className}
    >
      {title ? <title>{title}</title> : null}
      <path d={paths[name]} />
    </svg>
  );
}