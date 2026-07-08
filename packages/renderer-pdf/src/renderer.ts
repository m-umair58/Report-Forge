import type { DisplayList } from '@reportforge/display-list';

import { PdfRendererError } from './errors.js';
import type { CustomFontRegistration } from './fonts.js';
import { FontManager } from './fonts.js';
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
  /** Full-page background colour applied to every page (hex or named colour). */
  readonly pageBackground?: string;
  /** Base directory for resolving relative image paths. @default process.cwd() */
  readonly basePath?: string;
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

function resolvePageBackground(
  displayList: DisplayList,
  options: PdfRenderOptions,
): string | null {
  const fromOptions = options.pageBackground;
  if (fromOptions !== undefined) return fromOptions;

  const fromMeta = metaString(displayList.metadata, 'pageBackground');
  if (fromMeta !== undefined) return fromMeta;

  const legacy = metaString(displayList.metadata, 'backgroundColor');
  return legacy ?? null;
}

// ─── PdfRenderer ──────────────────────────────────────────────────────────────

/**
 * Production PDF renderer for ReportForge.
 *
 * Converts a renderer-independent `DisplayList` into PDF bytes using pdf-lib.
 * Rendering is delegated through a dedicated pipeline:
 *
 * ```
 * PdfRenderer → PageRenderer → TextRenderer / ShapeRenderer / ImageRenderer
 *                            → FontManager / ImageManager
 * ```
 */
export class PdfRenderer {
  readonly name = 'reportforge-pdf-renderer' as const;
  readonly mimeTypes = ['application/pdf'] as const;

  private readonly _fontManager: FontManager;
  private readonly _pendingFontRegistrations: CustomFontRegistration[] = [];

  constructor(fontManager?: FontManager) {
    this._fontManager = fontManager ?? new FontManager();
  }

  /**
   * Registers a font for use during rendering.
   *
   * Custom TTF/OTF embedding via raw bytes is reserved for a future release.
   * Today, registrations can alias names to built-in standard fonts.
   *
   * @example
   * renderer.registerFont('Brand Sans', { standardFont: StandardFonts.Helvetica });
   */
  registerFont(registration: CustomFontRegistration): this {
    this._fontManager.register(registration);
    this._pendingFontRegistrations.push(registration);
    return this;
  }

  async render(displayList: DisplayList, options: PdfRenderOptions = {}): Promise<Uint8Array> {
    const result = await this.renderWithDiagnostics(displayList, options);
    return result.bytes;
  }

  async renderWithDiagnostics(
    displayList: DisplayList,
    options: PdfRenderOptions = {},
  ): Promise<PdfRenderResult> {
    let pdfDoc: PdfDocument;
    try {
      const createOptions =
        options.basePath !== undefined ? { basePath: options.basePath } : undefined;
      pdfDoc = await PdfDocument.create(this._fontManager, createOptions);
    } catch (cause) {
      throw new PdfRendererError('Failed to create PDF document', { cause });
    }

    for (const registration of this._pendingFontRegistrations) {
      if (registration.bytes !== undefined) {
        // Custom embedding is intentionally deferred — registration is stored only.
      }
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
    const pageBackground = resolvePageBackground(displayList, options);
    const pageRenderer = pdfDoc.pageRenderer;

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

      pageRenderer.drawBackground(page, displayPage, pageBackground);

      try {
        await pageRenderer.renderCommands(page, displayPage, warnings);
      } catch (cause) {
        throw new PdfRendererError(
          `Error rendering page ${displayPage.pageNumber.toString()}`,
          { cause },
        );
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
