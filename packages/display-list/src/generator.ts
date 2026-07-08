import type { LayoutElement, LayoutOutput } from '@reportforge/shared';

import type {
  DisplayCommand,
  DrawBarcodeCommand,
  DrawImageCommand,
  DrawLineCommand,
  DrawQRCodeCommand,
  DrawRectangleCommand,
  DrawTableCommand,
  DrawTextCommand,
} from './commands.js';
import { DisplayListError } from './errors.js';
import { optimizePages } from './optimizer.js';
import type { OptimizerOptions } from './optimizer.js';
import type { DisplayContext, DisplayList, DisplayListOptions, DisplayPage } from './types.js';
import { validateDisplayList } from './validator.js';

// ─── Built-in defaults ────────────────────────────────────────────────────────

/** Default font family for all text commands. */
export const DEFAULT_FONT = 'Helvetica' as const;

/** Default body font size (pt). */
export const DEFAULT_FONT_SIZE = 12;

/** Default title font size (pt). */
export const DEFAULT_FONT_SIZE_TITLE = 24;

/** Default subtitle font size (pt). */
export const DEFAULT_FONT_SIZE_SUBTITLE = 18;

/** Default line height multiplier. */
export const DEFAULT_LINE_HEIGHT = 1.2;

/** Default text color. */
export const DEFAULT_COLOR = '#1a1a1a' as const;

/** Default fill color for section and container backgrounds (transparent). */
export const DEFAULT_BACKGROUND_COLOR = null;

/** Default border color for structural elements. */
export const DEFAULT_BORDER_COLOR = '#cccccc' as const;

/** Default divider line color. */
export const DEFAULT_DIVIDER_COLOR = '#cccccc' as const;

/** Default header/footer background color (very light grey). */
export const DEFAULT_ACCENT_BACKGROUND = '#f8f8f8' as const;

/** Default opacity for all commands. */
export const DEFAULT_OPACITY = 1;

// ─── Context factory ──────────────────────────────────────────────────────────

function buildContext(
  pageWidth: number,
  pageHeight: number,
  options: Required<DisplayListOptions>,
): DisplayContext {
  return {
    pageWidth,
    pageHeight,
    defaultFont: options.defaultFont,
    defaultFontSize: options.defaultFontSize,
    defaultColor: options.defaultColor,
    defaultOpacity: options.defaultOpacity,
  };
}

// ─── Prop extraction helpers ──────────────────────────────────────────────────

function propString(props: Readonly<Record<string, unknown>>, key: string, fallback = ''): string {
  const val = props[key];
  return typeof val === 'string' ? val : fallback;
}

function propArray(props: Readonly<Record<string, unknown>>, key: string): readonly unknown[] {
  const val = props[key];
  return Array.isArray(val) ? val : [];
}

function styleString(style: Readonly<Record<string, unknown>> | undefined, key: string, fallback: string): string {
  const val = style?.[key];
  return typeof val === 'string' ? val : fallback;
}

function styleNumber(style: Readonly<Record<string, unknown>> | undefined, key: string, fallback: number): number {
  const val = style?.[key];
  return typeof val === 'number' ? val : fallback;
}

function styleFontWeight(
  style: Readonly<Record<string, unknown>> | undefined,
  fallback: DrawTextCommand['fontWeight'],
): DrawTextCommand['fontWeight'] {
  const val = style?.['fontWeight'];
  if (val === 'bold' || val === 'normal') return val;
  if (val === 700 || val === '700') return 'bold';
  return fallback;
}

// ─── Per-element command generators ──────────────────────────────────────────

/**
 * Converts a title or subtitle element into a DrawTextCommand.
 */
function generateTextCommand(
  element: LayoutElement,
  fontSize: number,
  fontWeight: DrawTextCommand['fontWeight'],
  ctx: DisplayContext,
): DrawTextCommand {
  const style = element.style;
  return {
    kind: 'draw-text',
    sourceNodeId: element.nodeId,
    text: propString(element.props, 'text', '(untitled)'),
    font: styleString(style, 'fontFamily', ctx.defaultFont),
    fontSize: styleNumber(style, 'fontSize', fontSize),
    fontWeight: styleFontWeight(style, fontWeight),
    lineHeight: styleNumber(style, 'lineHeight', DEFAULT_LINE_HEIGHT),
    color: styleString(style, 'color', ctx.defaultColor),
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: 0,
    opacity: styleNumber(style, 'opacity', ctx.defaultOpacity),
    textAlign: (styleString(style, 'alignment', 'left') as DrawTextCommand['textAlign']) || 'left',
  };
}

