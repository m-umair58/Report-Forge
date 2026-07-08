/**
 * Display List commands for the ReportForge rendering pipeline.
 *
 * Each command describes a single atomic drawing operation in a
 * renderer-independent coordinate system (points, pt).
 *
 * Renderers translate these commands into their own drawing primitives:
 * - PDF renderer → PDF operators (BT, Tf, Tj, re, f, etc.)
 * - HTML renderer → CSS / SVG elements
 * - Canvas renderer → CanvasRenderingContext2D calls
 * - SVG renderer → SVG elements
 *
 * ## Coordinate system
 *
 * All x/y coordinates are in points (pt) from the **top-left** corner of the page.
 * Positive x moves right; positive y moves down.
 *
 * ## Colors
 *
 * Colors are hex strings (`'#rrggbb'` or `'#rrggbbaa'`), `rgb(...)`, `rgba(...)`
 * or `null` for "transparent / no fill / no stroke".
 */

// ─── Shared types ─────────────────────────────────────────────────────────────

/** A 2D point in the page coordinate system (in points). */
export interface Point2D {
  readonly x: number;
  readonly y: number;
}

/** Font weight options for text drawing. */
export type FontWeight = 'normal' | 'bold';

/** Horizontal text alignment options. */
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

// ─── Command interfaces ────────────────────────────────────────────────────────

/**
 * Renders a text string at the given position.
 *
 * The text box is bounded by (x, y, width, height). Renderers are responsible
 * for wrapping text that exceeds the width.
 */
export interface DrawTextCommand {
  readonly kind: 'draw-text';
  /** ID of the originating layout element. */
  readonly sourceNodeId: string;
  /** The text content to render. */
  readonly text: string;
  /** Font family name (e.g. 'Helvetica', 'Inter'). */
  readonly font: string;
  /** Font size in points. */
  readonly fontSize: number;
  /** Font weight. */
  readonly fontWeight: FontWeight;
  /** Line height multiplier (e.g. 1.2). */
  readonly lineHeight: number;
  /** Text color (hex or rgb string). */
  readonly color: string;
  /** X coordinate of the text box top-left, in points. */
  readonly x: number;
  /** Y coordinate of the text box top-left, in points. */
  readonly y: number;
  /** Width of the text bounding box, in points. */
  readonly width: number;
  /** Height of the text bounding box, in points. */
  readonly height: number;
  /** Clockwise rotation in degrees (0 = no rotation). */
  readonly rotation: number;
  /** Opacity (0 = invisible, 1 = fully opaque). */
  readonly opacity: number;
  /** Horizontal text alignment within the bounding box. */
  readonly textAlign: TextAlign;
}

/**
 * Renders a filled and/or stroked rectangle.
 * Used for backgrounds, borders, cards, and placeholder boxes.
 */
export interface DrawRectangleCommand {
  readonly kind: 'draw-rectangle';
  readonly sourceNodeId: string;
  /** X coordinate of the top-left corner, in points. */
  readonly x: number;
  /** Y coordinate of the top-left corner, in points. */
  readonly y: number;
  /** Width in points. */
  readonly width: number;
  /** Height in points. */
  readonly height: number;
  /** Fill color, or null for transparent. */
  readonly fillColor: string | null;
  /** Border/stroke color, or null for no border. */
  readonly borderColor: string | null;
  /** Border width in points. */
  readonly borderWidth: number;
  /** Corner radius in points (0 = sharp corners). */
  readonly cornerRadius: number;
  /** Opacity (0–1). */
  readonly opacity: number;
}

/**
 * Renders a straight line between two points.
 * Used for dividers, table cell borders, and chart axes.
 */
export interface DrawLineCommand {
  readonly kind: 'draw-line';
  readonly sourceNodeId: string;
  /** Start X in points. */
  readonly x1: number;
  /** Start Y in points. */
  readonly y1: number;
  /** End X in points. */
  readonly x2: number;
  /** End Y in points. */
  readonly y2: number;
  /** Line color. */
  readonly color: string;
  /** Line width in points. */
  readonly width: number;
  /** Opacity (0–1). */
  readonly opacity: number;
}

/**
 * Renders an image at the given position and size.
 * `src` is a URL, file path, or data URI — interpretation is renderer-specific.
 */
export interface DrawImageCommand {
  readonly kind: 'draw-image';
  readonly sourceNodeId: string;
  /** Image source (URL, file path, or data URI). */
  readonly src: string;
  /** Alt text for accessibility. */
  readonly alt: string;
  /** X coordinate, in points. */
  readonly x: number;
  /** Y coordinate, in points. */
  readonly y: number;
  /** Rendered width, in points. */
  readonly width: number;
  /** Rendered height, in points. */
  readonly height: number;
  /** Clockwise rotation in degrees. */
  readonly rotation: number;
  /** Opacity (0–1). */
  readonly opacity: number;
}

/**
 * Renders a path defined by SVG path data.
 * Useful for complex shapes, icons, and chart elements.
 */
export interface DrawPathCommand {
  readonly kind: 'draw-path';
  readonly sourceNodeId: string;
  /** SVG path data string (e.g. 'M 0 0 L 100 0 L 100 100 Z'). */
  readonly pathData: string;
  /** Fill color, or null for no fill. */
  readonly fillColor: string | null;
  /** Stroke color, or null for no stroke. */
  readonly strokeColor: string | null;
  /** Stroke width in points. */
  readonly strokeWidth: number;
  /** Opacity (0–1). */
  readonly opacity: number;
}

