/**
 * Thrown when the typography engine encounters an error during measurement.
 *
 * @example
 * try {
 *   typography.measure(text, style);
 * } catch (error) {
 *   if (error instanceof TypographyError) {
 *     console.error('Measurement failed:', error.message);
 *   }
 * }
 */
export class TypographyError extends Error {
  /** Always 'typography' — identifies the pipeline phase. */
  readonly phase = 'typography' as const;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'TypographyError';
  }
}

/**
 * Thrown when a font family cannot be resolved or metrics are unavailable.
 */
export class FontNotFoundError extends TypographyError {
  readonly fontFamily: string;

  constructor(fontFamily: string, options?: ErrorOptions) {
    super(`Font family not found: '${fontFamily}'`, options);
    this.name = 'FontNotFoundError';
    this.fontFamily = fontFamily;
  }
}
