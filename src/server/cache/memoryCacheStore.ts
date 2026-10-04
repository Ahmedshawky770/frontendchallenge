/**
 * In-process TTL + LRU cache store.
 *
 * This is the seam a production deployment replaces with Valkey (or Redis). It
 * keeps the interface identical — `get`, `set`, `deleteByPrefix`, `clear` — so
 * swapping the implementation touches exactly one file.
 *
 * It is bounded on purpose. A long-running dev server, or a Node process that
 * leaks a cache entry per query string, must not grow without limit; the store
 * evicts the least recently used entry once `maxEntries` is reached.
 */

export interface CacheEntryMeta {
  cachedAt: number;
  expiresInSeconds: number;
}

interface CacheEntry {
  value: unknown;
  expiresAtMs: number;
  cachedAt: number;
  expiresInSeconds: number;
}

export interface CacheStore {
  get<T>(key: string): { value: T; meta: CacheEntryMeta } | null;
  set(key: string, value: unknown, ttlSeconds: number): void;
  deleteByPrefix(prefix: string): number;
  clear(): void;
  get size(): number;
}

class MemoryCacheStore implements CacheStore {
  private readonly entries = new Map<string, CacheEntry>();

  constructor(private readonly maxEntries: number) {}

  get<T>(key: string): { value: T; meta: CacheEntryMeta } | null {
    const entry = this.entries.get(key);
    if (!entry) return null;

    if (entry.expiresAtMs <= Date.now()) {
      this.entries.delete(key);
      return null;
    }

    // Refresh recency: re-inserting moves the key to the end of the Map's
    // insertion order, which is what `maxEntries` eviction relies on.
    this.entries.delete(key);
    this.entries.set(key, entry);

    return {
      value: entry.value as T,
      meta: { cachedAt: entry.cachedAt, expiresInSeconds: entry.expiresInSeconds },
    };
  }

  set(key: string, value: unknown, ttlSeconds: number): void {
    if (this.entries.has(key)) this.entries.delete(key);

    this.entries.set(key, {
      value,
      cachedAt: Date.now(),
      expiresAtMs: Date.now() + ttlSeconds * 1000,
      expiresInSeconds: ttlSeconds,
    });

    while (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey === undefined) break;
      this.entries.delete(oldestKey);
    }
  }

  deleteByPrefix(prefix: string): number {
    let removed = 0;
    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) {
        this.entries.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}

export const memoryCacheStore: CacheStore = new MemoryCacheStore(500);