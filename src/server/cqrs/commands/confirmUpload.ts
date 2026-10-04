/**
 * `POST /api/uploads/complete` — hand a finished upload to the queue.
 *
 * The client says "I put the bytes at the URL you gave me". That claim is treated as
 * evidence, never as truth: the signature is re-verified against the intent recorded
 * at signing time, and the declared type and size must match what was signed. A
 * caller that lies about any of it gets `400` and no job.
 *
 * Idempotent by `uploadId`: the client retries this call on flaky networks and the
 * storage webhook can fire alongside the client, so a second call for the same upload
 * returns the job that already exists instead of enqueuing duplicate transcodes.
 * Nothing heavy happens here — the response is `202` the moment the job is queued.
 */

import { commandFail, commandOk, type CommandResult } from "./commandResult";

import { QueueBacklogFullError, mediaQueue, type MediaJob } from "@/server/queue/mediaQueue";
import { objectStorage } from "@/server/storage/objectStorage";
import { localObjectStore } from "@/server/storage/localObjectStore";
import { uploadRegistry } from "@/server/storage/uploadRegistry";
import { buildMediaJobSteps } from "@/server/workers/mediaWorker";

import { createUuid, isUuidV4 } from "@/domain/uuid";

export type ConfirmUploadStatus = "queued" | "already-queued";

export interface ConfirmUploadTicket {
  uploadId: string;
  jobId: string;
  status: ConfirmUploadStatus;
  pollUrl: string;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function confirmUpload(input: unknown): Promise<CommandResult<ConfirmUploadTicket>> {
  const body = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;

  const uploadId = readString(body.uploadId);
  if (!uploadId || !isUuidV4(uploadId)) {
    return commandFail("validation_failed", "uploadId must be a UUIDv4", {
      uploadId: "uploadId must be a UUIDv4",
    });
  }

  const intent = uploadRegistry.find(uploadId);
  if (!intent) return commandFail("not_found", `No signed upload found for ${uploadId}`);

  const declaredObjectKey = readString(body.objectKey);
  if (declaredObjectKey && declaredObjectKey !== intent.objectKey) {
    return commandFail("validation_failed", "objectKey does not match the signed upload");
  }

  // Echo the signed query params back and they are verified as issued; omit them and
  // the server-side record is used instead. Either way the comparison is made
  // against a value the client never got to choose.
  const expires = typeof body.expires === "number" ? body.expires : intent.expires;
  const signature = readString(body.signature) ?? intent.signature;
  if (!objectStorage.verifySignature(intent.objectKey, expires, signature)) {
    return commandFail("invalid_signature", "Upload signature is invalid or has expired");
  }

  const declaredContentType = readString(body.contentType);
  if (declaredContentType && declaredContentType.toLowerCase() !== intent.contentType) {
    return commandFail("validation_failed", "contentType does not match the signed upload");
  }

  const declaredSize = typeof body.sizeBytes === "number" ? body.sizeBytes : null;
  if (declaredSize !== null && declaredSize !== intent.sizeBytes) {
    return commandFail("validation_failed", "sizeBytes does not match the signed upload");
  }

  // Dev adapter only: when the bytes landed in this process the received length is a
  // server-side fact, so it can be checked instead of believed.
  const stored = localObjectStore.find(intent.objectKey);
  if (stored && stored.byteLength !== intent.sizeBytes) {
    return commandFail("validation_failed", "Uploaded bytes do not match the signed size");
  }

  const pollUrl = `/api/uploads/${uploadId}`;

  const existing = mediaQueue.getJobByUploadId(uploadId);
  if (existing) {
    return commandOk({ uploadId, jobId: existing.id, status: "already-queued", pollUrl });
  }

  const timestamp = new Date().toISOString();
  const job: MediaJob = {
    id: createUuid(),
    uploadId,
    objectKey: intent.objectKey,
    contentType: intent.contentType,
    sizeBytes: intent.sizeBytes,
    status: "queued",
    progress: 0,
    steps: buildMediaJobSteps(intent.contentType.startsWith("video/") ? "video" : "image"),
    assetId: null,
    error: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  try {
    mediaQueue.enqueue(job);
  } catch (error) {
    if (error instanceof QueueBacklogFullError) {
      return commandFail("queue_saturated", "The media queue is saturated; retry shortly");
    }
    return commandFail("internal_error", "Could not enqueue the media job");
  }

  return commandOk({ uploadId, jobId: job.id, status: "queued", pollUrl });
}