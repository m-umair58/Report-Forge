/**
 * @reportforge/components
 *
 * Official component library for ReportForge.
 *
 * Components produce renderer-independent `ComponentDescriptor` objects that
 * the Builder API materialises as Report DOM nodes. Components never render
 * themselves — rendering remains the responsibility of layout and renderers.
 *
 * @example
 * import { Components } from '@reportforge/components';
 * import { Report } from '@reportforge/core';
 *
 * const report = Report.create()
 *   .add(Components.Title({ text: 'Monthly Sales' }))
 *   .add(Components.Paragraph({ text: 'Summary...' }))
 *   .add(Components.Divider())
 *   .add(Components.SummaryCard({ title: 'Revenue', value: '$1.2M' }));
 */

export { Components, resolveDescriptorPresentation } from './factory.js';

export { COMPONENT_TYPES, LAYOUT_CONTAINER_TYPES } from './constants.js';
export type { ComponentType } from './constants.js';

export {
  BUILT_IN_COMPONENT_ENTRIES,
  createDefaultRegistry,
} from './entries.js';

export { ComponentRegistry, ComponentRegistryError } from './registry.js';
export type { ComponentRegistryEntry } from './registry.js';

export {
  styleToRecord,
  resolveDescriptorPresentation as applyDescriptorPresentation,
} from './style.js';
export type {
  BaseComponentProps,
  ComponentDescriptor,
  ComponentStyle,
  Spacing,
  SpacingValue,
  TextAlignment,
  Visibility,
} from './style.js';

export type {
  AlertBoxProps,
  BadgeProps,
  BarcodeFormat,
  BarcodeProps,
  CaptionProps,
  ChartData,
  ChartDataset,
  ChartProps,
  ChartType,
  ContainerProps,
  DividerProps,
  HeadingProps,
  IconProps,
  ImageProps,
  InfoBoxProps,
  KPIProps,
  LabelProps,
  LogoProps,
  MetricCardProps,
  ParagraphProps,
  QRCodeProps,
  RowProps,
  SectionProps,
  SpacerProps,
  StackProps,
  StatusPillProps,
  SubtitleProps,
  SummaryCardProps,
  TableColumn,
  TableProps,
  TitleProps,
} from './props.js';

export {
  validateDescriptor,
  validateDescriptors,
} from './validation.js';
export type {
  ComponentValidationIssue,
  ComponentValidationResult,
} from './validation.js';

export const PACKAGE_NAME = '@reportforge/components' as const;

export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}
