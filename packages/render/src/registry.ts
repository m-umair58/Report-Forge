import type { DisplayList } from '@reportforge/display-list';

import type { RenderOptions, RenderResult } from './context.js';
import type { Renderer } from './renderer.js';

/** Registry of named renderers keyed by format id. */
export class RendererRegistry {
  private readonly renderers = new Map<string, Renderer>();

  register(format: string, renderer: Renderer): void {
    if (this.renderers.has(format)) {
      return;
    }
    this.renderers.set(format, renderer);
  }

  has(format: string): boolean {
    return this.renderers.has(format);
  }

  get(format: string): Renderer {
    const renderer = this.renderers.get(format);
    if (renderer === undefined) {
      throw new Error(`Unknown renderer format '${format}'.`);
    }
    return renderer;
  }

  list(): readonly string[] {
    return [...this.renderers.keys()].sort();
  }

  async render(
    format: string,
    displayList: DisplayList,
    options?: RenderOptions,
  ): Promise<RenderResult> {
    return this.get(format).renderWithDiagnostics(displayList, options);
  }
}

export const defaultRendererRegistry = new RendererRegistry();
