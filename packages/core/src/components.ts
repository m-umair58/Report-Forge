import type { ComponentRegistryEntry } from './registry.js';
import { ComponentRegistry } from './registry.js';

// ─── Component Type Constants ──────────────────────────────────────────────

/**
 * String discriminators for all built-in component types.
 * Use these constants instead of inline strings to avoid typos.
 *
 * @example
 * if (node.type === COMPONENT_TYPES.TITLE) { ... }
 */
export const COMPONENT_TYPES = {
  REPORT: 'report',
  HEADER: 'header',
  FOOTER: 'footer',
  SECTION: 'section',
  TITLE: 'title',
  SUBTITLE: 'subtitle',
  PARAGRAPH: 'paragraph',
  DIVIDER: 'divider',
  TABLE: 'table',
  IMAGE: 'image',
  CHART: 'chart',
  SUMMARY_CARD: 'summary-card',
  QR_CODE: 'qr-code',
  BARCODE: 'barcode',
} as const;

/** Union of all built-in component type strings. */
export type ComponentType = (typeof COMPONENT_TYPES)[keyof typeof COMPONENT_TYPES];

// ─── Prop Types ─────────────────────────────────────────────────────────────

/** Props for the Title component. */
export interface TitleProps {
  readonly text: string;
}

/** Props for the Subtitle component. */
export interface SubtitleProps {
  readonly text: string;
}

/** Props for the Paragraph component. */
export interface ParagraphProps {
  readonly text: string;
}

/** Props for the Section container. */
export interface SectionProps {
  readonly label?: string;
}

/** A single column definition for a Table. */
export interface TableColumn {
  readonly key: string;
  readonly label: string;
  readonly align?: 'left' | 'center' | 'right';
}

/** Props for the Table component. */
export interface TableProps {
  readonly columns: readonly TableColumn[];
  readonly rows: readonly Readonly<Record<string, unknown>>[];
}

/** Props for the Image component. */
export interface ImageProps {
  readonly src: string;
  readonly alt?: string;
  readonly width?: number;
  readonly height?: number;
}

/** A single dataset within a Chart. */
export interface ChartDataset {
  readonly label: string;
  readonly values: readonly number[];
}

/** Data payload for a Chart component. */
export interface ChartData {
  readonly labels: readonly string[];
  readonly datasets: readonly ChartDataset[];
}

/** Supported chart display types. */
export type ChartType = 'bar' | 'line' | 'pie' | 'area';

/** Props for the Chart component. */
export interface ChartProps {
  readonly type: ChartType;
  readonly title?: string;
  readonly data: ChartData;
}

/** Props for the SummaryCard component. */
export interface SummaryCardProps {
  readonly label: string;
  readonly value: string;
  readonly trend?: string;
}

/** Props for the QRCode component. */
export interface QRCodeProps {
  readonly value: string;
}

/** Supported barcode formats. */
export type BarcodeFormat = 'EAN13' | 'EAN8' | 'UPC' | 'CODE128' | 'CODE39';

/** Props for the Barcode component. */
export interface BarcodeProps {
  readonly value: string;
  readonly format?: BarcodeFormat;
}

// ─── Child/Parent Relationship Sets ────────────────────────────────────────

/** Leaf content types that most container components accept. */
const CONTENT_TYPES = new Set<string>([
  COMPONENT_TYPES.TITLE,
  COMPONENT_TYPES.SUBTITLE,
  COMPONENT_TYPES.PARAGRAPH,
  COMPONENT_TYPES.DIVIDER,
  COMPONENT_TYPES.TABLE,
  COMPONENT_TYPES.IMAGE,
  COMPONENT_TYPES.CHART,
  COMPONENT_TYPES.SUMMARY_CARD,
  COMPONENT_TYPES.QR_CODE,
  COMPONENT_TYPES.BARCODE,
]);

/** Children allowed in a Section (includes nested Sections). */
const SECTION_CHILDREN = new Set<string>([...CONTENT_TYPES, COMPONENT_TYPES.SECTION]);

/** Children allowed at the report root level. */
const REPORT_CHILDREN = new Set<string>([
  COMPONENT_TYPES.HEADER,
  COMPONENT_TYPES.FOOTER,
  COMPONENT_TYPES.SECTION,
  ...CONTENT_TYPES,
]);

