/**
 * `POST /api/uploads` — `202 Accepted` with a pre-signed upload target.
 *
 * The handler signs and returns; it never reads a body of file bytes. `202` rather
 * than `201` because nothing has been created yet — the upload is authorised, and the
 * bytes do not exist until the client performs the `PUT`.
 */

import { errorResponse, readJsonBody, validationError } from "../http-adapter";

import { issueUploadUrl } from "@/server/cqrs/commands/issueUploadUrl";

export async function POST(request: Request): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body) return validationError("Request body must be a JSON object");

  const result = await issueUploadUrl(body);
  if (!result.ok) return errorResponse(result.error);

  return Response.json(result.data, { status: 202 });
}