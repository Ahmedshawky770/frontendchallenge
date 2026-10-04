# HTTP / Internal API Contract

Two surfaces, one implementation.

* **Route handlers** (`app/api/**`) — the public HTTP contract. Also the only way to reach the
  upload pipeline, because the browser uploads bytes straight to object storage and the storage
  service calls back over public HTTP.
* **Server Actions** (`src/actions/**`) — same command/query handlers, called from the UI for a
  single round-trip with no manual cache handling.

Conventions
- `Content-Type: application/json` on every response.
- Errors: `{ "error": { "code": string, "message": string, "fields"?: Record<string,string> } }`.
- Every id is a UUIDv4 string. Every timestamp is ISO-8601 UTC.
- Success = `2xx`. Validation failure = `400`. Not found = `404`. Conflict = `409`.

---

## 1. Courses

### `GET /api/courses`

Query parameters
| Name | Type | Notes |
| --- | --- | --- |
| `category` | `CourseCategory` | optional filter |
| `q` | string | optional title/instructor search |
| `status` | `not-started` \| `in-progress` \| `completed` | optional filter |

`200` — catalogue read model (cached, cache-aside, TTL 120 s)

```json
{
  "courses": [
    {
      "id": "3f2a…", "slug": "advanced-typescript-patterns",
      "title": "Advanced TypeScript Patterns",
      "subtitle": "…", "category": "engineering", "level": "advanced",
      "instructor": { "id": "…", "name": "…", "avatarUrl": "/avatars/…", "headline": "…" },
      "posterUrl": "/course-art/…webp", "posterBlurDataUrl": "data:image/webp;base64,…",
      "rating": 4.8, "ratingCount": 3120, "enrolledCount": 18422,
      "lessonCount": 42, "totalDurationSeconds": 23160,
      "progressPercent": 38, "status": "in-progress", "lastLessonId": "…"
    }
  ],
  "total": 6,
  "generatedAt": "2026-03-04T10:12:00.000Z"
}
```

### `GET /api/courses/[courseId]`

`200` — full course detail: sections → lessons → resources, materials, enrollment progress.
Cache-aside, TTL 300 s. `404` when unknown.

---

## 2. Progress

### `GET /api/courses/[courseId]/progress`

```json
{ "courseId": "…", "completedLessonIds": ["…"], "lastLessonId": "…",
  "completedLessons": 16, "totalLessons": 42, "progressPercent": 38, "status": "in-progress" }
```

### `PATCH /api/courses/[courseId]/progress`

```json
// request
{ "action": "complete" | "uncomplete", "lessonId": "uuidv4" }
// or
{ "action": "setLastLesson", "lessonId": "uuidv4" }
```

`200` — the recomputed progress read model.
`400` — unknown action / malformed lesson id · `404` — unknown course or lesson · `409` — lesson
does not belong to the course.

Side effect: invalidates `progress:{courseId}` and `courses:{courseId}` cache prefixes.

---

## 3. Comments (CQRS split)

### `GET /api/courses/[courseId]/comments`

Query: `lessonId` (optional) · `sort` = `newest` | `helpful`
`200` — `{ "comments": CourseComment[] }`, newest first. Cache-aside, TTL 60 s.

### `POST /api/courses/[courseId]/comments`

```json
{ "lessonId": "uuidv4" | null, "body": "string (1..2000)" }
```

`201` `{ "comment": CourseComment }` — server assigns `id`, `createdAt`, author from session.
`400` empty/over-long body · `404` unknown course/lesson.

### `PATCH /api/courses/[courseId]/comments/[commentId]`

```json
{ "action": "toggleHelpful" }
```

`200` `{ "comment": CourseComment }` · `404` unknown comment.

---

## 4. Leaderboard

### `GET /api/courses/[courseId]/leaderboard`

Query: `limit` (default 5, max 50)
`200` — `{ "entries": LeaderboardEntry[] }`. TTL 30 s (most volatile read).
`404` unknown course.

---

## 5. Upload pipeline (asynchronous)

### `POST /api/uploads` → `202 Accepted`

Issues a pre-signed direct-upload target. File bytes **never** pass through the Next server.

```json
// request
{ "fileName": "lesson-04.mp4", "contentType": "video/mp4", "sizeBytes": 104857600,
  "purpose": "lesson-video" }

// 202
{ "uploadId": "uuidv4",
  "method": "PUT",
  "uploadUrl": "https://storage.local/objects/<uuidv4>?expires=…&signature=…",
  "headers": { "Content-Type": "video/mp4" },
  "expiresAt": "2026-03-04T10:27:00.000Z",
  "maxSizeBytes": 524288000,
  "statusUrl": "/api/uploads/<uploadId>" }
```

`400` unsupported `contentType` / `sizeBytes` over `maxSizeBytes` · `401` unauthenticated.

### `POST /api/uploads/complete` → `202 Accepted`

Called by the client after a successful `PUT`, and by the storage webhook. Re-verifies the
signature — the client is not trusted.

```json
// request
{ "uploadId": "uuidv4", "objectKey": "<uuidv4>", "etag": "…", "checksum": "…" }

// 202
{ "uploadId": "…", "jobId": "uuidv4", "status": "queued", "pollUrl": "/api/uploads/<uploadId>" }
```

Idempotent: a repeated call for the same `uploadId` returns the existing `jobId` with `200`
instead of enqueuing a duplicate.
`400` signature invalid / size or type mismatch · `404` unknown upload · `409` already complete.

### `GET /api/uploads/[uploadId]`

`200`

```json
{ "uploadId": "…", "jobId": "…",
  "status": "queued" | "processing" | "completed" | "failed",
  "progress": 0.4,
  "steps": [ { "id": "ingest", "label": "Ingest", "status": "completed" },
             { "id": "transcode", "label": "Transcode 1080p/720p/480p", "status": "processing" },
             { "id": "thumbnail", "label": "Generate thumbnail", "status": "pending" } ],
  "asset": { "id": "…", "url": "…", "posterUrl": "…", "width": 1920, "height": 1080,
             "derivedWidths": [640, 960, 1280] },
  "error": null }
```

---

## 6. Client status codes used

| Status | Meaning in this app |
| --- | --- |
| `200` | read succeeded, or idempotent no-op |
| `201` | comment created |
| `202` | upload signed / processing queued |
| `400` | validation failure |
| `404` | unknown route entity |
| `409` | state conflict (wrong course, already complete) |
| `429` | rate limited (upload signing only) |