/**
 * Converts a divider element into a DrawLineCommand spanning the full width.
 */
function generateDividerCommand(element: LayoutElement, ctx: DisplayContext): DrawLineCommand {
  const midY = element.y + element.height / 2;
  return {
    kind: 'draw-line',
    sourceNodeId: element.nodeId,
    x1: element.x,
    y1: midY,
    x2: element.x + element.width,
    y2: midY,
    color: styleString(element.style, 'borderColor', DEFAULT_DIVIDER_COLOR),
    width: styleNumber(element.style, 'borderWidth', 0.5),
    opacity: ctx.defaultOpacity,
  };
}

/**
 * Converts a section element into a structural DrawRectangleCommand.
 * Rendered with no fill and no border by default — purely structural.
 * Renderers that want section backgrounds can detect the 'section' source type
 * and apply their own styling.
 */
function generateSectionCommand(element: LayoutElement, ctx: DisplayContext): DrawRectangleCommand {
  return {
    kind: 'draw-rectangle',
    sourceNodeId: element.nodeId,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    fillColor: null,
    borderColor: null,
    borderWidth: 0,
    cornerRadius: 0,
    opacity: ctx.defaultOpacity,
  };
}

/**
 * Converts a header element into a DrawRectangleCommand with a light background.
 */
function generateHeaderCommand(element: LayoutElement, ctx: DisplayContext): DrawRectangleCommand {
  return {
    kind: 'draw-rectangle',
    sourceNodeId: element.nodeId,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    fillColor: styleString(element.style, 'background', DEFAULT_ACCENT_BACKGROUND),
    borderColor: styleString(element.style, 'borderColor', DEFAULT_BORDER_COLOR),
    borderWidth: styleNumber(element.style, 'borderWidth', 0.5),
    cornerRadius: styleNumber(element.style, 'borderRadius', 0),
    opacity: ctx.defaultOpacity,
  };
}

function generateFooterCommand(element: LayoutElement, ctx: DisplayContext): DrawRectangleCommand {
  return {
    kind: 'draw-rectangle',
    sourceNodeId: element.nodeId,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    fillColor: styleString(element.style, 'background', DEFAULT_ACCENT_BACKGROUND),
    borderColor: styleString(element.style, 'borderColor', DEFAULT_BORDER_COLOR),
    borderWidth: styleNumber(element.style, 'borderWidth', 0.5),
    cornerRadius: styleNumber(element.style, 'borderRadius', 0),
    opacity: ctx.defaultOpacity,
  };
}

/**
 * Converts an icon element into a placeholder rectangle + label.
 */
function generateIconCommands(
  element: LayoutElement,
  ctx: DisplayContext,
): [DrawRectangleCommand, DrawTextCommand] {
  const background: DrawRectangleCommand = {
    kind: 'draw-rectangle',
    sourceNodeId: element.nodeId,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    fillColor: '#f0f0f0',
    borderColor: DEFAULT_BORDER_COLOR,
    borderWidth: 0.5,
    cornerRadius: 4,
    opacity: ctx.defaultOpacity,
  };

  const label: DrawTextCommand = {
    kind: 'draw-text',
    sourceNodeId: element.nodeId,
    text: propString(element.props, 'name', 'icon'),
    font: ctx.defaultFont,
    fontSize: Math.min(ctx.defaultFontSize, element.height * 0.4),
    fontWeight: 'normal',
    lineHeight: DEFAULT_LINE_HEIGHT,
    color: '#666666',
    x: element.x + 4,
    y: element.y + element.height / 2 - ctx.defaultFontSize * 0.4,
    width: element.width - 8,
    height: element.height,
    rotation: 0,
    opacity: ctx.defaultOpacity,
    textAlign: 'center',
  };

  return [background, label];
}

