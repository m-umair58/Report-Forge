/** String discriminators for all component types. */
export const COMPONENT_TYPES = {
  REPORT: 'report',
  HEADER: 'header',
  FOOTER: 'footer',
  SECTION: 'section',
  CONTAINER: 'container',
  STACK: 'stack',
  ROW: 'row',
  SPACER: 'spacer',
  TITLE: 'title',
  SUBTITLE: 'subtitle',
  HEADING: 'heading',
  PARAGRAPH: 'paragraph',
  CAPTION: 'caption',
  LABEL: 'label',
  DIVIDER: 'divider',
  TABLE: 'table',
  IMAGE: 'image',
  LOGO: 'logo',
  ICON: 'icon',
  CHART: 'chart',
  SUMMARY_CARD: 'summary-card',
  METRIC_CARD: 'metric-card',
  KPI: 'kpi',
  BADGE: 'badge',
  STATUS_PILL: 'status-pill',
  INFO_BOX: 'info-box',
  ALERT_BOX: 'alert-box',
  QR_CODE: 'qr-code',
  BARCODE: 'barcode',
} as const;

export type ComponentType = (typeof COMPONENT_TYPES)[keyof typeof COMPONENT_TYPES];

/** Component types that lay out children in document flow. */
export const LAYOUT_CONTAINER_TYPES = new Set<string>([
  COMPONENT_TYPES.SECTION,
  COMPONENT_TYPES.CONTAINER,
  COMPONENT_TYPES.STACK,
  COMPONENT_TYPES.ROW,
]);
