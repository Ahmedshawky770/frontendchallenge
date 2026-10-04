/**
 * `POST /api/uploads` — issue a pre-signed direct-upload target.
 *
 * The client asks "where do I put these bytes?", the server answers with a signed
 * URL and an expiry, and then gets out of the way: the payload goes straight to
 * object storage, so a 500 MB lesson video never occupies a Node request handler.
 * `202 Accepted` is the honest status — the upload is queued to happen, not created.
 *
 * Rate limiting is deliberately **not** implemented here. There is no session or
 * client identity in this build to key a window on, and a wrong key (per IP behind a
 * NAT or per anonymous caller) produces 429s for legitimate uploads, which is worse
 * than the abuse it prevents. docs/api.md lists `429` for this endpoint; when auth
 * lands, add the sliding window in front of this handler and map it to
 * `commandFail("rate_limited", ...)`.
 */

import { commandFail, commandOk, type CommandResult } from "./commandResult";

import { buildObjectKey, objectStorage } from "@/server/storage/objectStorage";
import {
  isAllowedContentType,
  isAllowedPurpose,
  maxUploadSizeBytes,
  uploadRegistry,
  uploadTtlSeconds,
} from "@/server/storage/uploadRegistry";

import { createUuid } from "@/domain/uuid";

export interface UploadTicket {
  uploadId: string;
  method: "PUT";
  uploadUrl: string;
  /** The client must send exactly these headers on the `PUT` or storage rejects it. */
  headers: Record<string, string>;
  expiresAt: string;
  maxSizeBytes: number;
  statusUrl: string;
}

const maxFileNameLength = 200;

export async function issueUploadUrl(input: unknown): Promise<CommandResult<UploadTicket>> {
  const body = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;

  const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
  const contentType = typeof body.contentType === "string" ? body.contentType.trim().toLowerCase() : "";
  const purpose = typeof body.purpose === "string" ? body.purpose.trim() : "";
  const sizeBytes = typeof body.sizeBytes === "number" ? body.sizeBytes : Number.NaN;

  const fields: Record<string, string> = {};
  if (fileName.length === 0 || fileName.length > maxFileNameLength) {
    fields.fileName = `fileName must be 1-${maxFileNameLength} characters`;
  }
  if (!isAllowedContentType(contentType)) {
    fields.contentType = `contentType must be one of the supported media types`;
  }
  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
    fields.sizeBytes = "sizeBytes must be a positive integer";
  } else if (sizeBytes > maxUploadSizeBytes) {
    fields.sizeBytes = `sizeBytes must not exceed ${maxUploadSizeBytes}`;
  }
  if (!isAllowedPurpose(purpose)) {
    fields.purpose = `purpose must be one of lesson-video, lesson-poster, course-material`;
  }

  if (Object.keys(fields).length > 0) {
    return commandFail("validation_failed", "Upload request is not valid", fields);
  }

  // The file name never reaches the object key: the key is the upload id plus an
  // extension derived from the declared type, so a crafted name cannot traverse.
  const uploadId = createUuid();
  const objectKey = buildObjectKey(uploadId, contentType);
  const signed = objectStorage.signPutUrl(objectKey, contentType, uploadTtlSeconds);

  uploadRegistry.save({
    uploadId,
    objectKey,
    contentType,
    sizeBytes,
    purpose,
    expires: signed.expires,
    signature: signed.signature,
    createdAt: new Date().toISOString(),
  });

  return commandOk({
    uploadId,
    method: "PUT",
    uploadUrl: signed.url,
    headers: { "Content-Type": contentType },
    expiresAt: new Date(signed.expires * 1000).toISOString(),
    maxSizeBytes: maxUploadSizeBytes,
    statusUrl: `/api/uploads/${uploadId}`,
  });
}