import type { ReportSchema } from './builder.js';
import type { ITheme } from './theme.js';

/**
 * Contract for the layout engine.
 * Computes positions, pagination, and spacing from a validated schema.
 */
export interface ILayoutEngine {
  /** Unique identifier for this layout engine implementation. */
  readonly name: string;

  /**
   * Computes layout for a validated report schema.
   * @param input - Schema and theme to lay out.
   */
  layout(input: LayoutInput): LayoutOutput;
}

/** Input to the layout engine. */
export interface LayoutInput {
  readonly schema: ReportSchema;
  readonly theme: ITheme;
}

/** Output from the layout engine — format-agnostic positioned pages. */
export interface LayoutOutput {
  readonly pages: readonly LayoutPage[];
  readonly metadata: Readonly<Record<string, unknown>>;
}

/** A single page in the laid-out document. */
export interface LayoutPage {
  readonly pageNumber: number;
  readonly width: number;
  readonly height: number;
  readonly elements: readonly LayoutElement[];
}

/** A positioned element on a page. */
export interface LayoutElement {
  readonly nodeId: string;
  readonly type: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly props: Readonly<Record<string, unknown>>;
  readonly style: Readonly<Record<string, unknown>>;
}
