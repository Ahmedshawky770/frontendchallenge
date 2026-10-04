/**
 * Cache-aside (lazy loading) helper.
 *
 * Every read in this application goes through `cacheAside`:
 *
 *     hit  -> return the cached value
 *     miss -> load once, store it with a TTL, return it
 *
 * Why not just query the repository: the leaderboard and the catalogue are read
 * on nearly every page view, they change rarely, and they are the two queries
 * most likely to saturate a connection pool. Serving them from memory removes
 * that database I/O entirely on the hot path.
 *
 * Two properties that matter under load:
 *  - **Stampede guard** — concurrent misses for the same key share a single
 *    in-flight load instead of firing N identical queries.
 *  - **Prefix invalidation** — a write can drop every key under a prefix
 *    without knowing the exact keys that were cached.
 */

import { memoryCacheStore, type CacheStore } from "./memoryCacheStore";

export interface CacheAsideOptions<T> {
  /** Logical cache namespace, e.g. "courses". */
  key: string;
  /** Time to live in seconds. */
  ttlSeconds: number;
  /** Called only on a miss. Must be side-effect free. */
  load: () => Promise<T> | T;
}

export interface CacheAsideResult<T> {
  value: T;
  /** "hit" | "miss" | "stale" — surfaced in the API response for observability. */
  source: "hit" | "miss";
  cachedAt: number;
  expiresInSeconds: number;
}

const inFlightLoads = new Map<string, Promise<{ value: unknown; cachedAt: number }>>();

export async function cacheAside<T>({
  key,
  ttlSeconds,
  load,
}: CacheAsideOptions<T>): Promise<CacheAsideResult<T>> {
  const store: CacheStore = memoryCacheStore;

  const cached = store.get<T>(key);
  if (cached) {
    return { value: cached.value, source: "hit", ...cached.meta };
  }

  // Stampede guard: the first miss starts the load, later misses wait for it.
  const pending = inFlightLoads.get(key);
  if (pending) {
    const settled = await pending;
    return {
      value: settled.value as T,
      source: "hit",
      cachedAt: settled.cachedAt,
      expiresInSeconds: ttlSeconds,
    };
  }

  const loadPromise = (async () => {
    const value = await load();
    const cachedAt = Date.now();
    store.set(key, value, ttlSeconds);
    return { value, cachedAt };
  })();

  inFlightLoads.set(key, loadPromise);

  try {
    const settled = await loadPromise;
    return {
      value: settled.value as T,
      source: "miss",
      cachedAt: settled.cachedAt,
      expiresInSeconds: ttlSeconds,
    };
  } finally {
    inFlightLoads.delete(key);
  }
}

/**
 * Drop every cache entry whose key starts with `prefix`.
 *
 * Called by command handlers after a write. Intentionally coarse: a prefix
 * invalidation costs one scan of an in-memory map and removes the class of bug
 * where a write forgets to expire exactly the right key.
 */
export function invalidatePrefix(prefix: string): void {
  memoryCacheStore.deleteByPrefix(prefix);
}

/** Test/support helper — clears state between test cases. */
export function resetCache(): void {
  memoryCacheStore.clear();
  inFlightLoads.clear();
}

/**
 * Cache TTLs. Short where the data is volatile, long where it is expensive to
 * rebuild. These are the numbers a real deployment would tune from hit-rate
 * telemetry rather than guesswork.
 */
export const cacheTtl = {
  catalogue: 120,
  courseDetail: 300,
  comments: 60,
  leaderboard: 30,
  progress: 30,
} as const;

export const cacheKeys = {
  catalogue: (category?: string, query?: string) =>
    `courses:list:${category ?? "all"}:${query ?? ""}`,
  courseDetail: (courseId: string) => `courses:detail:${courseId}`,
  courseBySlug: (slug: string) => `courses:slug:${slug}`,
  comments: (courseId: string, lessonId: string | null) =>
    `courses:${courseId}:comments:${lessonId ?? "all"}`,
  leaderboard: (courseId: string, limit: number) => `courses:${courseId}:leaderboard:${limit}`,
  progress: (courseId: string) => `courses:${courseId}:progress`,
} as const;

export const cachePrefixes = {
  course: (courseId: string) => `courses:${courseId}`,
  courseSlug: (slug: string) => `courses:slug:${slug}`,
  catalogue: () => "courses:list",
} as const;