/** Mutable counter backing {@link createIdempotencyCounter}'s command metadata factory. */
export type CommandMetadata = (expectedVersion: number) => {
  expectedVersion: number;
  idempotencyKey: string;
};

/**
 * Creates a monotonic command-metadata factory for deterministic tests.
 *
 * Each call to the returned factory consumes the next idempotency key under the
 * given prefix, keeping mutation payloads unique across test runs and layers.
 */
export function createIdempotencyCounter(prefix: string): CommandMetadata {
  let sequence = 0;
  return (expectedVersion: number) => {
    sequence += 1;
    return {
      expectedVersion,
      idempotencyKey: `${prefix}-${sequence}`,
    };
  };
}
