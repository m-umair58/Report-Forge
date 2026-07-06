/**
 * Thrown when the Display List Generator or Validator encounters an error.
 *
 * @example
 * try {
 *   generator.generate(layout);
 * } catch (error) {
 *   if (error instanceof DisplayListError) {
 *     console.error('Display list failed:', error.message);
 *   }
 * }
 */
export class DisplayListError extends Error {
  /** Always 'display-list' — identifies the pipeline phase. */
  readonly phase = 'display-list' as const;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DisplayListError';
  }
}

/**
 * Thrown when a generated display command fails validation.
 * Includes the offending node ID and command kind for diagnostics.
 */
export class DisplayCommandValidationError extends DisplayListError {
  readonly nodeId: string;
  readonly commandKind: string;

  constructor(nodeId: string, commandKind: string, message: string, options?: ErrorOptions) {
    super(`[${commandKind}] node '${nodeId}': ${message}`, options);
    this.name = 'DisplayCommandValidationError';
    this.nodeId = nodeId;
    this.commandKind = commandKind;
  }
}
