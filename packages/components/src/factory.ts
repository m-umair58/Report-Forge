import type { ComponentDescriptor } from './style.js';
import type { BaseComponentProps } from './style.js';
import { resolveDescriptorPresentation } from './style.js';
import type {
  AlertBoxProps,
  BadgeProps,
  BarcodeProps,
  CaptionProps,
  ChartProps,
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
  TableProps,
  TitleProps,
} from './props.js';
import { COMPONENT_TYPES } from './constants.js';

type DescriptorInput<T extends BaseComponentProps> = T & {
  readonly children?: readonly ComponentDescriptor[];
};

type DescriptorRecord = BaseComponentProps &
  Record<string, unknown> & {
    readonly children?: readonly ComponentDescriptor[];
  };

function asDescriptorRecord<T extends BaseComponentProps>(input: DescriptorInput<T>): DescriptorRecord {
  return input as DescriptorRecord;
}

function splitDescriptorInput(input: DescriptorRecord): {
  readonly props: Record<string, unknown>;
  readonly descriptor: Omit<ComponentDescriptor, 'type' | 'props'>;
} {
  const { id, style, margin, padding, visibility, children, ...rest } = input;

  const descriptor: Omit<ComponentDescriptor, 'type' | 'props'> = {
    ...(id !== undefined ? { id } : {}),
    ...(style !== undefined ? { style } : {}),
    ...(margin !== undefined ? { margin } : {}),
    ...(padding !== undefined ? { padding } : {}),
    ...(visibility !== undefined ? { visibility } : {}),
    ...(children !== undefined && children.length > 0 ? { children } : {}),
  };

  return { props: rest, descriptor };
}

function createDescriptor(type: string, input: DescriptorRecord): ComponentDescriptor {
  const { props, descriptor } = splitDescriptorInput(input);
  return { type, props, ...descriptor };
}

function normalizeSummaryCardProps(
  props: Record<string, unknown>,
): Record<string, unknown> {
  const label = props['label'] ?? props['title'];
  const normalized: Record<string, unknown> = { ...props };
  if (label !== undefined) normalized['label'] = label;
  delete normalized['title'];
  return normalized;
}

/**
 * Factory for all official ReportForge components.
 *
 * Each function returns a `ComponentDescriptor` — a blueprint for a Report DOM
 * node. Components do not render themselves.
 *
 * @example
 * import { Components } from '@reportforge/components';
 *
 * const title = Components.Title({ text: 'Monthly Sales' });
 * const section = Components.Section({
 *   label: 'Overview',
 *   children: [
 *     Components.Paragraph({ text: 'Summary...' }),
 *     Components.SummaryCard({ title: 'Revenue', value: '$1.2M' }),
 *   ],
 * });
 */
export const Components = {
  // Typography
  Title: (props: DescriptorInput<TitleProps>): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.TITLE, asDescriptorRecord(props)),

  Subtitle: (props: DescriptorInput<SubtitleProps>): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.SUBTITLE, asDescriptorRecord(props)),

  Heading: (props: DescriptorInput<HeadingProps>): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.HEADING, asDescriptorRecord(props)),

  Paragraph: (props: DescriptorInput<ParagraphProps>): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.PARAGRAPH, asDescriptorRecord(props)),

  Caption: (props: DescriptorInput<CaptionProps>): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.CAPTION, asDescriptorRecord(props)),

  Label: (props: DescriptorInput<LabelProps>): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.LABEL, asDescriptorRecord(props)),

  // Layout
  Section: (props: DescriptorInput<SectionProps> = {}): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.SECTION, asDescriptorRecord(props)),

  Container: (props: DescriptorInput<ContainerProps> = {}): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.CONTAINER, asDescriptorRecord(props)),

  Stack: (props: DescriptorInput<StackProps> = {}): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.STACK, asDescriptorRecord(props)),

  Row: (props: DescriptorInput<RowProps> = {}): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.ROW, asDescriptorRecord(props)),

  Spacer: (props: DescriptorInput<SpacerProps> = {}): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.SPACER, asDescriptorRecord(props)),

  Divider: (props: DescriptorInput<DividerProps> = {}): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.DIVIDER, asDescriptorRecord(props)),

  // Media
  Image: (props: DescriptorInput<ImageProps>): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.IMAGE, asDescriptorRecord(props)),

  Logo: (props: DescriptorInput<LogoProps>): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.LOGO, asDescriptorRecord(props)),

  Icon: (props: DescriptorInput<IconProps>): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.ICON, asDescriptorRecord(props)),

  // Business
  SummaryCard: (props: DescriptorInput<SummaryCardProps>): ComponentDescriptor => {
    const { props: raw, descriptor } = splitDescriptorInput(asDescriptorRecord(props));
    return {
      type: COMPONENT_TYPES.SUMMARY_CARD,
      props: normalizeSummaryCardProps(raw),
      ...descriptor,
    };
  },

  MetricCard: (props: DescriptorInput<MetricCardProps>): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.METRIC_CARD, asDescriptorRecord(props)),

  KPI: (props: DescriptorInput<KPIProps>): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.KPI, asDescriptorRecord(props)),

  Badge: (props: DescriptorInput<BadgeProps>): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.BADGE, asDescriptorRecord(props)),

  StatusPill: (props: DescriptorInput<StatusPillProps>): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.STATUS_PILL, asDescriptorRecord(props)),

  InfoBox: (props: DescriptorInput<InfoBoxProps>): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.INFO_BOX, asDescriptorRecord(props)),

  AlertBox: (props: DescriptorInput<AlertBoxProps>): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.ALERT_BOX, asDescriptorRecord(props)),

  // Placeholders
  Table: (props: DescriptorInput<TableProps>): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.TABLE, asDescriptorRecord(props)),

  Chart: (props: DescriptorInput<ChartProps>): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.CHART, asDescriptorRecord(props)),

  QRCode: (props: DescriptorInput<QRCodeProps>): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.QR_CODE, asDescriptorRecord(props)),

  Barcode: (props: DescriptorInput<BarcodeProps>): ComponentDescriptor =>
    createDescriptor(COMPONENT_TYPES.BARCODE, asDescriptorRecord(props)),
} as const;

/** Materialises presentation fields from a descriptor onto node style/layout hints. */
export { resolveDescriptorPresentation };
