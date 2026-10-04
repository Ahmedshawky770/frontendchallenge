/**
 * Object storage seam for the media upload pipeline.
 *
 * PRODUCTION SWAP POINT — `ObjectStorage`. In this build the app only *signs* and
 * *verifies* URLs, because no request handler is allowed to touch file bytes. In a
 * real deployment `signPutUrl` returns an S3/R2 pre-signed `PUT` URL (the AWS SDK's
 * `getSignedUrl` produces the same contract) and `buildPublicUrl` returns the
 * bucket's CDN origin. Nothing outside this file knows which adapter it got.
 *
 * Two implementations ship here:
 *  - `signedUrlSigner` — HMAC-SHA256 signing against any origin. The default.
 *  - `localObjectStorage` — dev mode: hands back `/api/uploads/<uploadId>/object`,
 *    an in-process target, so the whole pipeline is demonstrable with zero services.
 *
 * Object keys are always `<uploadId>.<ext>` — UUID-based, extension derived from the
 * declared content type. Nothing the client supplies ever becomes a path segment,
 * which is what removes path traversal (`../../etc/passwd`) as a class of bug.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import { isUuidV4 } from "@/domain/uuid";

export interface SignedUploadUrl {
  /** Absolute or root-relative target the client `PUT`s its bytes to. */
  url: string;
  /** Unix seconds the signature stops being accepted at. */
  expires: number;
  signature: string;
}

export interface ObjectStorage {
  signPutUrl(objectKey: string, contentType: string, expiresInSeconds: number): SignedUploadUrl;
  /** Never throws: an unverifiable signature is simply `false`. */
  verifySignature(objectKey: string, expires: number, signature: string): boolean;
  buildPublicUrl(objectKey: string): string;
}

const defaultSigningSecret = "dev-only-signing-secret";
const defaultRemoteOrigin = "https://storage.local";

/** Content type → extension. Only allowlisted types ever reach this map. */
const extensionByContentType: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/avif": "avif",
};

function signingSecret(): string {
  return process.env.mediaSigningSecret ?? defaultSigningSecret;
}

function remoteOrigin(): string {
  return process.env.mediaPublicBaseUrl ?? defaultRemoteOrigin;
}

function unixNow(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * The signed payload is `objectKey + ":" + expires`. The separator is not
 * cosmetic: without it `("a1", 23)` and `("a12", 3)` sign to the same digest.
 */
function computeSignature(objectKey: string, expires: number, secret: string): string {
  return createHmac("sha256", secret).update(`${objectKey}:${expires}`).digest("base64url");
}

function signatureMatches(objectKey: string, expires: number, signature: string): boolean {
  if (!Number.isFinite(expires) || expires <= unixNow()) return false;
  if (typeof signature !== "string" || signature.length === 0) return false;

  const expected = Buffer.from(computeSignature(objectKey, expires, signingSecret()), "utf8");
  const provided = Buffer.from(signature, "utf8");
  if (expected.length !== provided.length) return false;

  return timingSafeEqual(expected, provided);
}

/** `<uuid>.<ext>` — the only shape this application ever mints. */
export function buildObjectKey(uploadId: string, contentType: string): string {
  const extension = extensionByContentType[contentType] ?? "bin";
  return `${uploadId}.${extension}`;
}

/** Inverse of `buildObjectKey`, used by the local adapter to address its own route. */
export function uploadIdFromObjectKey(objectKey: string): string | null {
  const base = objectKey.split(".")[0] ?? "";
  return isUuidV4(base) ? base : null;
}

export const signedUrlSigner: ObjectStorage = {
  signPutUrl(objectKey, _contentType, expiresInSeconds) {
    const expires = unixNow() + expiresInSeconds;
    const signature = computeSignature(objectKey, expires, signingSecret());
    const url = `${remoteOrigin()}/objects/${objectKey}?expires=${expires}&signature=${signature}`;
    return { url, expires, signature };
  },
  verifySignature(objectKey, expires, signature) {
    return signatureMatches(objectKey, expires, signature);
  },
  buildPublicUrl(objectKey) {
    return `${remoteOrigin()}/objects/${objectKey}`;
  },
};

/** Dev-mode adapter: the "bucket" is a route handler in this same process. */
export const localObjectStorage: ObjectStorage = {
  signPutUrl(objectKey, _contentType, expiresInSeconds) {
    const expires = unixNow() + expiresInSeconds;
    const signature = computeSignature(objectKey, expires, signingSecret());
    const uploadId = uploadIdFromObjectKey(objectKey);
    const url = `/api/uploads/${uploadId}/object?expires=${expires}&signature=${signature}`;
    return { url, expires, signature };
  },
  verifySignature(objectKey, expires, signature) {
    return signatureMatches(objectKey, expires, signature);
  },
  buildPublicUrl(objectKey) {
    return `/api/uploads/${uploadIdFromObjectKey(objectKey) ?? "unknown"}/object/${objectKey}`;
  },
};

/**
 * The single adapter switch. `mediaStorageDriver=remote` selects the HMAC signer
 * against a real bucket; the default keeps the project runnable with no services.
 */
export const objectStorage: ObjectStorage =
  process.env.mediaStorageDriver === "remote" ? signedUrlSigner : localObjectStorage;

/** The dev object route only exists while the local adapter is selected. */
export function isLocalObjectStorageActive(): boolean {
  return objectStorage === localObjectStorage;
}