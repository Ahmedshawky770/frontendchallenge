/**
 * UUIDv4 helpers.
 *
 * Every entity id in this project is a UUIDv4:
 *  - sequential ids would let anyone enumerate a course or a lesson and scrape
 *    the catalogue without an API key;
 *  - ids stay stable when rows move between shards or when a course is merged.
 *
 * Mock fixtures ship *fixed* v4 strings so server and client render identical
 * markup. Only runtime-created rows call `createUuid()`.
 */

const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return uuidV4Pattern.test(value);
}

export function isUuidV4(value: string): boolean {
  return uuidV4Pattern.test(value);
}

export function createUuid(): string {
  return globalThis.crypto.randomUUID();
}

export function createUuidOrThrow(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !isUuidV4(value)) {
    throw new Error(`${fieldName} must be a UUIDv4`);
  }
  return value;
}

/** FNV-1a style byte hash, expanded to 128 bits of hex output. */
function hashToHex(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  let h3 = 0x9e3779b9;
  let h4 = 0x85ebca6b;

  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 0x01000193) >>> 0;
    h2 = Math.imul(h2 + code, 0x85ebca6b) >>> 0;
    h3 = Math.imul(h3 ^ (code + index), 0xc2b2ae35) >>> 0;
    h4 = Math.imul(h4 + code * (index + 1), 0x27d4eb2f) >>> 0;
  }

  return [h1, h2, h3, h4].map((part) => part.toString(16).padStart(8, "0")).join("");
}

/**
 * Deterministic UUIDv4 for fixtures.
 *
 * Mock data must produce byte-identical ids on the server and the client, or
 * hydration mismatches and unstable React keys follow. Calling
 * `crypto.randomUUID()` at module scope would break that, and hand-writing ~190
 * uuids is unreviewable.
 *
 * The output is a properly shaped v4 identifier (version nibble `4`, variant
 * nibble in `8..b`); only the randomness source differs — a namespace hash
 * instead of the CSPRNG. Runtime entities always use `createUuid()`.
 */
export function deriveUuidV4(namespace: string, ...path: (string | number)[]): string {
  const hex = hashToHex(`${namespace}:${path.join(":")}`);
  const version = "4";
  const variant = "89ab"[hex.charCodeAt(16) % 4];

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `${version}${hex.slice(13, 16)}`,
    `${variant}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}