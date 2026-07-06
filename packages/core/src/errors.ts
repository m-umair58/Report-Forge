/**
 * Base error class for all ReportForge errors.
 * Every error carries a `phase` string identifying the pipeline stage that failed,
 * making it easy to diagnose issues without reading framework internals.
 *
 * @example
 * try {
 *   report.validate();
 * } catch (error) {
 *   if (error instanceof ReportForgeError) {
 *     console.error(`Failed at phase: ${error.phase}`);
 *   }
 * }
 */
export class ReportForgeError extends Error {
  /** Pipeline phase where the error occurred (e.g. 'construction', 'validation'). */
  readonly phase: string;

  constructor(message: string, phase: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ReportForgeError';
    this.phase = phase;
  }
}

/**
 * Thrown when the Builder API receives invalid input.
 *
 * Examples: unknown component type, invalid prop values, misused scoped builder.
 */
export class BuilderError extends ReportForgeError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 'construction', options);
    this.name = 'BuilderError';
  }
}

/**
 * Thrown when the component tree cannot be serialized to a report schema.
 */
export class SerializationError extends ReportForgeError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 'serialization', options);
    this.name = 'SerializationError';
  }
}

/**
 * Thrown when a JSON value cannot be parsed into a valid report schema.
 */
export class DeserializationError extends ReportForgeError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 'deserialization', options);
    this.name = 'DeserializationError';
  }
}

/**
 * Thrown by validate() when a report schema contains errors and strict mode is used.
 * Inspect the `errors` array for structured details.
 */
export class ValidationFailureError extends ReportForgeError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 'validation', options);
    this.name = 'ValidationFailureError';
  }
}
