/**
 * `GET /api/uploads/[uploadId]` — poll the processing job.
 *
 * The response is the whole reason the pipeline is asynchronous: status, a coarse
 * progress fraction, the individual steps so a UI can show "Transcode 1080p/720p/480p"
 * rather than a spinner, and — once the worker finishes — the asset it produced.
 * `404` means the upload was never signed or has aged out of the registry; the client
 * should restart from `POST /api/uploads`.
 */

import { errorResponse } from "../../http-adapter";

import { assetRepository } from "@/server/repositories/assetRepository";
import { mediaQueue } from "@/server/queue/mediaQueue";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/uploads/[uploadId]">,
): Promise<Response> {
  const { uploadId } = await ctx.params;

  const job = mediaQueue.getJobByUploadId(uploadId);
  if (!job) return errorResponse({ code: "not_found", message: "Unknown upload" });

  const asset = job.assetId ? assetRepository.findById(job.assetId) : null;

  return Response.json({
    uploadId: job.uploadId,
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    steps: job.steps,
    asset: asset
      ? {
          id: asset.id,
          url: asset.url,
          posterUrl: asset.posterUrl,
          width: asset.width,
          height: asset.height,
          derivedWidths: asset.derivedWidths,
        }
      : null,
    error: job.error,
  });
}