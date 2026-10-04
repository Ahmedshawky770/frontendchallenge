/**
 * Command result envelope.
 *
 * A command never throws for an expected failure. Validation, "not found", "wrong
 * course" and "queue is full" are all *results*, not exceptions, because the caller
 * has to turn them into a status code anyway — and an exception that escapes a route
 * handler becomes an opaque 500 with no field-level detail for the client to show.
 */

export type CommandErrorCode =
  | "validation_failed"
  | "invalid_signature"
  | "not_found"
  | "conflict"
  | "queue_saturated"
  | "rate_limited"
  | "internal_error";

export interface CommandError {
  code: CommandErrorCode;
  message: string;
  /** Per-field messages, so a form can highlight the offending input. */
  fields?: Record<string, string>;
}

export interface CommandSuccess<T> {
  ok: true;
  data: T;
}

export interface CommandFailure {
  ok: false;
  error: CommandError;
}

export type CommandResult<T> = CommandSuccess<T> | CommandFailure;

export function commandOk<T>(data: T): CommandSuccess<T> {
  return { ok: true, data };
}

export function commandFail(
  code: CommandErrorCode,
  message: string,
  fields?: Record<string, string>,
): CommandFailure {
  return { ok: false, error: fields ? { code, message, fields } : { code, message } };
}