function generateMetricCardCommands(
  element: LayoutElement,
  ctx: DisplayContext,
): [DrawRectangleCommand, DrawTextCommand, DrawTextCommand] {
  const labelKey = element.type === 'kpi' ? 'name' : 'label';
  const normalized: LayoutElement = {
    ...element,
    props: {
      ...element.props,
      label: propString(element.props, labelKey, ''),
    },
  };
  return generateSummaryCardCommands(normalized, ctx);
}

function generateBadgeCommands(
  element: LayoutElement,
  ctx: DisplayContext,
): [DrawRectangleCommand, DrawTextCommand] {
  const background: DrawRectangleCommand = {
    kind: 'draw-rectangle',
    sourceNodeId: element.nodeId,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    fillColor: '#eef2ff',
    borderColor: '#c7d2fe',
    borderWidth: 0.5,
    cornerRadius: element.height / 2,
    opacity: ctx.defaultOpacity,
  };

  const label: DrawTextCommand = {
    kind: 'draw-text',
    sourceNodeId: element.nodeId,
    text: propString(element.props, 'text', ''),
    font: ctx.defaultFont,
    fontSize: ctx.defaultFontSize * 0.85,
    fontWeight: 'bold',
    lineHeight: DEFAULT_LINE_HEIGHT,
    color: '#3730a3',
    x: element.x + 8,
    y: element.y + element.height / 2 - ctx.defaultFontSize * 0.4,
    width: element.width - 16,
    height: element.height,
    rotation: 0,
    opacity: ctx.defaultOpacity,
    textAlign: 'center',
  };

  return [background, label];
}

function generateInfoBoxCommands(
  element: LayoutElement,
  ctx: DisplayContext,
  fillColor: string,
  borderColor: string,
): [DrawRectangleCommand, DrawTextCommand] {
  const background: DrawRectangleCommand = {
    kind: 'draw-rectangle',
    sourceNodeId: element.nodeId,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    fillColor,
    borderColor,
    borderWidth: 0.5,
    cornerRadius: 4,
    opacity: ctx.defaultOpacity,
  };

  const title = propString(element.props, 'title', '');
  const message = propString(element.props, 'message', '');
  const text = title.length > 0 ? `${title}\n${message}` : message;

  const label: DrawTextCommand = {
    kind: 'draw-text',
    sourceNodeId: element.nodeId,
    text,
    font: ctx.defaultFont,
    fontSize: ctx.defaultFontSize,
    fontWeight: 'normal',
    lineHeight: DEFAULT_LINE_HEIGHT,
    color: ctx.defaultColor,
    x: element.x + 10,
    y: element.y + 10,
    width: element.width - 20,
    height: element.height - 20,
    rotation: 0,
    opacity: ctx.defaultOpacity,
    textAlign: 'left',
  };

  return [background, label];
}

/**
 * Converts a table element into a DrawTableCommand.
 * The renderer is responsible for decomposing this into individual row/cell draws.
 */
function generateTableCommand(element: LayoutElement, ctx: DisplayContext): DrawTableCommand {
  const tableLayout = element.props['tableLayout'];
  return {
    kind: 'draw-table',
    sourceNodeId: element.nodeId,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    columns: propArray(element.props, 'columns'),
    rows: propArray(element.props, 'rows'),
    ...(tableLayout !== undefined && typeof tableLayout === 'object'
      ? { tableLayout: tableLayout as Record<string, unknown> }
      : {}),
    opacity: ctx.defaultOpacity,
  };
}

/**
 * Converts an image element into a DrawImageCommand.
 * Uses a placeholder src when the prop is missing.
 */
function generateImageCommand(element: LayoutElement, ctx: DisplayContext): DrawImageCommand {
  return {
    kind: 'draw-image',
    sourceNodeId: element.nodeId,
    src: propString(element.props, 'src', ''),
    alt: propString(element.props, 'alt', ''),
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: 0,
    opacity: ctx.defaultOpacity,
  };
}

/**
 * Converts a chart element into a placeholder DrawRectangle + DrawText.
 * A future milestone will replace this with real chart rendering commands.
 */
