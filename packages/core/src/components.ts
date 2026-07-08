/**
 * Re-exports the official component library.
 *
 * @reportforge/core continues to expose component types for backward
 * compatibility. New code should import from `@reportforge/components`.
 */
export {
  COMPONENT_TYPES,
  BUILT_IN_COMPONENT_ENTRIES,
  createDefaultRegistry,
  Components,
  LAYOUT_CONTAINER_TYPES,
  validateDescriptor,
  validateDescriptors,
} from '@reportforge/components';

export type {
  ComponentType,
  TitleProps,
  SubtitleProps,
  HeadingProps,
  ParagraphProps,
  CaptionProps,
  LabelProps,
  SectionProps,
  ContainerProps,
  StackProps,
  RowProps,
  SpacerProps,
  DividerProps,
  TableProps,
  TableColumn,
  ImageProps,
  LogoProps,
  IconProps,
  ChartProps,
  ChartData,
  ChartDataset,
  ChartType,
  SummaryCardProps,
  MetricCardProps,
  KPIProps,
  BadgeProps,
  StatusPillProps,
  InfoBoxProps,
  AlertBoxProps,
  QRCodeProps,
  BarcodeProps,
  BarcodeFormat,
  BaseComponentProps,
  ComponentDescriptor,
  ComponentStyle,
  ComponentValidationResult,
} from '@reportforge/components';
