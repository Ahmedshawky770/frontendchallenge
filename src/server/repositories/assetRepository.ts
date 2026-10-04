/**
 * Processed-asset store.
 *
 * One row per finished upload: the playable URL, the poster frame, and the width
 * ladder the player picks from. It is written *only* by the media worker when a job
 * completes, and read through `GET /api/uploads/[uploadId]` so the poller can show
 * real derived output instead of a spinner.
 *
 * PRODUCTION SWAP POINT — an `asset` table in Postgres keyed by uuid, with the
 * derived renditions as rows of their own. Keeping the id a uuid means the asset row
 * and its object key never have to share a naming scheme.
 */

import type { Uuid } from "@/domain/types";

export type MediaKind = "video" | "image";

export interface MediaAsset {
  id: Uuid;
  uploadId: Uuid;
  objectKey: string;
  kind: MediaKind;
  url: string;
  posterUrl: string;
  width: number;
  height: number;
  /** Rendition widths the player may request, smallest first. */
  derivedWidths: number[];
  byteLength: number;
  createdAt: string;
}

export interface AssetRepository {
  save(asset: MediaAsset): MediaAsset;
  findById(assetId: string): MediaAsset | null;
  findByUploadId(uploadId: string): MediaAsset | null;
  clear(): void;
}

class MemoryAssetRepository implements AssetRepository {
  private readonly byAssetId = new Map<string, MediaAsset>();
  private readonly assetIdByUpload = new Map<string, string>();

  save(asset: MediaAsset): MediaAsset {
    this.byAssetId.set(asset.id, asset);
    this.assetIdByUpload.set(asset.uploadId, asset.id);
    return asset;
  }

  findById(assetId: string): MediaAsset | null {
    return this.byAssetId.get(assetId) ?? null;
  }

  findByUploadId(uploadId: string): MediaAsset | null {
    const assetId = this.assetIdByUpload.get(uploadId);
    return assetId ? (this.byAssetId.get(assetId) ?? null) : null;
  }

  clear(): void {
    this.byAssetId.clear();
    this.assetIdByUpload.clear();
  }
}

export const assetRepository: AssetRepository = new MemoryAssetRepository();