function generateChartCommands(
  element: LayoutElement,
  ctx: DisplayContext,
): [DrawRectangleCommand, DrawTextCommand] {
  const background: DrawRectangleCommand = {
    kind: 'draw-rectangle',
    sourceNodeId: element.nodeId,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    fillColor: '#f0f4ff',
    borderColor: DEFAULT_BORDER_COLOR,
    borderWidth: 0.5,
    cornerRadius: 2,
    opacity: ctx.defaultOpacity,
  };

  const chartTitle = propString(element.props, 'title', '');
  const label: DrawTextCommand = {
    kind: 'draw-text',
    sourceNodeId: element.nodeId,
    text: chartTitle.length > 0 ? `Chart: ${chartTitle}` : 'Chart (placeholder)',
    font: ctx.defaultFont,
    fontSize: ctx.defaultFontSize,
    fontWeight: 'normal',
    lineHeight: DEFAULT_LINE_HEIGHT,
    color: '#888888',
    x: element.x + 8,
    y: element.y + element.height / 2 - ctx.defaultFontSize / 2,
    width: element.width - 16,
    height: ctx.defaultFontSize * DEFAULT_LINE_HEIGHT,
    rotation: 0,
    opacity: ctx.defaultOpacity,
    textAlign: 'center',
  };

  return [background, label];
}

/**
 * Converts a summary-card element into a DrawRectangle + two DrawText commands.
 */
function generateSummaryCardCommands(
  element: LayoutElement,
  ctx: DisplayContext,
): [DrawRectangleCommand, DrawTextCommand, DrawTextCommand] {
  const background: DrawRectangleCommand = {
    kind: 'draw-rectangle',
    sourceNodeId: element.nodeId,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    fillColor: styleString(element.style, 'background', '#ffffff'),
    borderColor: styleString(element.style, 'borderColor', DEFAULT_BORDER_COLOR),
    borderWidth: styleNumber(element.style, 'borderWidth', 0.5),
    cornerRadius: styleNumber(element.style, 'borderRadius', 4),
    opacity: ctx.defaultOpacity,
  };

  const label: DrawTextCommand = {
    kind: 'draw-text',
    sourceNodeId: element.nodeId,
    text: propString(element.props, 'label', ''),
    font: styleString(element.style, 'fontFamily', ctx.defaultFont),
    fontSize: styleNumber(element.style, 'fontSize', ctx.defaultFontSize),
    fontWeight: styleFontWeight(element.style, 'normal'),
    lineHeight: DEFAULT_LINE_HEIGHT,
    color: styleString(element.style, 'color', '#888888'),
    x: element.x + 8,
    y: element.y + 8,
    width: element.width - 16,
    height: ctx.defaultFontSize * DEFAULT_LINE_HEIGHT,
    rotation: 0,
    opacity: ctx.defaultOpacity,
    textAlign: 'left',
  };

  const valueFontSize = styleNumber(element.style, 'fontSize', ctx.defaultFontSize * 1.5);
  const value: DrawTextCommand = {
    kind: 'draw-text',
    sourceNodeId: element.nodeId,
    text: propString(element.props, 'value', ''),
    font: styleString(element.style, 'fontFamily', ctx.defaultFont),
    fontSize: valueFontSize,
    fontWeight: styleFontWeight(element.style, 'bold'),
    lineHeight: DEFAULT_LINE_HEIGHT,
    color: styleString(element.style, 'color', ctx.defaultColor),
    x: element.x + 8,
    y: element.y + 8 + ctx.defaultFontSize * DEFAULT_LINE_HEIGHT + 4,
    width: element.width - 16,
    height: valueFontSize * DEFAULT_LINE_HEIGHT,
    rotation: 0,
    opacity: ctx.defaultOpacity,
    textAlign: 'left',
  };

  return [background, label, value];
}

/**
 * Converts a qr-code element into a DrawQRCodeCommand.
 */
function generateQRCodeCommand(element: LayoutElement, ctx: DisplayContext): DrawQRCodeCommand {
  return {
    kind: 'draw-qr-code',
    sourceNodeId: element.nodeId,
    value: propString(element.props, 'value', ''),
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    opacity: ctx.defaultOpacity,
  };
}

