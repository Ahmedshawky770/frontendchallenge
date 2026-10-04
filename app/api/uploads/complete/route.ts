/**
 * `POST /api/uploads/complete` — `202 Accepted`, the upload is now a queued job.
 *
 * Called by the client after its `PUT` and by the storage webhook. Because both can
 * fire, the command is idempotent per `uploadId`: the second caller gets the existing
 * job back instead of a duplicate transcode.
 */

import { errorResponse, readJsonBody, validationError } from "../../http-adapter";

import { confirmUpload } from "@/server/cqrs/commands/confirmUpload";

export async function POST(request: Request): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body) return validationError("Request body must be a JSON object");

  const result = await confirmUpload(body);
  if (!result.ok) return errorResponse(result.error);

  return Response.json(result.data, { status: 202 });
}