/** Children allowed inside a Header. */
const HEADER_CHILDREN = new Set<string>([
  COMPONENT_TYPES.TITLE,
  COMPONENT_TYPES.PARAGRAPH,
  COMPONENT_TYPES.IMAGE,
]);

/** Children allowed inside a Footer. */
const FOOTER_CHILDREN = new Set<string>([COMPONENT_TYPES.PARAGRAPH, COMPONENT_TYPES.IMAGE]);

/** Content types whose only valid parents are Report and Section. */
const CONTENT_PARENTS = new Set<string>([COMPONENT_TYPES.REPORT, COMPONENT_TYPES.SECTION]);

// ─── Built-in Component Registry Entries ────────────────────────────────────

/**
 * Registry entries for all built-in component types.
 * Registered into a ComponentRegistry when a report is created.
 */
export const BUILT_IN_COMPONENT_ENTRIES: readonly ComponentRegistryEntry[] = [
  {
    type: COMPONENT_TYPES.REPORT,
    allowedChildren: REPORT_CHILDREN,
    allowedParents: new Set(),
    requiredProps: [],
  },
  {
    type: COMPONENT_TYPES.HEADER,
    allowedChildren: HEADER_CHILDREN,
    allowedParents: new Set([COMPONENT_TYPES.REPORT]),
    requiredProps: [],
  },
  {
    type: COMPONENT_TYPES.FOOTER,
    allowedChildren: FOOTER_CHILDREN,
    allowedParents: new Set([COMPONENT_TYPES.REPORT]),
    requiredProps: [],
  },
  {
    type: COMPONENT_TYPES.SECTION,
    allowedChildren: SECTION_CHILDREN,
    allowedParents: new Set([COMPONENT_TYPES.REPORT, COMPONENT_TYPES.SECTION]),
    requiredProps: [],
  },
  {
    type: COMPONENT_TYPES.TITLE,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.HEADER]),
    requiredProps: ['text'],
  },
  {
    type: COMPONENT_TYPES.SUBTITLE,
    allowedChildren: new Set(),
    allowedParents: CONTENT_PARENTS,
    requiredProps: ['text'],
  },
  {
    type: COMPONENT_TYPES.PARAGRAPH,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.HEADER, COMPONENT_TYPES.FOOTER]),
    requiredProps: ['text'],
  },
  {
    type: COMPONENT_TYPES.DIVIDER,
    allowedChildren: new Set(),
    allowedParents: CONTENT_PARENTS,
    requiredProps: [],
  },
  {
    type: COMPONENT_TYPES.TABLE,
    allowedChildren: new Set(),
    allowedParents: CONTENT_PARENTS,
    requiredProps: ['columns', 'rows'],
  },
  {
    type: COMPONENT_TYPES.IMAGE,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.HEADER, COMPONENT_TYPES.FOOTER]),
    requiredProps: ['src'],
  },
  {
    type: COMPONENT_TYPES.CHART,
    allowedChildren: new Set(),
    allowedParents: CONTENT_PARENTS,
    requiredProps: ['type', 'data'],
  },
  {
    type: COMPONENT_TYPES.SUMMARY_CARD,
    allowedChildren: new Set(),
    allowedParents: CONTENT_PARENTS,
    requiredProps: ['label', 'value'],
  },
  {
    type: COMPONENT_TYPES.QR_CODE,
    allowedChildren: new Set(),
    allowedParents: CONTENT_PARENTS,
    requiredProps: ['value'],
  },
  {
    type: COMPONENT_TYPES.BARCODE,
    allowedChildren: new Set(),
    allowedParents: CONTENT_PARENTS,
    requiredProps: ['value'],
  },
];

/**
 * Creates a ComponentRegistry pre-loaded with all built-in component definitions.
 *
 * @example
 * const registry = createDefaultRegistry();
 * registry.has('title'); // true
 */
export function createDefaultRegistry(): ComponentRegistry {
  const registry = new ComponentRegistry();
  for (const entry of BUILT_IN_COMPONENT_ENTRIES) {
    registry.register(entry);
  }
  return registry;
}
