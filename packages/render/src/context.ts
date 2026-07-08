import type { DisplayList } from '@reportforge/display-list';

import type { RenderOperation } from './operations.js';

/** A single page in the render document. */
export interface RenderPage {
  readonly pageNumber: number;
  readonly width: number;
  readonly height: number;
  readonly operations: readonly RenderOperation[];
}

/** Multi-page render document produced from a display list. */
export interface RenderDocument {
  readonly pages: readonly RenderPage[];
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly operationCount: number;
}

/** Runtime context passed through the renderer lifecycle. */
export interface RenderContext {
  readonly document: RenderDocument;
  readonly displayList: DisplayList;
  readonly options: RenderOptions;
  readonly warnings: string[];
}

/** Common render options shared by all renderers. */
export interface RenderOptions {
  readonly title?: string;
  readonly author?: string;
  readonly subject?: string;
  readonly keywords?: readonly string[];
  readonly creator?: string;
  readonly pageBackground?: string;
  readonly basePath?: string;
  readonly lang?: string;
  readonly includeStyles?: boolean;
  readonly standalone?: boolean;
}

export interface RenderResult {
  readonly bytes: Uint8Array;
  readonly mimeType: string;
  readonly pageCount: number;
  readonly operationCount: number;
  readonly warnings: readonly string[];
}