/**
 * Renders a circle centered at (cx, cy).
 */
export interface DrawCircleCommand {
  readonly kind: 'draw-circle';
  readonly sourceNodeId: string;
  /** Center X in points. */
  readonly cx: number;
  /** Center Y in points. */
  readonly cy: number;
  /** Radius in points. */
  readonly radius: number;
  /** Fill color, or null for no fill. */
  readonly fillColor: string | null;
  /** Stroke color, or null for no stroke. */
  readonly strokeColor: string | null;
  /** Stroke width in points. */
  readonly strokeWidth: number;
  /** Opacity (0–1). */
  readonly opacity: number;
}

/**
 * Renders an ellipse centered at (cx, cy).
 */
export interface DrawEllipseCommand {
  readonly kind: 'draw-ellipse';
  readonly sourceNodeId: string;
  /** Center X in points. */
  readonly cx: number;
  /** Center Y in points. */
  readonly cy: number;
  /** Horizontal radius (x-axis) in points. */
  readonly rx: number;
  /** Vertical radius (y-axis) in points. */
  readonly ry: number;
  /** Fill color, or null for no fill. */
  readonly fillColor: string | null;
  /** Stroke color, or null for no stroke. */
  readonly strokeColor: string | null;
  /** Stroke width in points. */
  readonly strokeWidth: number;
  /** Opacity (0–1). */
  readonly opacity: number;
}

/**
 * Renders a closed polygon defined by a list of vertices.
 */
export interface DrawPolygonCommand {
  readonly kind: 'draw-polygon';
  readonly sourceNodeId: string;
  /** Polygon vertices in page coordinates (points). */
  readonly points: readonly Point2D[];
  /** Fill color, or null for no fill. */
  readonly fillColor: string | null;
  /** Stroke color, or null for no stroke. */
  readonly strokeColor: string | null;
  /** Stroke width in points. */
  readonly strokeWidth: number;
  /** Opacity (0–1). */
  readonly opacity: number;
}

/**
 * Placeholder for a QR code drawing operation.
 * Renderers that support QR codes will encode `value` and render it at the
 * given position and size. Renderers that do not support QR codes may render
 * a placeholder rectangle.
 */
export interface DrawQRCodeCommand {
  readonly kind: 'draw-qr-code';
  readonly sourceNodeId: string;
  /** The data to encode in the QR code. */
  readonly value: string;
  /** X coordinate, in points. */
  readonly x: number;
  /** Y coordinate, in points. */
  readonly y: number;
  /** Rendered width, in points. */
  readonly width: number;
  /** Rendered height, in points. */
  readonly height: number;
  /** Opacity (0–1). */
  readonly opacity: number;
}

/**
 * Placeholder for a barcode drawing operation.
 * Renderers that support barcodes will encode `value` using `format` and
 * render it at the given position. Renderers that do not support barcodes may
 * render a placeholder rectangle.
 */
export interface DrawBarcodeCommand {
  readonly kind: 'draw-barcode';
  readonly sourceNodeId: string;
  /** The data to encode in the barcode. */
  readonly value: string;
  /** Barcode format (e.g. 'EAN13', 'CODE128', 'QR'). */
  readonly format: string;
  /** X coordinate, in points. */
  readonly x: number;
  /** Y coordinate, in points. */
  readonly y: number;
  /** Rendered width, in points. */
  readonly width: number;
  /** Rendered height, in points. */
  readonly height: number;
  /** Opacity (0–1). */
  readonly opacity: number;
}

/**
 * Table drawing operation with precomputed layout from `@reportforge/table`.
 */
export interface DrawTableCommand {
  readonly kind: 'draw-table';
  readonly sourceNodeId: string;
  /** X coordinate, in points. */
  readonly x: number;
  /** Y coordinate, in points. */
  readonly y: number;
  /** Width, in points. */
  readonly width: number;
  /** Height, in points. */
  readonly height: number;
  /** Column definitions (forwarded from schema props). */
  readonly columns: readonly unknown[];
  /** Row data (forwarded from schema props). */
  readonly rows: readonly unknown[];
  /** Precomputed table layout fragment from the table engine. */
  readonly tableLayout?: Record<string, unknown>;
  /** Opacity (0–1). */
  readonly opacity: number;
}

// ─── Discriminated union ──────────────────────────────────────────────────────

/**
 * Union of all display drawing commands.
 *
 * Use the `kind` discriminant to narrow to a specific command type:
 *
 * ```typescript
 * for (const cmd of page.commands) {
 *   switch (cmd.kind) {
 *     case 'draw-text': // DrawTextCommand
 *     case 'draw-rectangle': // DrawRectangleCommand
 *     // ...
 *   }
 * }
 * ```
 */
export type DisplayCommand =
  | DrawTextCommand
  | DrawRectangleCommand
  | DrawLineCommand
  | DrawImageCommand
  | DrawPathCommand
  | DrawCircleCommand
  | DrawEllipseCommand
  | DrawPolygonCommand
  | DrawQRCodeCommand
  | DrawBarcodeCommand
  | DrawTableCommand;

/** All valid `kind` values for `DisplayCommand`. */
export type DisplayCommandKind = DisplayCommand['kind'];
