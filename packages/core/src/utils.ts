/**
 * Creates an isolated ID generator for a single report instance.
 *
 * Each call returns a new closure with its own counter, so multiple
 * concurrent reports never share or collide IDs.
 * IDs follow the format: `{type}-{base36-timestamp}-{base36-counter}`.
 *
 * This avoids global mutable state — the counter lives inside the closure,
 * scoped to the report instance that owns the generator.
 *
 * @example
 * const generate = createIdGenerator();
 * generate('title');     // e.g. 'title-lf3x2k-0001'
 * generate('paragraph'); // e.g. 'paragraph-lf3x2k-0002'
 */
export function createIdGenerator(): (type: string) => string {
  let counter = 0;
  return (type: string): string => {
    counter += 1;
    const timestamp = Date.now().toString(36);
    const count = counter.toString(36).padStart(4, '0');
    return `${type}-${timestamp}-${count}`;
  };
}

/**
 * Type guard that returns true if value is a non-null, non-array object.
 * Used in deserialization to safely check schema structure.
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
