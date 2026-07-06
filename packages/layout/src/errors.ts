/**
 * Thrown when the layout engine encounters an unresolvable constraint.
 *
 * Examples:
 * - Header + footer heights exceed the available content area
 * - Negative page dimensions after applying margins
 * - Invalid page size configuration
 *
 * @example
 * try {
 *   engine.layout({ schema, theme });
 * } catch (error) {
 *   if (error instanceof LayoutError) {
 *     console.error('Layout failed:', error.message);
 *   }
 * }
 */
export class LayoutError extends Error {
  /** Always 'layout' — identifies the pipeline phase. */
  readonly phase = 'layout' as const;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'LayoutError';
  }
}

/**
 * Thrown when the layout engine detects an impossible layout constraint
 * that would produce an invalid or corrupt document.
 *
 * Examples:
 * - A node with a negative computed height
 * - A margin that exceeds the page dimension
 */
export class LayoutConstraintError extends LayoutError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'LayoutConstraintError';
  }
}
