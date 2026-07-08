/** Declares what a renderer supports. */
export interface RendererCapabilities {
  readonly supportsImages: boolean;
  readonly supportsTransparency: boolean;
  readonly supportsFonts: boolean;
  readonly supportsSVG: boolean;
  readonly supportsLayers: boolean;
  readonly supportsMetadata: boolean;
  readonly supportsMultiplePages: boolean;
}

export const DEFAULT_RENDERER_CAPABILITIES: RendererCapabilities = {
  supportsImages: true,
  supportsTransparency: true,
  supportsFonts: true,
  supportsSVG: false,
  supportsLayers: true,
  supportsMetadata: true,
  supportsMultiplePages: true,
};
