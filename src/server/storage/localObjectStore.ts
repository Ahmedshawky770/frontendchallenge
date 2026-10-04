/**
 * Dev-mode stand-in for the bucket.
 *
 * It records *metadata only* — byte length, etag, declared content type — never the
 * payload. That is the whole point of the upload pipeline: the app must be able to
 * validate a completed upload (size, type) without ever holding the bytes. In
 * production this file disappears and the real storage service answers those
 * questions through a `HEAD` call on the object key.
 *
 * PRODUCTION SWAP POINT — replaced by S3/R2 `HeadObject`.
 */

import { createHash } from "node:crypto";

export interface StoredObject {
  objectKey: string;
  byteLength: number;
  contentType: string;
  etag: string;
  receivedAt: string;
}

export interface LocalObjectStore {
  put(object: StoredObject): StoredObject;
  find(objectKey: string): StoredObject | null;
  delete(objectKey: string): boolean;
  clear(): void;
}

/** Keeps a dev server from accumulating entries for every manual upload attempt. */
const maxRetainedObjects = 50;

function computeEtag(objectKey: string, byteLength: number): string {
  return `"${createHash("sha256")
    .update(`${objectKey}:${byteLength}`)
    .digest("hex")
    .slice(0, 32)}"`;
}

class MemoryLocalObjectStore implements LocalObjectStore {
  private readonly objects = new Map<string, StoredObject>();

  put(object: StoredObject): StoredObject {
    this.objects.delete(object.objectKey);
    this.objects.set(object.objectKey, object);

    while (this.objects.size > maxRetainedObjects) {
      const oldestKey = this.objects.keys().next().value;
      if (oldestKey === undefined) break;
      this.objects.delete(oldestKey);
    }

    return object;
  }

  find(objectKey: string): StoredObject | null {
    return this.objects.get(objectKey) ?? null;
  }

  delete(objectKey: string): boolean {
    return this.objects.delete(objectKey);
  }

  clear(): void {
    this.objects.clear();
  }
}

export const localObjectStore: LocalObjectStore = new MemoryLocalObjectStore();

/** Exported so the dev object route derives the same etag it returns as a header. */
export function etagFor(objectKey: string, byteLength: number): string {
  return computeEtag(objectKey, byteLength);
}