/**
 * Thrown when the PDF renderer encounters an error.
 * Always identifies the renderer and, where applicable, the source node.
 *
 * @example
 * try {
 *   const pdfBytes = await renderer.render(displayList);
 * } catch (error) {
 *   if (error instanceof PdfRendererError) {
 *     console.error('PDF rendering failed:', error.message);
 *   }
 * }
 */
export class PdfRendererError extends Error {
  /** Always 'pdf' — identifies this as a PDF renderer error. */
  readonly renderer = 'pdf' as const;

  /** The source node ID that caused the error, if applicable. */
  readonly nodeId: string | undefined;

  constructor(message: string, options?: { readonly nodeId?: string; readonly cause?: unknown }) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'PdfRendererError';
    this.nodeId = options?.nodeId;
  }
}
