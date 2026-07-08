import { PDFDocument } from 'pdf-lib';

import { FontManager } from './fonts.js';
import { PdfPage } from './pdf-page.js';

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
 * Wraps pdf-lib's `PDFDocument` and manages font loading and page creation.
 * pdf-lib is an internal implementation detail — this class is the public
 * abstraction for document-level operations.
 *
 * ## Minimal vertical slice
 *
 * This milestone only supports `draw-text` and `draw-line` render commands
 * (mapped from Title, Paragraph, and Divider components). All other command
 * types are ignored with a warning.
 */
export class PdfDocument {
  private readonly _doc: PDFDocument;
  private readonly _fontManager: FontManager;
  private readonly _pages: PdfPage[] = [];

  private constructor(doc: PDFDocument, fontManager: FontManager) {
    this._doc = doc;
    this._fontManager = fontManager;
  }

  /**
   * Creates a new empty PDF document with standard fonts preloaded.
   */
  static async create(): Promise<PdfDocument> {
    const doc = await PDFDocument.create();
    const fontManager = new FontManager();
    await fontManager.preload(doc);
    return new PdfDocument(doc, fontManager);
  }

  /** Number of pages added so far. */
  get pageCount(): number {
    return this._pages.length;
  }

  /** All pages in document order. */
  get pages(): readonly PdfPage[] {
    return this._pages;
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

  /**
   * Adds a new page with the given dimensions (in points).
   * @returns The new `PdfPage` ready for drawing commands.
   */
  addPage(width: number, height: number): PdfPage {
    const libPage = this._doc.addPage([width, height]);
    const page = new PdfPage(libPage, width, height, this._fontManager);
    this._pages.push(page);
    return page;
  }

  /**
   * Serialises the document to PDF bytes.
   * @param compress - When true, enables object stream compression.
   */
  async save(compress = true): Promise<Uint8Array> {
    return this._doc.save({ useObjectStreams: compress });
  }
}
