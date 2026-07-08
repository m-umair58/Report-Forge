import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';

import type { PDFDocument, PDFImage } from 'pdf-lib';

export interface EmbeddedImage {
  readonly image: PDFImage;
  readonly width: number;
  readonly height: number;
}

export interface ImagePlacement {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const DATA_URI_RE = /^data:image\/(png|jpeg|jpg);base64,(.+)$/i;
const PNG_EXT_RE = /\.png$/i;
const JPEG_EXT_RE = /\.(jpe?g)$/i;

/**
 * Loads, caches, and embeds raster images into a PDF document.
 *
 * Supports PNG and JPEG from file paths and base64 data URIs.
 */
export class ImageManager {
  private readonly _cache = new Map<string, EmbeddedImage>();
  private _basePath = process.cwd();

  constructor(private readonly _pdfDoc: PDFDocument) {}

  /** Sets the base directory for resolving relative file paths. */
  setBasePath(basePath: string): void {
    this._basePath = basePath;
  }

  /** Returns true when the source looks like a supported raster format. */
  isSupported(src: string): boolean {
    if (src.length === 0) return false;
    if (DATA_URI_RE.test(src)) return true;
    return PNG_EXT_RE.test(src) || JPEG_EXT_RE.test(src);
  }

  /**
   * Embeds an image by source path or data URI.
   * Returns null when the image cannot be loaded.
   */
  async embed(src: string, warnings: string[]): Promise<EmbeddedImage | null> {
    const cached = this._cache.get(src);
    if (cached !== undefined) return cached;

    try {
      const bytes = await this.loadBytes(src);
      if (bytes === null) return null;

      const embedded = await this.embedBytes(bytes, src, warnings);
      if (embedded !== null) {
        this._cache.set(src, embedded);
      }
      return embedded;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      warnings.push(`[draw-image] Failed to load '${src}': ${message}`);
      return null;
    }
  }

  /**
   * Computes centred placement with aspect-ratio preservation inside a bounding box.
   */
  computePlacement(
    imageWidth: number,
    imageHeight: number,
    boxX: number,
    boxY: number,
    boxWidth: number,
    boxHeight: number,
  ): ImagePlacement {
    if (imageWidth <= 0 || imageHeight <= 0) {
      return { x: boxX, y: boxY, width: boxWidth, height: boxHeight };
    }

    const scale = Math.min(boxWidth / imageWidth, boxHeight / imageHeight);
    const width = imageWidth * scale;
    const height = imageHeight * scale;

    return {
      x: boxX + (boxWidth - width) / 2,
      y: boxY + (boxHeight - height) / 2,
      width,
      height,
    };
  }

  /** Returns a human-readable label for placeholder rectangles. */
  placeholderLabel(src: string, alt: string): string {
    if (alt.length > 0) return `Image: ${alt}`;
    const parts = src.split('/');
    const filename = parts[parts.length - 1];
    return filename !== undefined && filename.length > 0
      ? `Image: ${filename}`
      : 'Image (placeholder)';
  }

  /** Number of embedded images currently cached. */
  get cacheSize(): number {
    return this._cache.size;
  }

  private async loadBytes(src: string): Promise<Uint8Array | null> {
    const dataUriMatch = DATA_URI_RE.exec(src);
    if (dataUriMatch !== null) {
      const payload = dataUriMatch[2];
      if (payload === undefined) return null;
      return Uint8Array.from(Buffer.from(payload, 'base64'));
    }

    const filePath = isAbsolute(src) ? src : resolve(this._basePath, src);
    if (!existsSync(filePath)) return null;

    const buffer = await readFile(filePath);
    return new Uint8Array(buffer);
  }

  private async embedBytes(
    bytes: Uint8Array,
    src: string,
    warnings: string[],
  ): Promise<EmbeddedImage | null> {
    const format = detectFormat(bytes, src);

    if (format === 'png') {
      const image = await this._pdfDoc.embedPng(bytes);
      return { image, width: image.width, height: image.height };
    }

    if (format === 'jpeg') {
      const image = await this._pdfDoc.embedJpg(bytes);
      return { image, width: image.width, height: image.height };
    }

    warnings.push(`[draw-image] Unsupported image format for '${src}'`);
    return null;
  }
}

function detectFormat(bytes: Uint8Array, src: string): 'png' | 'jpeg' | 'unknown' {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50) return 'png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg';
  }
  if (PNG_EXT_RE.test(src)) return 'png';
  if (JPEG_EXT_RE.test(src)) return 'jpeg';
  if (DATA_URI_RE.test(src)) {
    const match = DATA_URI_RE.exec(src);
    const type = match?.[1]?.toLowerCase();
    if (type === 'png') return 'png';
    if (type === 'jpeg' || type === 'jpg') return 'jpeg';
  }
  return 'unknown';
}
