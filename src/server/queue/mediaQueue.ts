/**
 * Media job queue.
 *
 * The pipeline never runs heavy work inside a request: `/api/uploads/complete`
 * only enqueues, and this queue drains on its own schedule. Two properties matter:
 *
 *  - **Bounded concurrency.** Transcoding is CPU- and memory-hungry. The pool runs at
 *    most `concurrency` jobs (default 2) and parks the rest, instead of the unbounded
 *    `for (job of jobs) await process(job)` that melts the box under load.
 *  - **Bounded backlog.** Past `maxBacklog` waiting jobs, `enqueue` refuses. A loud
 *    429 beats an unbounded memory growth.
 *
 * PRODUCTION SWAP POINT — `mediaQueue`. BullMQ on Valkey drops in behind this exact
 * interface (`queue.add`, a worker with `concurrency`, `job.getState`), which is why
 * the signature here is `enqueue`/`getJob` shaped rather than "run this callback".
 */

import { setTimeout as delay } from "node:timers/promises";

import { processMediaJob } from "@/server/workers/mediaWorker";

import type { Uuid } from "@/domain/types";

export type MediaJobStatus = "queued" | "processing" | "completed" | "failed";

export type MediaStepId = "ingest" | "transcode" | "thumbnail" | "publish";

export type MediaStepStatus = "pending" | "processing" | "completed" | "failed";

export interface MediaJobStep {
  id: MediaStepId;
  label: string;
  status: MediaStepStatus;
}

export interface MediaJob {
  id: Uuid;
  uploadId: Uuid;
  objectKey: string;
  contentType: string;
  sizeBytes: number;
  status: MediaJobStatus;
  /** 0..1, surfaced so the client can render a determinate progress bar. */
  progress: number;
  steps: MediaJobStep[];
  assetId: Uuid | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaQueue {
  /** Throws `QueueBacklogFullError` when the backlog is saturated. */
  enqueue(job: MediaJob): void;
  getJobByUploadId(uploadId: string): MediaJob | null;
  getJobById(jobId: string): MediaJob | null;
  setConcurrency(concurrency: number): void;
  /** Total jobs tracked, in every state. */
  size(): number;
}

export const defaultWorkerConcurrency = 2;
export const defaultMaxBacklog = 100;

export class QueueBacklogFullError extends Error {
  constructor(limit: number) {
    super(`Media queue backlog is full (limit ${limit} queued jobs)`);
    this.name = "QueueBacklogFullError";
  }
}

/**
 * The job record is the queue's live handle: the worker mutates the same object the
 * queue holds, so a poll always sees the current step without a copy-on-write dance.
 */
class MemoryMediaQueue implements MediaQueue {
  private readonly jobsById = new Map<string, MediaJob>();
  private readonly jobIdByUploadId = new Map<string, string>();
  private readonly backlog: string[] = [];

  private activeCount = 0;
  private drainScheduled = false;

  constructor(
    private concurrency: number = defaultWorkerConcurrency,
    private readonly maxBacklog: number = defaultMaxBacklog,
  ) {}

  enqueue(job: MediaJob): void {
    if (this.jobsById.has(job.id)) return;
    if (this.backlog.length >= this.maxBacklog) throw new QueueBacklogFullError(this.maxBacklog);

    this.jobsById.set(job.id, job);
    this.jobIdByUploadId.set(job.uploadId, job.id);
    this.backlog.push(job.id);
    this.scheduleDrain();
  }

  getJobByUploadId(uploadId: string): MediaJob | null {
    const jobId = this.jobIdByUploadId.get(uploadId);
    return jobId ? (this.jobsById.get(jobId) ?? null) : null;
  }

  getJobById(jobId: string): MediaJob | null {
    return this.jobsById.get(jobId) ?? null;
  }

  setConcurrency(concurrency: number): void {
    this.concurrency = Math.max(1, Math.floor(concurrency));
    this.scheduleDrain();
  }

  size(): number {
    return this.jobsById.size;
  }

  /** Unref'd timers: a warm queue must never be the reason a Node process lingers. */
  private scheduleDrain(): void {
    if (this.drainScheduled) return;
    this.drainScheduled = true;

    void delay(0, undefined, { ref: false }).then(() => {
      this.drainScheduled = false;
      this.drain();
    });
  }

  private drain(): void {
    while (this.activeCount < this.concurrency && this.backlog.length > 0) {
      const jobId = this.backlog.shift();
      const job = jobId ? this.jobsById.get(jobId) : undefined;
      if (!job) continue;

      this.activeCount += 1;
      void processMediaJob(job)
        .catch(() => {
          // processMediaJob records its own failures; this guard only keeps a broken
          // worker from stalling the pool's active-count accounting.
        })
        .finally(() => {
          this.activeCount -= 1;
          this.scheduleDrain();
        });
    }
  }
}

export const mediaQueue: MediaQueue = new MemoryMediaQueue();