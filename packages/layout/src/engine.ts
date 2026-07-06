import type {
  ILayoutEngine,
  IReportNode,
  ITheme,
  LayoutElement,
  LayoutInput,
  LayoutPage,
  ReportSchema,
} from '@reportforge/shared';

import { ZERO_BOX_MODEL } from './box.js';
import { DEFAULT_LAYOUT_THEME } from './default-theme.js';
import { estimateNodeHeight } from './estimators.js';
import { LayoutError } from './errors.js';
import { createPageModel } from './page.js';
import type { PageModel } from './page.js';
import type { LayoutNode, LayoutResult } from './types.js';

// ─── Input normalization ──────────────────────────────────────────────────────

/**
 * All input forms accepted by `LayoutEngine.layout()`.
 *
 * - `LayoutInput` — explicit schema + theme (the `ILayoutEngine` interface form)
 * - `ReportSchema` — raw schema; uses `DEFAULT_LAYOUT_THEME`
 * - `{ toJSON(): ReportSchema }` — any builder-like object; calls `.toJSON()` and uses the default theme
 */
type LayoutEngineInput = LayoutInput | ReportSchema | { toJSON(): ReportSchema };

function isLayoutInput(input: LayoutEngineInput): input is LayoutInput {
  return input !== null && typeof input === 'object' && 'schema' in input && 'theme' in input;
}

function isSchemaSource(input: LayoutEngineInput): input is { toJSON(): ReportSchema } {
  return (
    input !== null &&
    typeof input === 'object' &&
    'toJSON' in input &&
    typeof (input as Record<string, unknown>)['toJSON'] === 'function'
  );
}

function normalizeInput(input: LayoutEngineInput): LayoutInput {
  if (isLayoutInput(input)) return input;
  if (isSchemaSource(input)) return { schema: input.toJSON(), theme: DEFAULT_LAYOUT_THEME };
  // After the two guards, input is narrowed to ReportSchema by TypeScript's control flow.
  return { schema: input, theme: DEFAULT_LAYOUT_THEME };
}

// ─── Internal layout state ────────────────────────────────────────────────────

/**
 * Mutable cursor tracking position within the layout run.
 * The `y` value is relative to the top of the content area (below the header).
 */
interface LayoutCursor {
  pageNumber: number;
  y: number;
}

/**
 * All state needed during a single layout pass.
 * Created once per `layout()` call and never escapes the call.
 */
interface LayoutState {
  readonly cursor: LayoutCursor;
  /** Per-page flat lists of positioned leaf elements. */
  readonly pageElements: Map<number, LayoutNode[]>;
  /** Accumulated top-level layout nodes for LayoutResult.nodes. */
  readonly topLevelNodes: LayoutNode[];
  readonly pageModel: PageModel;
  /** Available height for content on each page (content area minus header/footer). */
  readonly availableContentHeight: number;
  readonly headerHeight: number;
  readonly theme: ITheme;
  /** Vertical gap between sibling elements. */
  readonly interElementSpacing: number;
}

function createState(
  pageModel: PageModel,
  headerHeight: number,
  footerHeight: number,
  theme: ITheme,
): LayoutState {
  const availableContentHeight = pageModel.contentHeight - headerHeight - footerHeight;
  return {
    cursor: { pageNumber: 1, y: 0 },
    pageElements: new Map<number, LayoutNode[]>(),
    topLevelNodes: [],
    pageModel,
    availableContentHeight,
    headerHeight,
    theme,
    interElementSpacing: theme.tokens.spacing.component,
  };
}

function ensurePage(state: LayoutState, pageNumber: number): void {
  if (!state.pageElements.has(pageNumber)) {
    state.pageElements.set(pageNumber, []);
  }
}

function addToPage(state: LayoutState, node: LayoutNode): void {
  ensurePage(state, node.pageNumber);
  const page = state.pageElements.get(node.pageNumber);
  if (page !== undefined) {
    page.push(node);
  }
}

function advancePage(state: LayoutState): void {
  state.cursor.pageNumber += 1;
  state.cursor.y = 0;
  ensurePage(state, state.cursor.pageNumber);
}

// ─── Node layout ─────────────────────────────────────────────────────────────

/**
 * Computes the absolute Y position of the current cursor.
 * Content starts at marginTop + headerHeight.
 */
function absoluteY(state: LayoutState): number {
  return state.pageModel.marginTop + state.headerHeight + state.cursor.y;
}

