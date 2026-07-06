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
  return {
    kind: 'draw-text',
    sourceNodeId: element.nodeId,
    text: propString(element.props, 'text', '(untitled)'),
    font: ctx.defaultFont,
    fontSize,
    fontWeight,
    lineHeight: DEFAULT_LINE_HEIGHT,
    color: ctx.defaultColor,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: 0,
    opacity: ctx.defaultOpacity,
    textAlign: 'left',
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
    color: DEFAULT_DIVIDER_COLOR,
    width: 0.5,
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
    fillColor: DEFAULT_ACCENT_BACKGROUND,
    borderColor: DEFAULT_BORDER_COLOR,
    borderWidth: 0.5,
    cornerRadius: 0,
    opacity: ctx.defaultOpacity,
  };
}

/**
 * Converts a footer element into a DrawRectangleCommand with a light background.
 */
function generateFooterCommand(element: LayoutElement, ctx: DisplayContext): DrawRectangleCommand {
  return {
    kind: 'draw-rectangle',
    sourceNodeId: element.nodeId,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    fillColor: DEFAULT_ACCENT_BACKGROUND,
    borderColor: DEFAULT_BORDER_COLOR,
    borderWidth: 0.5,
    cornerRadius: 0,
    opacity: ctx.defaultOpacity,
  };
}

/**
 * Converts a table element into a DrawTableCommand.
 * The renderer is responsible for decomposing this into individual row/cell draws.
 */
function generateTableCommand(element: LayoutElement, ctx: DisplayContext): DrawTableCommand {
  return {
    kind: 'draw-table',
    sourceNodeId: element.nodeId,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    columns: propArray(element.props, 'columns'),
    rows: propArray(element.props, 'rows'),
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
    fillColor: '#ffffff',
    borderColor: DEFAULT_BORDER_COLOR,
    borderWidth: 0.5,
    cornerRadius: 4,
    opacity: ctx.defaultOpacity,
  };

  const label: DrawTextCommand = {
    kind: 'draw-text',
    sourceNodeId: element.nodeId,
    text: propString(element.props, 'label', ''),
    font: ctx.defaultFont,
    fontSize: ctx.defaultFontSize,
    fontWeight: 'normal',
    lineHeight: DEFAULT_LINE_HEIGHT,
    color: '#888888',
    x: element.x + 8,
    y: element.y + 8,
    width: element.width - 16,
    height: ctx.defaultFontSize * DEFAULT_LINE_HEIGHT,
    rotation: 0,
    opacity: ctx.defaultOpacity,
    textAlign: 'left',
  };

  const valueFontSize = ctx.defaultFontSize * 1.5;
  const value: DrawTextCommand = {
    kind: 'draw-text',
    sourceNodeId: element.nodeId,
    text: propString(element.props, 'value', ''),
    font: ctx.defaultFont,
    fontSize: valueFontSize,
    fontWeight: 'bold',
    lineHeight: DEFAULT_LINE_HEIGHT,
    color: ctx.defaultColor,
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

    case 'paragraph':
      return [generateTextCommand(element, ctx.defaultFontSize, 'normal', ctx)];

    case 'divider':
      return [generateDividerCommand(element, ctx)];

    case 'section':
      return [generateSectionCommand(element, ctx)];

    case 'header':
      return [generateHeaderCommand(element, ctx)];

    case 'footer':
      return [generateFooterCommand(element, ctx)];

    case 'table':
      return [generateTableCommand(element, ctx)];

    case 'image':
      return [generateImageCommand(element, ctx)];

    case 'chart':
      return [...generateChartCommands(element, ctx)];

    case 'summary-card':
      return [...generateSummaryCardCommands(element, ctx)];

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
