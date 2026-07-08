/**
 * @reportforge/render
 *
 * Unified Renderer SDK for ReportForge.
 */

export type { RendererCapabilities } from './capabilities.js';
export { DEFAULT_RENDERER_CAPABILITIES } from './capabilities.js';

export type {
  Point2D,
  TextOperation,
  RectangleOperation,
  LineOperation,
  ImageOperation,
  PathOperation,
  CircleOperation,
  EllipseOperation,
  PolygonOperation,
  GroupOperation,
  ClipOperation,
  TransformOperation,
  TableOperation,
  RenderOperation,
  RenderOperationType,
} from './operations.js';

export type {
  RenderPage,
  RenderDocument,
  RenderContext,
  RenderOptions,
  RenderResult,
} from './context.js';

export {
  displayCommandToOperations,
  displayListToRenderDocument,
  ptToPx,
  escapeHtml,
  encodeUtf8,
} from './convert.js';

export { Renderer, StringRenderer } from './renderer.js';
export { RendererRegistry, defaultRendererRegistry } from './registry.js';

export const PACKAGE_NAME = '@reportforge/render' as const;

export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}
