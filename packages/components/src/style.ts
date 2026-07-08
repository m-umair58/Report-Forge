/**
 * Renderer-independent style tokens for component descriptors.
 *
 * Styles are stored on Report DOM nodes and resolved by the layout engine
 * and renderers — components never draw themselves.
 */
export interface Spacing {
  readonly top?: number;
  readonly right?: number;
  readonly bottom?: number;
  readonly left?: number;
}

export type SpacingValue = number | string | Spacing;

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

export interface ComponentStyle {
  readonly background?: string;
  readonly foreground?: string;
  readonly fontSize?: number | string;
  readonly fontWeight?: string | number;
  readonly color?: string;
  readonly border?: string;
  readonly borderRadius?: number | string;
  readonly padding?: SpacingValue;
  readonly margin?: SpacingValue;
  readonly alignment?: TextAlignment;
  readonly opacity?: number;
}

export type Visibility = boolean | 'visible' | 'hidden';

/**
 * Common props supported by every component descriptor.
 */
export interface BaseComponentProps {
  readonly id?: string;
  readonly style?: ComponentStyle;
  readonly margin?: SpacingValue;
  readonly padding?: SpacingValue;
  readonly visibility?: Visibility;
}

/**
 * A renderer-independent blueprint for a Report DOM node.
 *
 * Components produce descriptors; the Builder API materialises them as
 * internal tree nodes. Renderers never see descriptors directly.
 */
export interface ComponentDescriptor<TProps extends Record<string, unknown> = Record<string, unknown>> {
  readonly type: string;
  readonly props: TProps;
  readonly id?: string;
  readonly style?: ComponentStyle;
  readonly margin?: SpacingValue;
  readonly padding?: SpacingValue;
  readonly visibility?: Visibility;
  readonly children?: readonly ComponentDescriptor[];
}

/** Converts a `ComponentStyle` into a plain record for Report DOM `style`. */
export function styleToRecord(style: ComponentStyle): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  if (style.background !== undefined) record['background'] = style.background;
  if (style.foreground !== undefined) record['foreground'] = style.foreground;
  if (style.fontSize !== undefined) record['fontSize'] = style.fontSize;
  if (style.fontWeight !== undefined) record['fontWeight'] = style.fontWeight;
  if (style.color !== undefined) record['color'] = style.color;
  if (style.border !== undefined) record['border'] = style.border;
  if (style.borderRadius !== undefined) record['borderRadius'] = style.borderRadius;
  if (style.padding !== undefined) record['padding'] = style.padding;
  if (style.margin !== undefined) record['margin'] = style.margin;
  if (style.alignment !== undefined) record['alignment'] = style.alignment;
  if (style.opacity !== undefined) record['opacity'] = style.opacity;
  return record;
}

/** Merges descriptor style with explicit margin/padding into node style + layout hints. */
export function resolveDescriptorPresentation(descriptor: ComponentDescriptor): {
  readonly style: Record<string, unknown>;
  readonly layoutHints: Record<string, unknown>;
} {
  const style: Record<string, unknown> = descriptor.style !== undefined ? styleToRecord(descriptor.style) : {};

  const layoutHints: Record<string, unknown> = {};

  if (descriptor.margin !== undefined) layoutHints['margin'] = descriptor.margin;
  if (descriptor.padding !== undefined) layoutHints['padding'] = descriptor.padding;
  if (descriptor.visibility !== undefined) layoutHints['visibility'] = descriptor.visibility;

  if (descriptor.style?.margin !== undefined && layoutHints['margin'] === undefined) {
    layoutHints['margin'] = descriptor.style.margin;
  }
  if (descriptor.style?.padding !== undefined && layoutHints['padding'] === undefined) {
    layoutHints['padding'] = descriptor.style.padding;
  }

  return { style, layoutHints };
}
