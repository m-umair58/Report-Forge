import type { DisplayList } from '@reportforge/display-list';

import type { RendererCapabilities } from './capabilities.js';
import type { RenderContext, RenderOptions, RenderPage, RenderResult } from './context.js';
import { displayListToRenderDocument, encodeUtf8 } from './convert.js';
import type { RenderOperation } from './operations.js';

/**
 * Abstract base renderer implementing the unified ReportForge renderer lifecycle.
 *
 * Subclasses implement `renderOperation()` for each output format.
 */
export abstract class Renderer {
  abstract readonly name: string;
  abstract readonly mimeTypes: readonly string[];
  abstract readonly capabilities: RendererCapabilities;

  /** Called once before rendering begins. */
  initialize(_context: RenderContext): void | Promise<void> {}

  /** Called when document rendering starts. */
  beginDocument(_context: RenderContext): void | Promise<void> {}

  /** Called when a page begins rendering. */
  beginPage(_page: RenderPage, _context: RenderContext): void | Promise<void> {}

  /** Render a single operation. Subclasses must implement. */
  abstract renderOperation(
    operation: RenderOperation,
    page: RenderPage,
    context: RenderContext,
  ): void | Promise<void>;

  /** Called when a page finishes rendering. */
  endPage(_page: RenderPage, _context: RenderContext): void | Promise<void> {}

  /** Called when document rendering completes. Subclasses produce output bytes. */
  abstract endDocument(context: RenderContext): Uint8Array | Promise<Uint8Array>;

  /** Cleanup resources. */
  dispose(_context: RenderContext): void | Promise<void> {}

  async render(displayList: DisplayList, options: RenderOptions = {}): Promise<Uint8Array> {
    const result = await this.renderWithDiagnostics(displayList, options);
    return result.bytes;
  }

  async renderWithDiagnostics(
    displayList: DisplayList,
    options: RenderOptions = {},
  ): Promise<RenderResult> {
    const document = displayListToRenderDocument(displayList);
    const warnings: string[] = [];
    const context: RenderContext = { document, displayList, options, warnings };

    await this.initialize(context);
    await this.beginDocument(context);

    for (const page of document.pages) {
      await this.beginPage(page, context);
      for (const operation of page.operations) {
        await this.renderOperation(operation, page, context);
      }
      await this.endPage(page, context);
    }

    const output = await this.endDocument(context);
    await this.dispose(context);

    return {
      bytes: output,
      mimeType: this.mimeTypes[0] ?? 'application/octet-stream',
      pageCount: document.pages.length,
      operationCount: document.operationCount,
      warnings,
    };
  }
}

/** Helper for string-based renderers (HTML, SVG). */
export abstract class StringRenderer extends Renderer {
  protected parts: string[] = [];

  protected append(value: string): void {
    this.parts.push(value);
  }

  protected reset(): void {
    this.parts = [];
  }

  protected joinOutput(): Uint8Array {
    return encodeUtf8(this.parts.join(''));
  }
}
