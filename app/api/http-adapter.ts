/**
 * HTTP adapters for the command layer.
 *
 * Route handlers must stay thin: parse, delegate to exactly one command or query
 * handler, map the outcome. This file owns the two bits of plumbing that every
 * endpoint repeats — the error envelope from docs/api.md and the error-code to
 * status-code mapping — so no handler invents its own status for the same failure.
 */

import type { CommandError, CommandErrorCode } from "@/server/cqrs/commands/commandResult";

const statusByErrorCode: Record<CommandErrorCode, number> = {
  validation_failed: 400,
  invalid_signature: 400,
  not_found: 404,
  conflict: 409,
  queue_saturated: 429,
  rate_limited: 429,
  internal_error: 500,
};

export function errorResponse(error: CommandError): Response {
  return Response.json({ error }, { status: statusByErrorCode[error.code] });
}

export function validationError(message: string, fields?: Record<string, string>): Response {
  return errorResponse(fields ? { code: "validation_failed", message, fields } : { code: "validation_failed", message });
}

/** Body is passed to the command handlers as `unknown` — they do their own validation. */
export async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const parsed: unknown = await request.json();
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Query params arrive as `string | string[]`; every endpoint here wants one value. */
export function readParam(params: URLSearchParams, name: string): string | undefined {
  const value = params.get(name);
  return value && value.length > 0 ? value : undefined;
}

export function readIntParam(params: URLSearchParams, name: string, fallback: number): number {
  const raw = readParam(params, name);
  if (raw === undefined) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}