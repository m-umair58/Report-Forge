import type { LayoutOutput } from './layout-engine.js';
import type { ITheme } from './theme.js';

/**
 * Contract for output renderers.
 * Converts laid-out documents into format-specific byte output.
 */
export interface IRenderer {
  /** Unique renderer identifier (e.g. 'pdf', 'html'). */
  readonly name: string;

  /** MIME types this renderer produces. */
  readonly mimeTypes: readonly string[];

  /**
   * Renders the laid-out document to output bytes.
   * @param context - Layout output, theme, and renderer options.
   */
  render(context: IRenderContext): Promise<Uint8Array>;
}

/**
 * Context passed to a renderer during output generation.
 * Contains everything a renderer needs without access to the Builder or component tree.
 */
export interface IRenderContext {
  readonly document: LayoutOutput;
  readonly theme: ITheme;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly options?: Readonly<Record<string, unknown>>;
}