/**
 * Converts a barcode element into a DrawBarcodeCommand.
 */
function generateBarcodeCommand(element: LayoutElement, ctx: DisplayContext): DrawBarcodeCommand {
  return {
    kind: 'draw-barcode',
    sourceNodeId: element.nodeId,
    value: propString(element.props, 'value', ''),
    format: propString(element.props, 'format', 'CODE128'),
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    opacity: ctx.defaultOpacity,
  };
}

// ─── Element → commands dispatcher ────────────────────────────────────────────

/**
 * Converts a single `LayoutElement` to one or more `DisplayCommand` objects.
 *
 * Each component type maps to a specific drawing strategy:
 *
 * | Element type  | Commands generated                                 |
 * |---------------|----------------------------------------------------|
 * | title         | DrawText (bold, large font)                        |
 * | subtitle      | DrawText (bold, medium font)                       |
 * | paragraph     | DrawText (normal weight, body font)                |
 * | divider       | DrawLine (horizontal rule)                         |
 * | section       | DrawRectangle (structural, transparent)            |
 * | header        | DrawRectangle (light background with bottom border)|
 * | footer        | DrawRectangle (light background with top border)   |
 * | table         | DrawTable (placeholder — renderer decomposes)      |
 * | image         | DrawImage (placeholder with empty src if missing)  |
 * | chart         | DrawRectangle + DrawText (placeholder)             |
 * | summary-card  | DrawRectangle + DrawText × 2 (label + value)       |
 * | qr-code       | DrawQRCode (placeholder — renderer encodes)        |
 * | barcode       | DrawBarcode (placeholder — renderer encodes)       |
 * | unknown       | [] (empty — logged as a warning)                   |
 */
function elementToCommands(element: LayoutElement, ctx: DisplayContext): DisplayCommand[] {
  switch (element.type) {
    case 'title':
      return [generateTextCommand(element, DEFAULT_FONT_SIZE_TITLE, 'bold', ctx)];

    case 'subtitle':
      return [generateTextCommand(element, DEFAULT_FONT_SIZE_SUBTITLE, 'bold', ctx)];

    case 'heading':
      return [generateTextCommand(element, DEFAULT_FONT_SIZE_SUBTITLE, 'bold', ctx)];

    case 'paragraph':
      return [generateTextCommand(element, ctx.defaultFontSize, 'normal', ctx)];

    case 'caption':
    case 'label':
      return [generateTextCommand(element, ctx.defaultFontSize * 0.85, 'normal', ctx)];

    case 'divider':
      return [generateDividerCommand(element, ctx)];

    case 'spacer':
      return [];

    case 'section':
    case 'container':
    case 'stack':
    case 'row':
      return [generateSectionCommand(element, ctx)];

    case 'header':
      return [generateHeaderCommand(element, ctx)];

    case 'footer':
      return [generateFooterCommand(element, ctx)];

    case 'table':
      return [generateTableCommand(element, ctx)];

    case 'image':
      return [generateImageCommand(element, ctx)];

    case 'logo':
      return [generateImageCommand(element, ctx)];

    case 'icon':
      return [...generateIconCommands(element, ctx)];

    case 'chart':
      return [...generateChartCommands(element, ctx)];

    case 'summary-card':
      return [...generateSummaryCardCommands(element, ctx)];

    case 'metric-card':
    case 'kpi':
      return [...generateMetricCardCommands(element, ctx)];

    case 'badge':
    case 'status-pill':
      return [...generateBadgeCommands(element, ctx)];

    case 'info-box':
      return [...generateInfoBoxCommands(element, ctx, '#f0f7ff', '#336699')];

    case 'alert-box':
      return [...generateInfoBoxCommands(element, ctx, '#fff8e6', '#b8860b')];

    case 'qr-code':
      return [generateQRCodeCommand(element, ctx)];

    case 'barcode':
      return [generateBarcodeCommand(element, ctx)];

    default:
      // Unknown component type — emit no commands.
      // A future plugin system will register custom element-to-command converters.
      return [];
  }
}

// ─── Resolved options ─────────────────────────────────────────────────────────

