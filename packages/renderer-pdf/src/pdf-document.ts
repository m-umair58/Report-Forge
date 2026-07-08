import { PDFDocument } from 'pdf-lib';

import type { CustomFontRegistration, FontManager } from './fonts.js';
import { FontManager as FontManagerClass } from './fonts.js';
import { ImageManager } from './images.js';
import { PageRenderer } from './page-renderer.js';

/** PDF document metadata fields. */
export interface PdfDocumentMetadata {
  readonly title?: string;
  readonly author?: string;
  readonly subject?: string;
  readonly keywords?: readonly string[];
  readonly creator?: string;
}

/**
 * A PDF document being assembled by the renderer.
 *
 * Wraps pdf-lib's `PDFDocument` and manages fonts, images, and page creation.
 */
export class PdfDocument {
  private readonly _doc: PDFDocument;
  private readonly _fontManager: FontManager;
  private readonly _imageManager: ImageManager;
  private readonly _pageRenderer: PageRenderer;

  private constructor(
    doc: PDFDocument,
    fontManager: FontManager,
    imageManager: ImageManager,
    pageRenderer: PageRenderer,
  ) {
    this._doc = doc;
    this._fontManager = fontManager;
    this._imageManager = imageManager;
    this._pageRenderer = pageRenderer;
  }

  /**
   * Creates a new empty PDF document with standard fonts preloaded.
   */
  static async create(
    fontManager?: FontManager,
    options?: { readonly basePath?: string },
  ): Promise<PdfDocument> {
    const doc = await PDFDocument.create();
    const fonts = fontManager ?? new FontManagerClass();
    await fonts.preload(doc);

    const imageManager = new ImageManager(doc);
    if (options?.basePath !== undefined) {
      imageManager.setBasePath(options.basePath);
    }

    const pageRenderer = new PageRenderer(fonts, imageManager);
    return new PdfDocument(doc, fonts, imageManager, pageRenderer);
  }

  get pageCount(): number {
    return this._doc.getPageCount();
  }

  get fontManager(): FontManager {
    return this._fontManager;
  }

  get imageManager(): ImageManager {
    return this._imageManager;
  }

  get pageRenderer(): PageRenderer {
    return this._pageRenderer;
  }

  /** Underlying pdf-lib document (for advanced use). */
  get libDocument(): PDFDocument {
    return this._doc;
  }

  /** Sets PDF document metadata (title, author, etc.). */
  setMetadata(metadata: PdfDocumentMetadata): void {
    if (metadata.title !== undefined) this._doc.setTitle(metadata.title);
    if (metadata.author !== undefined) this._doc.setAuthor(metadata.author);
    if (metadata.subject !== undefined) this._doc.setSubject(metadata.subject);
    if (metadata.keywords !== undefined) this._doc.setKeywords([...metadata.keywords]);
    if (metadata.creator !== undefined) this._doc.setCreator(metadata.creator);
    this._doc.setProducer('ReportForge (https://github.com/reportforge/reportforge)');
    this._doc.setCreationDate(new Date());
    this._doc.setModificationDate(new Date());
  }

  /** Adds a new page with the given dimensions (in points). */
  addPage(width: number, height: number): import('pdf-lib').PDFPage {
    return this._doc.addPage([width, height]);
  }

  /** Serialises the document to PDF bytes. */
  async save(compress = true): Promise<Uint8Array> {
    return this._doc.save({ useObjectStreams: compress });
  }
}

export type { CustomFontRegistration };
