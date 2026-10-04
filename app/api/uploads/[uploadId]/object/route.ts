/**
 * `PUT`/`DELETE /api/uploads/[uploadId]/object` — the dev-mode bucket.
 *
 * This route exists only so the pipeline is demonstrable with zero services: when the
 * local adapter is active, the signed "upload URL" points back here. It is the one
 * place where bytes touch the Node process, and it does the absolute minimum with
 * them — it reads the payload to learn its length, then discards it and keeps only
 * metadata. In production this endpoint does not exist; the browser talks to S3/R2.
 *
 * Guards, in order: the adapter must still be the local one, the signature must
 * verify, the declared content type must match what was signed, and the payload must
 * not exceed the size that was signed.
 */

import { etagFor, localObjectStore } from "@/server/storage/localObjectStore";
import { isLocalObjectStorageActive, objectStorage } from "@/server/storage/objectStorage";
import { maxUploadSizeBytes, uploadRegistry } from "@/server/storage/uploadRegistry";

function forbidden(message: string): Response {
  return Response.json({ error: { code: "invalid_signature", message } }, { status: 403 });
}

export async function PUT(request: Request, ctx: RouteContext<"/api/uploads/[uploadId]/object">): Promise<Response> {
  if (!isLocalObjectStorageActive()) {
    return Response.json({ error: { code: "not_found", message: "Unknown route" } }, { status: 404 });
  }

  const { uploadId } = await ctx.params;
  const { searchParams } = new URL(request.url);

  const intent = uploadRegistry.find(uploadId);
  if (!intent) {
    return Response.json({ error: { code: "not_found", message: "Unknown upload" } }, { status: 404 });
  }

  const expires = Number.parseInt(searchParams.get("expires") ?? "", 10);
  const signature = searchParams.get("signature") ?? "";
  if (!objectStorage.verifySignature(intent.objectKey, expires, signature)) {
    return forbidden("Upload signature is invalid or has expired");
  }

  const declaredType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (declaredType && declaredType !== intent.contentType) {
    return Response.json(
      { error: { code: "validation_failed", message: "Content-Type does not match the signed upload" } },
      { status: 400 },
    );
  }

  const byteLength = (await request.arrayBuffer()).byteLength;
  if (byteLength > intent.sizeBytes || byteLength > maxUploadSizeBytes) {
    return Response.json(
      { error: { code: "validation_failed", message: "Payload exceeds the signed size" } },
      { status: 413 },
    );
  }

  const etag = etagFor(intent.objectKey, byteLength);
  localObjectStore.put({
    objectKey: intent.objectKey,
    byteLength,
    contentType: intent.contentType,
    etag,
    receivedAt: new Date().toISOString(),
  });

  return Response.json(
    { uploadId, objectKey: intent.objectKey, byteLength, etag },
    { status: 200, headers: { ETag: etag } },
  );
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/uploads/[uploadId]/object">,
): Promise<Response> {
  if (!isLocalObjectStorageActive()) {
    return Response.json({ error: { code: "not_found", message: "Unknown route" } }, { status: 404 });
  }

  const { uploadId } = await ctx.params;
  const intent = uploadRegistry.find(uploadId);
  if (intent) localObjectStore.delete(intent.objectKey);
  uploadRegistry.delete(uploadId);

  return new Response(null, { status: 204 });
}