function resolveOptions(options: DisplayListOptions): Required<DisplayListOptions> {
  return {
    defaultFont: options.defaultFont ?? DEFAULT_FONT,
    defaultFontSize: options.defaultFontSize ?? DEFAULT_FONT_SIZE,
    defaultColor: options.defaultColor ?? DEFAULT_COLOR,
    defaultOpacity: options.defaultOpacity ?? DEFAULT_OPACITY,
    optimizeEmptyCommands: options.optimizeEmptyCommands ?? true,
    optimizeInvisibleCommands: options.optimizeInvisibleCommands ?? true,
    validateCommands: options.validateCommands ?? true,
  };
}

// ─── DisplayListGenerator class ───────────────────────────────────────────────

/**
 * Converts a `LayoutOutput` (from the layout engine) into a renderer-independent
 * `DisplayList` of atomic drawing commands.
 *
 * ## Position in the pipeline
 *
 * ```
 * LayoutEngine.layout()  →  LayoutOutput
 *                                ↓
 * DisplayListGenerator.generate()  →  DisplayList
 *                                          ↓
 * IRenderer.render()  →  bytes
 * ```
 *
 * ## Renderer independence
 *
 * The `DisplayListGenerator` produces format-agnostic output. It never imports
 * PDF libraries, Canvas APIs, or HTML serialization code. All coordinates are
 * in points (pt).
 *
 * ## Usage
 *
 * ```typescript
 * import { DisplayListGenerator } from '@reportforge/display-list';
 * import { LayoutEngine } from '@reportforge/layout';
 *
 * const layoutEngine = new LayoutEngine();
 * const generator = new DisplayListGenerator();
 *
 * const layout = layoutEngine.layout(report);
 * const displayList = generator.generate(layout);
 *
 * console.log(displayList.pages);         // DisplayPage[]
 * console.log(displayList.commandCount);  // total draw calls
 * ```
 */
export class DisplayListGenerator {
  /** Unique name for this generator implementation. */
  readonly name = 'reportforge-display-list-generator' as const;

  /**
   * Generates a Display List from a `LayoutOutput`.
   *
   * Steps:
   * 1. For each page, convert every `LayoutElement` to drawing commands.
   * 2. Run the optimizer (removes empty / invisible commands).
   * 3. Optionally validate the generated commands.
   *
   * @param layout - The laid-out document from `LayoutEngine.layout()`.
   * @param options - Optional overrides for font, color, and pass control.
   * @throws {DisplayListError} If validation is enabled and errors are found.
   */
  generate(layout: LayoutOutput, options: DisplayListOptions = {}): DisplayList {
    const resolved = resolveOptions(options);

    // Convert each page's elements to commands.
    const rawPages: DisplayPage[] = layout.pages.map((page) => {
      const ctx = buildContext(page.width, page.height, resolved);
      const commands: DisplayCommand[] = [];

      for (const element of page.elements) {
        commands.push(...elementToCommands(element, ctx));
      }

      return {
        pageNumber: page.pageNumber,
        width: page.width,
        height: page.height,
        commands,
      };
    });

    // Run optimizer passes.
    const optimizerOptions: OptimizerOptions = {
      skipEmptyCommands: resolved.optimizeEmptyCommands,
      skipInvisibleCommands: resolved.optimizeInvisibleCommands,
    };
    const optimizedPages = optimizePages(rawPages, optimizerOptions);

    // Count total commands across all pages.
    const commandCount = optimizedPages.reduce((sum, p) => sum + p.commands.length, 0);

    const displayList: DisplayList = {
      pages: optimizedPages,
      metadata: { ...layout.metadata },
      commandCount,
    };

    // Validate generated commands if enabled.
    if (resolved.validateCommands) {
      const result = validateDisplayList(displayList);
      if (!result.valid) {
        const errorIssues = result.issues.filter((i) => i.severity === 'error');
        const firstError = errorIssues[0];
        if (firstError !== undefined) {
          throw new DisplayListError(
            `Display list validation failed with ${errorIssues.length.toString()} error(s). ` +
              `First: [${firstError.commandKind}] node '${firstError.nodeId}': ${firstError.message}`,
          );
        }
      }
    }

    return displayList;
  }
}