/**
 * Lays out a leaf node (title, paragraph, divider, table, image, etc.).
 *
 * Algorithm:
 * 1. Estimate the node height.
 * 2. If it does not fit on the remaining page space AND we are not already
 *    at the top of a page, advance to the next page.
 * 3. Place the node at the current cursor position.
 * 4. Advance the cursor by height + inter-element spacing.
 *
 * If a single node is taller than the entire available content area
 * (e.g. a very tall table), it is placed at the top of a fresh page and
 * allowed to overflow — the caller is expected to validate this separately.
 */
function layoutLeafNode(node: IReportNode, state: LayoutState): LayoutNode {
  const { pageModel, cursor, interElementSpacing, theme } = state;

  const height = estimateNodeHeight(node, pageModel.contentWidth, theme);

  // Advance to next page when the node would overflow AND we are past the top.
  if (cursor.y + height > state.availableContentHeight && cursor.y > 0) {
    advancePage(state);
  }

  const layoutNode: LayoutNode = {
    id: node.id,
    type: node.type,
    pageNumber: cursor.pageNumber,
    x: pageModel.marginLeft,
    y: absoluteY(state),
    width: pageModel.contentWidth,
    height,
    box: ZERO_BOX_MODEL,
    props: node.props,
    style: node.style ?? {},
    children: [],
  };

  addToPage(state, layoutNode);
  cursor.y += height + interElementSpacing;

  return layoutNode;
}

/**
 * Lays out a section node by recursively laying out its children in the
 * normal vertical flow, then wrapping them in a section `LayoutNode`.
 *
 * The section's reported position is the position of its first child.
 * Its reported height is the sum of its children's heights.
 *
 * Sections can span multiple pages — in that case the section `LayoutNode`
 * in `LayoutResult.nodes` reflects the start-page position only.
 * The flat `pages.elements` list contains all children on their respective pages.
 */
function layoutSectionNode(node: IReportNode, state: LayoutState): LayoutNode {
  const sectionStartPage = state.cursor.pageNumber;
  const sectionStartY = absoluteY(state);

  // Layout children in the normal flow.
  const childNodes: LayoutNode[] = [];
  for (const child of node.children) {
    const childLayoutNode = layoutSchemaNode(child, state);
    childNodes.push(childLayoutNode);
  }

  // Compute section bounds from children.
  const childrenHeight = childNodes.reduce(
    (acc, c) => acc + c.height + state.interElementSpacing,
    0,
  );
  const sectionHeight = Math.max(childrenHeight - state.interElementSpacing, 0);

  return {
    id: node.id,
    type: node.type,
    pageNumber: sectionStartPage,
    x: state.pageModel.marginLeft,
    y: sectionStartY,
    width: state.pageModel.contentWidth,
    height: sectionHeight,
    box: ZERO_BOX_MODEL,
    props: node.props,
    style: node.style ?? {},
    children: childNodes,
  };
}

/**
 * Dispatches layout for a single schema node to the appropriate handler.
 */
function layoutSchemaNode(node: IReportNode, state: LayoutState): LayoutNode {
  if (node.type === 'section') {
    return layoutSectionNode(node, state);
  }
  return layoutLeafNode(node, state);
}

// ─── Header / footer placement ────────────────────────────────────────────────

/**
 * Creates a `LayoutNode` for a header on a specific page.
 * Headers are positioned at (marginLeft, marginTop) and span the full content width.
 */
function layoutHeaderOnPage(
  node: IReportNode,
  pageNumber: number,
  pageModel: PageModel,
  height: number,
): LayoutNode {
  return {
    id: `${node.id}-p${pageNumber.toString()}`,
    type: node.type,
    pageNumber,
    x: pageModel.marginLeft,
    y: pageModel.marginTop,
    width: pageModel.contentWidth,
    height,
    box: ZERO_BOX_MODEL,
    props: node.props,
    style: node.style ?? {},
    children: [],
  };
}

/**
 * Creates a `LayoutNode` for a footer on a specific page.
 * Footers are anchored to the bottom of the page, above the bottom margin.
 */
function layoutFooterOnPage(
  node: IReportNode,
  pageNumber: number,
  pageModel: PageModel,
  height: number,
): LayoutNode {
  return {
    id: `${node.id}-p${pageNumber.toString()}`,
    type: node.type,
    pageNumber,
    x: pageModel.marginLeft,
    y: pageModel.pageHeight - pageModel.marginBottom - height,
    width: pageModel.contentWidth,
    height,
    box: ZERO_BOX_MODEL,
    props: node.props,
    style: node.style ?? {},
    children: [],
  };
}

