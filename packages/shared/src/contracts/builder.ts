import type { IComponent } from './component.js';

/**
 * Contract for the fluent Builder API.
 * Methods append components to the tree and return the builder for chaining.
 */
export interface IBuilder {
  /**
   * Serializes the component tree to a report schema.
   * Alias for toJSON() — the canonical intermediate representation.
   */
  toSchema(): ReportSchema;

  /**
   * Serializes the component tree to a JSON-compatible report schema.
   * Equivalent to toSchema(). Provided for developer convenience.
   */
  toJSON(): ReportSchema;

  /** Validates the report schema without rendering. */
  validate(): ValidationResult;

  /** Executes the full pipeline and returns output bytes. */
  render(options: RenderOptions): Promise<Uint8Array>;
}

/** Top-level report schema (intermediate representation). */
export interface ReportSchema {
  readonly version: string;
  readonly metadata: ReportMetadata;
  readonly root: IReportNode;
}

/** Report-level metadata stored in the schema. */
export interface ReportMetadata {
  readonly title?: string;
  readonly author?: string;
  readonly createdAt?: string;
  readonly locale?: string;
  readonly pageSize?: string;
  readonly orientation?: 'portrait' | 'landscape';
  readonly theme?: string;
}

/** Options for the render method. */
export interface RenderOptions {
  readonly format: string;
  readonly output?: string;
  readonly options?: Readonly<Record<string, unknown>>;
}

/** Result of schema validation. */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
}

/** A single validation error. */
export interface ValidationError {
  readonly nodeId?: string;
  readonly message: string;
  readonly path?: string;
}

/**
 * Node in the report schema intermediate representation.
 * Serialized from IComponent instances during the serialization phase.
 */
export interface IReportNode {
  readonly id: string;
  readonly type: string;
  readonly props: Readonly<Record<string, unknown>>;
  readonly children: readonly IReportNode[];
  readonly style?: Readonly<Record<string, unknown>>;
  readonly layoutHints?: Readonly<Record<string, unknown>>;
}

/** Re-export IComponent for builder context. */
export type { IComponent };
