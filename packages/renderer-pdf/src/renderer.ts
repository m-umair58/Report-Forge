import type { DisplayList } from '@reportforge/display-list';

import { PdfRendererError } from './errors.js';
import { renderCommand } from './minimal-commands.js';
import { PdfDocument } from './pdf-document.js';

// ─── Render options ───────────────────────────────────────────────────────────

/**
 * Options for `PdfRenderer.render()`.
 *
 * All fields are optional. Omitted fields fall back to values from
 * `DisplayList.metadata`, or to pdf-lib defaults.
 */
export interface PdfRenderOptions {
  /** Document title embedded in PDF metadata. */
  readonly title?: string;
  /** Document author embedded in PDF metadata. */
  readonly author?: string;
  /** Document subject embedded in PDF metadata. */
  readonly subject?: string;
  /** Keywords embedded in PDF metadata. */
  readonly keywords?: readonly string[];
  /** The application that created the document. @default 'ReportForge' */
  readonly creator?: string;
  /** When false, the PDF is human-readable (useful for debugging). @default true */
  readonly compress?: boolean;
}

// ─── Metadata helpers ─────────────────────────────────────────────────────────

function metaString(meta: Readonly<Record<string, unknown>>, key: string): string | undefined {
  const v = meta[key];
  return typeof v === 'string' ? v : undefined;
}

function isStringArray(val: unknown): val is string[] {
  return Array.isArray(val) && val.every((i) => typeof i === 'string');
}

function metaKeywords(meta: Readonly<Record<string, unknown>>, key: string): string[] | undefined {
  const v = meta[key];
  return isStringArray(v) ? v : undefined;
}

// ─── PdfRenderer ──────────────────────────────────────────────────────────────

/**
 * Minimal PDF renderer for the ReportForge vertical slice.
 *
 * Converts a renderer-independent `DisplayList` into PDF bytes using pdf-lib.
 * This renderer is **intentionally minimal** — it exists to validate the
 * complete pipeline, not to be the final PDF implementation.
 *
 * ## Supported components (vertical slice)
 *
 * | Component | Render command |
 * |-----------|----------------|
 * | Title     | draw-text      |
 * | Paragraph | draw-text      |
 * | Divider   | draw-line      |
 *
 * All other display commands are ignored with a warning.
 *
 * ## Pipeline position
 *
 * ```
 * DisplayListGenerator.generate(layout) → DisplayList
 *                                              ↓
 * PdfRenderer.render(displayList)   → Uint8Array (PDF bytes)
 * ```
 *
 * @example
 * const renderer = new PdfRenderer();
 * const pdfBytes = await renderer.render(displayList);
 * await writeFile('report.pdf', pdfBytes);
 */
export class PdfRenderer {
  readonly name = 'reportforge-pdf-renderer' as const;
  readonly mimeTypes = ['application/pdf'] as const;

  /**
   * Renders a `DisplayList` to PDF bytes.
   *
   * @throws {PdfRendererError} If the PDF document cannot be created or saved.
   */
  async render(displayList: DisplayList, options: PdfRenderOptions = {}): Promise<Uint8Array> {
    const result = await this.renderWithDiagnostics(displayList, options);
    return result.bytes;
  }

  /**
   * Renders a `DisplayList` and returns bytes plus diagnostic information.
   */
  async renderWithDiagnostics(
    displayList: DisplayList,
    options: PdfRenderOptions = {},
  ): Promise<PdfRenderResult> {
    let pdfDoc: PdfDocument;
    try {
      pdfDoc = await PdfDocument.create();
    } catch (cause) {
      throw new PdfRendererError('Failed to create PDF document', { cause });
    }

    const meta = displayList.metadata;

    const metadata: {
      title?: string;
      author?: string;
      subject?: string;
      keywords?: readonly string[];
      creator?: string;
    } = {
      creator: options.creator ?? 'ReportForge',
    };

    const title = options.title ?? metaString(meta, 'title');
    const author = options.author ?? metaString(meta, 'author');
    const subject = options.subject ?? metaString(meta, 'subject');
    const keywords = options.keywords ?? metaKeywords(meta, 'keywords');

    if (title !== undefined) metadata.title = title;
    if (author !== undefined) metadata.author = author;
    if (subject !== undefined) metadata.subject = subject;
    if (keywords !== undefined) metadata.keywords = keywords;

    pdfDoc.setMetadata(metadata);

    const warnings: string[] = [];

    for (const displayPage of displayList.pages) {
      let page;
      try {
        page = pdfDoc.addPage(displayPage.width, displayPage.height);
      } catch (cause) {
        throw new PdfRendererError(
          `Failed to add page ${displayPage.pageNumber.toString()} to PDF document`,
          { cause },
        );
      }

      for (const command of displayPage.commands) {
        try {
          renderCommand(page, command, warnings);
        } catch (cause) {
          throw new PdfRendererError(
            `Error rendering command '${command.kind}' on page ${displayPage.pageNumber.toString()} ` +
              `(node '${command.sourceNodeId}')`,
            { nodeId: command.sourceNodeId, cause },
          );
        }
      }
    }

    const compress = options.compress ?? true;

    let pdfBytes: Uint8Array;
    try {
      pdfBytes = await pdfDoc.save(compress);
    } catch (cause) {
      throw new PdfRendererError('Failed to serialise PDF document to bytes', { cause });
    }

    return {
      bytes: pdfBytes,
      pageCount: pdfDoc.pageCount,
      commandCount: displayList.commandCount,
      warnings,
    };
  }
}

/** Result returned by `PdfRenderer.renderWithDiagnostics()`. */
export interface PdfRenderResult {
  readonly bytes: Uint8Array;
  readonly pageCount: number;
  readonly commandCount: number;
  readonly warnings: readonly string[];
}
