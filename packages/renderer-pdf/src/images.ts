/**
 * Image management for the PDF renderer.
 *
 * Image embedding is a **placeholder** in this milestone. The `ImageManager`
 * class provides the interface for future image support, but currently always
 * reports that images are unsupported.
 *
 * ## Roadmap
 *
 * Future milestones will implement:
 * - PNG embedding via `PDFDocument.embedPng(bytes)`
 * - JPEG embedding via `PDFDocument.embedJpg(bytes)`
 * - SVG rasterization to PNG before embedding
 * - Remote image fetching (URL → bytes) with caching
 * - Data URI parsing and embedding
 * - Image dimension detection and scaling
 *
 * When a `draw-image` command is encountered and `isSupported()` returns false,
 * the renderer draws a grey placeholder rectangle labelled with the alt text.
 */
export class ImageManager {
  /**
   * Returns `true` if the given image source can be embedded in the PDF.
   *
   * Currently always returns `false` — image embedding is not yet implemented.
   *
   * TODO (future): Return true for data URIs with `data:image/png;base64,...`
   *                and `data:image/jpeg;base64,...` prefixes.
   * TODO (future): Return true for file paths with `.png` / `.jpg` extensions
   *                after reading and caching the bytes.
   */
  isSupported(src: string): boolean {
    void src; // intentionally unused — placeholder implementation
    // TODO (future): detect PNG data URI → return true
    // TODO (future): detect JPEG data URI → return true
    // TODO (future): detect file path with .png / .jpg extension → return true
    return false;
  }

  /**
   * Returns a human-readable label for use in placeholder rectangles.
   * Uses the alt text if present, otherwise derives a label from the src.
   */
  placeholderLabel(src: string, alt: string): string {
    if (alt.length > 0) return `Image: ${alt}`;
    // Use just the filename from the path/URL as a fallback
    const parts = src.split('/');
    const filename = parts[parts.length - 1];
    return filename !== undefined && filename.length > 0
      ? `Image: ${filename}`
      : 'Image (placeholder)';
  }
}
