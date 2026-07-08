export { SvgRenderer } from './renderer.js';

export const PACKAGE_NAME = '@reportforge/renderer-svg' as const;

export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}

export type {
  Renderer,
  RenderOperation,
  RenderOptions,
  RenderResult,
} from '@reportforge/render';
