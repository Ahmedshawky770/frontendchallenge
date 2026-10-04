/**
 * Media worker — the only place in the application allowed to be slow.
 *
 * `ingest → transcode → thumbnail → publish` mirrors what an ffmpeg/sharp pipeline
 * does out of process in production; here each step is a short awaited delay so the
 * contract is observable end to end (status, progress, per-step labels) without a
 * native dependency. The important part is the *shape*: the work happens after the
 * HTTP response was already sent, and a failure is recorded on the job rather than
 * thrown at an event loop nobody is listening to.
 */

import { setTimeout as delay } from "node:timers/promises";

import { assetRepository, type MediaAsset, type MediaKind } from "@/server/repositories/assetRepository";
import { objectStorage } from "@/server/storage/objectStorage";

import { createUuid } from "@/domain/uuid";
import type { IsoDateTime } from "@/domain/types";

import type { MediaJob, MediaJobStep, MediaStepId } from "@/server/queue/mediaQueue";

/** Rendition ladder the player picks from — smallest first, as `srcset` expects. */
export const videoDerivedWidths = [640, 960, 1280] as const;
export const imageDerivedWidths = [320, 640, 1280] as const;

/** Stand-in latencies for real ffmpeg/sharp work. */
const stepDelaysMs: Record<MediaStepId, number> = {
  ingest: 120,
  transcode: 200,
  thumbnail: 80,
  publish: 60,
};

const stepProgress: Record<MediaStepId, number> = {
  ingest: 0.25,
  transcode: 0.5,
  thumbnail: 0.75,
  publish: 1,
};

function resolveKind(contentType: string): MediaKind {
  return contentType.startsWith("video/") ? "video" : "image";
}

function stepLabel(id: MediaStepId, kind: MediaKind): string {
  switch (id) {
    case "ingest":
      return "Ingest";
    case "transcode":
      return kind === "video" ? "Transcode 1080p/720p/480p" : "Resize WebP ladder";
    case "thumbnail":
      return "Generate thumbnail";
    case "publish":
      return "Publish asset";
  }
}

/** The four steps a job walks through, in order. */
export function buildMediaJobSteps(kind: MediaKind): MediaJobStep[] {
  return (["ingest", "transcode", "thumbnail", "publish"] as const).map((id) => ({
    id,
    label: stepLabel(id, kind),
    status: "pending",
  }));
}

function now(): IsoDateTime {
  return new Date().toISOString();
}

function touch(job: MediaJob, progress: number): void {
  job.progress = progress;
  job.updatedAt = now();
}

async function runStep(job: MediaJob, step: MediaJobStep): Promise<void> {
  step.status = "processing";
  touch(job, stepProgress[step.id]);

  // Unref'd so a pending job cannot hold the Node process open.
  await delay(stepDelaysMs[step.id], undefined, { ref: false });

  step.status = "completed";
  touch(job, stepProgress[step.id]);
}

function buildAsset(job: MediaJob, kind: MediaKind): MediaAsset {
  const assetId = createUuid();
  // The poster is a sibling object of the source, so it reuses the upload id as its
  // base and only changes the extension — still a uuid-derived key, never a name.
  const posterObjectKey = `${job.uploadId}.jpg`;

  return {
    id: assetId,
    uploadId: job.uploadId,
    objectKey: job.objectKey,
    kind,
    url: objectStorage.buildPublicUrl(job.objectKey),
    posterUrl: objectStorage.buildPublicUrl(posterObjectKey),
    width: kind === "video" ? 1920 : 1280,
    height: kind === "video" ? 1080 : 960,
    derivedWidths: [...(kind === "video" ? videoDerivedWidths : imageDerivedWidths)],
    byteLength: job.sizeBytes,
    createdAt: now(),
  };
}

/**
 * Runs one job to completion and records the outcome on the job itself.
 *
 * Never throws: an unexpected error is caught, the failing step is marked, and the
 * job ends as `failed` with a message the poller can show. Returns the created asset
 * on success, `null` on failure.
 */
export async function processMediaJob(job: MediaJob): Promise<MediaAsset | null> {
  const kind = resolveKind(job.contentType);
  if (job.steps.length === 0) job.steps = buildMediaJobSteps(kind);

  const [ingest, transcode, thumbnail, publish] = job.steps;
  job.status = "processing";
  touch(job, 0);

  try {
    if (ingest) await runStep(job, ingest);
    if (transcode) await runStep(job, transcode);
    if (thumbnail) await runStep(job, thumbnail);

    const asset = buildAsset(job, kind);
    if (publish) await runStep(job, publish);

    assetRepository.save(asset);
    job.assetId = asset.id;
    job.status = "completed";
    touch(job, 1);
    return asset;
  } catch (error) {
    const failingStep = job.steps.find((step) => step.status === "processing");
    if (failingStep) failingStep.status = "failed";

    job.status = "failed";
    job.error = error instanceof Error ? error.message : "Media processing failed";
    job.updatedAt = now();
    return null;
  }
}