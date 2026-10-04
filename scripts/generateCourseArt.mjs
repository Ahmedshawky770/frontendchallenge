/**
 * Course artwork build pipeline.
 *
 * Run once with `node scripts/generateCourseArt.mjs`.
 *
 * Why generated instead of downloaded:
 *  - the app must render identically with zero network access;
 *  - every asset lands at the exact dimensions the UI reserves, so nothing is
 *    downloaded twice and no layout shifts while images decode;
 *  - WebP at quality 72 keeps each poster around 30–60 kB, and a 20 px LQIP is
 *    inlined as base64 so the first paint is never blocked by an image.
 *
 * Output:
 *   public/course-art/posters/<slug>-1280.webp   course + lesson poster
 *   public/course-art/avatars/<id>.webp          profile avatars
 *   src/data/courseArt.generated.ts             manifest (paths + LQIP data urls)
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const posterDirectory = join(projectRoot, "public", "course-art", "posters");
const avatarDirectory = join(projectRoot, "public", "course-art", "avatars");
const manifestPath = join(projectRoot, "src", "data", "courseArt.generated.ts");

const POSTER_WIDTH = 1280;
const POSTER_HEIGHT = 720;
const POSTER_QUALITY = 72;
const AVATAR_SIZE = 128;
const AVATAR_QUALITY = 78;
const LQIP_WIDTH = 24;

/** Deterministic pseudo-random generator so re-running the script is a no-op. */
function seeded(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function posterArtwork({ from, to, accent, seed }) {
  const random = seeded(seed);
  const blobs = [];
  const rings = [];

  for (let index = 0; index < 7; index += 1) {
    const cx = 120 + random() * (POSTER_WIDTH - 240);
    const cy = 80 + random() * (POSTER_HEIGHT - 160);
    const radius = 60 + random() * 220;
    const opacity = (0.06 + random() * 0.16).toFixed(3);
    blobs.push(
      `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${radius.toFixed(1)}" fill="url(#soft${index % 3})" opacity="${opacity}"/>`,
    );
  }

  for (let index = 0; index < 5; index += 1) {
    const cx = 200 + random() * (POSTER_WIDTH - 400);
    const cy = 100 + random() * (POSTER_HEIGHT - 200);
    const radius = 90 + random() * 260;
    rings.push(
      `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${radius.toFixed(1)}" fill="none" stroke="${accent}" stroke-opacity="0.16" stroke-width="1.5"/>`,
    );
  }

  const gridLines = [];
  for (let x = 0; x <= POSTER_WIDTH; x += 80) {
    gridLines.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="${POSTER_HEIGHT}" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>`,
    );
  }
  for (let y = 0; y <= POSTER_HEIGHT; y += 80) {
    gridLines.push(
      `<line x1="0" y1="${y}" x2="${POSTER_WIDTH}" y2="${y}" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>`,
    );
  }

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" viewBox="0 0 ${POSTER_WIDTH} ${POSTER_HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="soft0" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="soft1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="soft2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="45%" stop-color="#ffffff" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" fill="url(#bg)"/>
  ${gridLines.join("")}
  ${blobs.join("")}
  ${rings.join("")}
  <rect width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" fill="url(#sheen)"/>
</svg>`);
}

function avatarArtwork({ from, to, seed }) {
  const random = seeded(seed);
  const shapes = [];
  for (let index = 0; index < 4; index += 1) {
    const cx = random() * AVATAR_SIZE;
    const cy = random() * AVATAR_SIZE;
    const radius = 14 + random() * 46;
    shapes.push(
      `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${radius.toFixed(1)}" fill="#ffffff" fill-opacity="${(0.08 + random() * 0.14).toFixed(3)}"/>`,
    );
  }
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${AVATAR_SIZE}" height="${AVATAR_SIZE}" viewBox="0 0 ${AVATAR_SIZE} ${AVATAR_SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="${AVATAR_SIZE}" height="${AVATAR_SIZE}" fill="url(#bg)"/>
  ${shapes.join("")}
</svg>`);
}

async function writeWebp(svg, width, height, quality, destination) {
  await sharp(svg, { density: 96 })
    .resize(width, height, { fit: "cover" })
    .webp({ quality, effort: 6 })
    .toFile(destination);
}

async function buildLqip(destination, width) {
  const buffer = await sharp(destination)
    .resize(width, Math.round((width * 9) / 16))
    .webp({ quality: 24, effort: 6 })
    .toBuffer();
  return `data:image/webp;base64,${buffer.toString("base64")}`;
}

async function buildAvatarLqip(destination, width = 12) {
  const buffer = await sharp(destination).resize(width, width).webp({ quality: 24 }).toBuffer();
  return `data:image/webp;base64,${buffer.toString("base64")}`;
}

const posters = [
  { slug: "advanced-typescript-patterns", from: "#1e1b4b", to: "#4338ca", accent: "#a5b4fc", seed: 101 },
  { slug: "design-systems-in-practice", from: "#0f172a", to: "#0e7490", accent: "#67e8f9", seed: 202 },
  { slug: "applied-machine-learning", from: "#052e16", to: "#047857", accent: "#6ee7b7", seed: 303 },
  { slug: "growth-analytics-funnel", from: "#431407", to: "#c2410c", accent: "#fdba74", seed: 404 },
  { slug: "product-strategy-masterclass", from: "#4a044e", to: "#a21caf", accent: "#f0abfc", seed: 505 },
  { slug: "cloud-security-hardening", from: "#450a0a", to: "#b91c1c", accent: "#fca5a5", seed: 606 },
];

const avatars = [
  { name: "layla-haddad", from: "#4338ca", to: "#7c3aed", seed: 11 },
  { name: "omar-nasser", from: "#0e7490", to: "#0891b2", seed: 22 },
  { name: "sara-mansour", from: "#047857", to: "#059669", seed: 33 },
  { name: "youssef-adel", from: "#c2410c", to: "#ea580c", seed: 44 },
  { name: "nour-el-sayed", from: "#a21caf", to: "#db2777", seed: 55 },
  { name: "karim-fathy", from: "#b45309", to: "#d97706", seed: 66 },
  { name: "hana-mostafa", from: "#0369a1", to: "#0284c7", seed: 77 },
  { name: "tarek-ibrahim", from: "#4338ca", to: "#2563eb", seed: 88 },
  { name: "mai-akhtar", from: "#9d174d", to: "#db2777", seed: 99 },
  { name: "ziad-ramadan", from: "#164e63", to: "#0891b2", seed: 110 },
  { name: "dina-shalaby", from: "#3f6212", to: "#65a30d", seed: 121 },
  { name: "bilal-omar", from: "#7c2d12", to: "#ea580c", seed: 132 },
];

async function main() {
  await mkdir(posterDirectory, { recursive: true });
  await mkdir(avatarDirectory, { recursive: true });
  await mkdir(dirname(manifestPath), { recursive: true });

  const posterEntries = [];
  for (const poster of posters) {
    const fileName = `${poster.slug}-1280.webp`;
    const destination = join(posterDirectory, fileName);
    await writeWebp(
      posterArtwork(poster),
      POSTER_WIDTH,
      POSTER_HEIGHT,
      POSTER_QUALITY,
      destination,
    );
    posterEntries.push({
      slug: poster.slug,
      url: `/course-art/posters/${fileName}`,
      blurDataUrl: await buildLqip(destination, LQIP_WIDTH),
    });
  }

  const avatarEntries = [];
  for (const avatar of avatars) {
    const fileName = `${avatar.name}.webp`;
    const destination = join(avatarDirectory, fileName);
    await writeWebp(
      avatarArtwork(avatar),
      AVATAR_SIZE,
      AVATAR_SIZE,
      AVATAR_QUALITY,
      destination,
    );
    avatarEntries.push({
      name: avatar.name,
      url: `/course-art/avatars/${fileName}`,
      blurDataUrl: await buildAvatarLqip(destination),
    });
  }

  const manifest = `/**
 * GENERATED FILE — do not edit by hand.
 * Produced by scripts/generateCourseArt.mjs. Run \`node scripts/generateCourseArt.mjs\`
 * to regenerate after changing the artwork palette.
 */

export interface PosterAsset {
  slug: string;
  url: string;
  blurDataUrl: string;
}

export interface AvatarAsset {
  name: string;
  url: string;
  blurDataUrl: string;
}

export const posterAssets: PosterAsset[] = ${JSON.stringify(posterEntries, null, 2)};

export const avatarAssets: AvatarAsset[] = ${JSON.stringify(avatarEntries, null, 2)};

export function posterFor(slug: string): PosterAsset {
  const asset = posterAssets.find((entry) => entry.slug === slug);
  if (!asset) throw new Error(\`Unknown poster: \${slug}\`);
  return asset;
}

export function avatarFor(name: string): AvatarAsset {
  const asset = avatarAssets.find((entry) => entry.name === name);
  if (!asset) throw new Error(\`Unknown avatar: \${name}\`);
  return asset;
}
`;

  await writeFile(manifestPath, manifest, "utf8");

  const sizes = posterEntries
    .map((entry) => `  ${entry.url}`)
    .join("\n");
  process.stdout.write(`Generated ${posterEntries.length} posters and ${avatarEntries.length} avatars.\n${sizes}\n`);
}

await main();