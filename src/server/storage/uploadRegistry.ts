/**
 * Registry of signed upload intents.
 *
 * Signing a `PUT` URL is only half the contract: when the client comes back to
 * `/api/uploads/complete` the server must be able to answer "what did *I* promise to
 * accept for this upload?" without trusting a single field the client sends. This is
 * that record — upload id, object key, declared type and size, expiry, signature.
 *
 * PRODUCTION SWAP POINT — a `media_upload` row in Postgres (or a Valkey key with the
 * same TTL). Keeping it server-side is also what makes the signature re-check
 * meaningful: the client cannot choose what it is measured against.
 */

export interface UploadIntent {
  uploadId: string;
  objectKey: string;
  contentType: string;
  sizeBytes: number;
  purpose: string;
  /** Unix seconds, copied from the signed URL so both sides expire together. */
  expires: number;
  signature: string;
  createdAt: string;
}

export interface UploadRegistry {
  save(intent: UploadIntent): UploadIntent;
  find(uploadId: string): UploadIntent | null;
  delete(uploadId: string): boolean;
  clear(): void;
}

/** 500 MB — the documented ceiling for a lesson video upload. */
export const maxUploadSizeBytes = 524288000;

/** 15 minutes, matching the sequence diagram in docs/system-design.md § 7.2. */
export const uploadTtlSeconds = 900;

/** Allowlist. An unlisted type is refused at signing time, before any bytes move. */
export const allowedUploadContentTypes = [
  "video/mp4",
  "video/webm",
  "image/webp",
  "image/jpeg",
  "image/png",
  "image/avif",
] as const;

export type UploadContentType = (typeof allowedUploadContentTypes)[number];

export const uploadPurposes = ["lesson-video", "lesson-poster", "course-material"] as const;

export type UploadPurpose = (typeof uploadPurposes)[number];

export function isAllowedContentType(value: string): value is UploadContentType {
  return (allowedUploadContentTypes as readonly string[]).includes(value);
}

export function isAllowedPurpose(value: string): value is UploadPurpose {
  return (uploadPurposes as readonly string[]).includes(value);
}

/** Bounded so a dev server cannot accumulate intents forever. */
const maxRetainedIntents = 200;

class MemoryUploadRegistry implements UploadRegistry {
  private readonly intents = new Map<string, UploadIntent>();

  save(intent: UploadIntent): UploadIntent {
    this.intents.delete(intent.uploadId);
    this.intents.set(intent.uploadId, intent);

    while (this.intents.size > maxRetainedIntents) {
      const oldestKey = this.intents.keys().next().value;
      if (oldestKey === undefined) break;
      this.intents.delete(oldestKey);
    }

    return intent;
  }

  find(uploadId: string): UploadIntent | null {
    return this.intents.get(uploadId) ?? null;
  }

  delete(uploadId: string): boolean {
    return this.intents.delete(uploadId);
  }

  clear(): void {
    this.intents.clear();
  }
}

export const uploadRegistry: UploadRegistry = new MemoryUploadRegistry();