// ─── Page assembly ────────────────────────────────────────────────────────────

function toLayoutElement(node: LayoutNode): LayoutElement {
  return {
    nodeId: node.id,
    type: node.type,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    props: node.props,
    style: node.style,
  };
}

/**
 * Builds the final array of `LayoutPage` objects from the accumulated state.
 * Adds repeated header/footer elements to every page.
 */
function buildPages(
  state: LayoutState,
  pageModel: PageModel,
  headerNode: IReportNode | undefined,
  footerNode: IReportNode | undefined,
  headerHeight: number,
  footerHeight: number,
): LayoutPage[] {
  const totalPages = state.cursor.pageNumber;
  const pages: LayoutPage[] = [];

  for (let p = 1; p <= totalPages; p++) {
    const leafNodes = state.pageElements.get(p) ?? [];
    const elements: LayoutElement[] = leafNodes.map(toLayoutElement);

    // Prepend header to every page.
    if (headerNode !== undefined) {
      elements.unshift(toLayoutElement(layoutHeaderOnPage(headerNode, p, pageModel, headerHeight)));
    }

    // Append footer to every page.
    if (footerNode !== undefined) {
      elements.push(toLayoutElement(layoutFooterOnPage(footerNode, p, pageModel, footerHeight)));
    }

    pages.push({
      pageNumber: p,
      width: pageModel.pageWidth,
      height: pageModel.pageHeight,
      elements,
    });
  }

  return pages;
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates post-layout invariants.
 * Called before the result is returned to the caller.
 *
 * Detected issues:
 * - Negative page dimensions after applying margins
 * - Header + footer heights that consume the entire content area
 * - Nodes with negative computed heights (indicates an estimator bug)
 * - Nodes positioned outside page bounds (overflow warning)
 */
function validateLayout(
  pageModel: PageModel,
  availableContentHeight: number,
  nodes: readonly LayoutNode[],
): void {
  if (pageModel.contentWidth <= 0) {
    throw new LayoutError(
      `Content width is ${pageModel.contentWidth.toFixed(2)}pt — ` +
        `margins exceed page width. Reduce page margins or increase page size.`,
    );
  }

  if (pageModel.contentHeight <= 0) {
    throw new LayoutError(
      `Content height is ${pageModel.contentHeight.toFixed(2)}pt — ` +
        `margins exceed page height. Reduce page margins or increase page size.`,
    );
  }

  if (availableContentHeight <= 0) {
    throw new LayoutError(
      `Available content height is ${availableContentHeight.toFixed(2)}pt — ` +
        `header and footer together exceed the content area. ` +
        `Reduce header/footer content or increase the page size.`,
    );
  }

  validateNodes(nodes, pageModel);
}

function validateNodes(nodes: readonly LayoutNode[], pageModel: PageModel): void {
  for (const node of nodes) {
    if (node.height < 0) {
      throw new LayoutError(
        `Node '${node.id}' (type: ${node.type}) has a negative height: ${node.height.toFixed(2)}pt. ` +
          `This indicates an estimator error.`,
      );
    }

    if (node.width < 0) {
      throw new LayoutError(
        `Node '${node.id}' (type: ${node.type}) has a negative width: ${node.width.toFixed(2)}pt.`,
      );
    }

    if (node.x < 0) {
      throw new LayoutError(
        `Node '${node.id}' (type: ${node.type}) has a negative x position: ${node.x.toFixed(2)}pt. ` +
          `Invalid margin configuration.`,
      );
    }

    if (node.y < 0) {
      throw new LayoutError(
        `Node '${node.id}' (type: ${node.type}) has a negative y position: ${node.y.toFixed(2)}pt. ` +
          `Invalid margin configuration.`,
      );
    }

    if (node.x + node.width > pageModel.pageWidth + 0.5) {
      throw new LayoutError(
        `Node '${node.id}' (type: ${node.type}) overflows the page width: ` +
          `right edge at ${(node.x + node.width).toFixed(2)}pt, page width ${pageModel.pageWidth.toFixed(2)}pt.`,
      );
    }

    if (node.children.length > 0) {
      validateNodes(node.children, pageModel);
    }
  }
}

// ─── Core layout algorithm ────────────────────────────────────────────────────

/**
 * Runs the full layout algorithm for a schema and theme.
 *
 * Steps:
 * 1. Build the page model (dimensions, margins, content area).
 * 2. Identify header and footer nodes and estimate their heights.
 * 3. Walk content nodes vertically, paginating when content overflows.
 * 4. Place header/footer on every generated page.
 * 5. Validate layout invariants (no negative sizes, no impossible constraints).
 * 6. Assemble and return `LayoutResult`.
 */
function runLayout(schema: ReportSchema, theme: ITheme): LayoutResult {
  const pageModel = createPageModel(schema.metadata, theme);

  // Separate root children into header, footer, and content.
  const headerNode = schema.root.children.find((n) => n.type === 'header');
  const footerNode = schema.root.children.find((n) => n.type === 'footer');
  const contentNodes = schema.root.children.filter(
    (n) => n.type !== 'header' && n.type !== 'footer',
  );

  const headerHeight = headerNode
    ? estimateNodeHeight(headerNode, pageModel.contentWidth, theme)
    : 0;
  const footerHeight = footerNode
    ? estimateNodeHeight(footerNode, pageModel.contentWidth, theme)
    : 0;

  const availableContentHeight = pageModel.contentHeight - headerHeight - footerHeight;

  // Early validation before any layout work.
  if (pageModel.contentWidth <= 0) {
    throw new LayoutError(
      `Content width is ${pageModel.contentWidth.toFixed(2)}pt — margins exceed page width.`,
    );
  }
  if (availableContentHeight <= 0) {
    throw new LayoutError(
      `Available content height is ${availableContentHeight.toFixed(2)}pt — ` +
        `header and footer together exceed the content area.`,
    );
  }

  const state = createState(pageModel, headerHeight, footerHeight, theme);
  ensurePage(state, 1);

  // Layout each content node in document order.
  for (const node of contentNodes) {
    const layoutNode = layoutSchemaNode(node, state);
    state.topLevelNodes.push(layoutNode);
  }

  // Validate post-layout invariants.
  validateLayout(pageModel, availableContentHeight, state.topLevelNodes);

  // Build final pages (with header/footer).
  const pages = buildPages(state, pageModel, headerNode, footerNode, headerHeight, footerHeight);

  return {
    pages,
    metadata: { ...schema.metadata },
    nodes: state.topLevelNodes,
  };
}

// ─── LayoutEngine class ───────────────────────────────────────────────────────

/**
 * The ReportForge layout engine.
 *
 * Converts a validated report schema into a `LayoutResult` containing:
 * - Absolute positions and dimensions for every content node
 * - Per-page flat element lists ready for renderers
 * - A hierarchical `LayoutNode` tree for advanced consumers
 *
 * Implements `ILayoutEngine` from `@reportforge/shared`.
 *
 * ## Rendering pipeline position
 *
 * ```
 * Report Schema (validated)
 *       ↓
 * LayoutEngine.layout()
 *       ↓
 * LayoutResult (positioned pages)
 *       ↓
 * IRenderer.render()
 * ```
 *
 * ## Usage
 *
 * With explicit theme:
 * ```typescript
 * const engine = new LayoutEngine();
 * const result = engine.layout({ schema: report.toJSON(), theme: myTheme });
 * console.log(result.pages);
 * ```
 *
 * With default theme (convenience):
 * ```typescript
 * const result = engine.layout(report.toJSON());
 * // or, if report is a ReportBuilder:
 * const result = engine.layout(report);
 * ```
 */
export class LayoutEngine implements ILayoutEngine {
  readonly name = 'reportforge-layout-engine' as const;

  /**
   * Lays out a report schema and returns positioned pages.
   *
   * Accepts three input forms for flexibility:
   * - `LayoutInput` — full input with explicit schema and theme
   * - `ReportSchema` — raw schema; `DEFAULT_LAYOUT_THEME` is used
   * - `{ toJSON(): ReportSchema }` — any builder-like object; `.toJSON()` is called
   *
   * @throws {LayoutError} When layout constraints are impossible to satisfy.
   *
   * @example
   * // With explicit theme
   * engine.layout({ schema: report.toJSON(), theme: corporateTheme })
   *
   * @example
   * // With default theme — schema only
   * engine.layout(report.toJSON())
   *
   * @example
   * // Directly from a ReportBuilder (builder has toJSON())
   * engine.layout(report)
   */
  layout(input: LayoutInput): LayoutResult;
  layout(schema: ReportSchema): LayoutResult;
  layout(source: { toJSON(): ReportSchema }): LayoutResult;
  layout(input: LayoutEngineInput): LayoutResult {
    const { schema, theme } = normalizeInput(input);
    return runLayout(schema, theme);
  }
}
