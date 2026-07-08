import type { ComponentRegistryEntry } from './registry.js';
import { ComponentRegistry } from './registry.js';
import { COMPONENT_TYPES } from './constants.js';

const TYPOGRAPHY_TYPES = new Set<string>([
  COMPONENT_TYPES.TITLE,
  COMPONENT_TYPES.SUBTITLE,
  COMPONENT_TYPES.HEADING,
  COMPONENT_TYPES.PARAGRAPH,
  COMPONENT_TYPES.CAPTION,
  COMPONENT_TYPES.LABEL,
]);

const MEDIA_TYPES = new Set<string>([
  COMPONENT_TYPES.IMAGE,
  COMPONENT_TYPES.LOGO,
  COMPONENT_TYPES.ICON,
]);

const BUSINESS_TYPES = new Set<string>([
  COMPONENT_TYPES.SUMMARY_CARD,
  COMPONENT_TYPES.METRIC_CARD,
  COMPONENT_TYPES.KPI,
  COMPONENT_TYPES.BADGE,
  COMPONENT_TYPES.STATUS_PILL,
  COMPONENT_TYPES.INFO_BOX,
  COMPONENT_TYPES.ALERT_BOX,
]);

const LAYOUT_LEAF_TYPES = new Set<string>([COMPONENT_TYPES.DIVIDER, COMPONENT_TYPES.SPACER]);

const PLACEHOLDER_TYPES = new Set<string>([
  COMPONENT_TYPES.CHART,
  COMPONENT_TYPES.QR_CODE,
  COMPONENT_TYPES.BARCODE,
]);

const CONTENT_TYPES = new Set<string>([
  ...TYPOGRAPHY_TYPES,
  ...MEDIA_TYPES,
  ...BUSINESS_TYPES,
  ...LAYOUT_LEAF_TYPES,
  ...PLACEHOLDER_TYPES,
  COMPONENT_TYPES.TABLE,
  COMPONENT_TYPES.CONTAINER,
  COMPONENT_TYPES.STACK,
  COMPONENT_TYPES.ROW,
]);

const CONTAINER_CHILDREN = new Set<string>([
  ...CONTENT_TYPES,
  COMPONENT_TYPES.SECTION,
  COMPONENT_TYPES.CONTAINER,
  COMPONENT_TYPES.STACK,
]);

const SECTION_CHILDREN = new Set<string>([...CONTAINER_CHILDREN, COMPONENT_TYPES.SECTION]);

const STACK_CHILDREN = new Set<string>([...CONTENT_TYPES, COMPONENT_TYPES.SECTION, COMPONENT_TYPES.STACK]);

const ROW_CHILDREN = new Set<string>([
  ...TYPOGRAPHY_TYPES,
  ...MEDIA_TYPES,
  ...BUSINESS_TYPES,
  COMPONENT_TYPES.BADGE,
  COMPONENT_TYPES.STATUS_PILL,
  COMPONENT_TYPES.SPACER,
]);

const REPORT_CHILDREN = new Set<string>([
  COMPONENT_TYPES.HEADER,
  COMPONENT_TYPES.FOOTER,
  COMPONENT_TYPES.SECTION,
  ...CONTENT_TYPES,
]);

const CONTENT_PARENTS = new Set<string>([COMPONENT_TYPES.REPORT, COMPONENT_TYPES.SECTION]);

const CONTAINER_PARENTS = new Set<string>([
  COMPONENT_TYPES.REPORT,
  COMPONENT_TYPES.SECTION,
  COMPONENT_TYPES.CONTAINER,
  COMPONENT_TYPES.STACK,
]);

export const BUILT_IN_COMPONENT_ENTRIES: readonly ComponentRegistryEntry[] = [
  {
    type: COMPONENT_TYPES.REPORT,
    allowedChildren: REPORT_CHILDREN,
    allowedParents: new Set(),
    requiredProps: [],
  },
  {
    type: COMPONENT_TYPES.HEADER,
    allowedChildren: new Set([
      COMPONENT_TYPES.TITLE,
      COMPONENT_TYPES.HEADING,
      COMPONENT_TYPES.PARAGRAPH,
      COMPONENT_TYPES.IMAGE,
      COMPONENT_TYPES.LOGO,
    ]),
    allowedParents: new Set([COMPONENT_TYPES.REPORT]),
    requiredProps: [],
  },
  {
    type: COMPONENT_TYPES.FOOTER,
    allowedChildren: new Set([
      COMPONENT_TYPES.PARAGRAPH,
      COMPONENT_TYPES.CAPTION,
      COMPONENT_TYPES.IMAGE,
      COMPONENT_TYPES.LOGO,
    ]),
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
    type: COMPONENT_TYPES.CONTAINER,
    allowedChildren: CONTAINER_CHILDREN,
    allowedParents: CONTAINER_PARENTS,
    requiredProps: [],
  },
  {
    type: COMPONENT_TYPES.STACK,
    allowedChildren: STACK_CHILDREN,
    allowedParents: CONTAINER_PARENTS,
    requiredProps: [],
  },
  {
    type: COMPONENT_TYPES.ROW,
    allowedChildren: ROW_CHILDREN,
    allowedParents: CONTAINER_PARENTS,
    requiredProps: [],
  },
  {
    type: COMPONENT_TYPES.SPACER,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.STACK, COMPONENT_TYPES.ROW, COMPONENT_TYPES.CONTAINER]),
    requiredProps: [],
  },
  {
    type: COMPONENT_TYPES.TITLE,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.HEADER, COMPONENT_TYPES.STACK, COMPONENT_TYPES.ROW, COMPONENT_TYPES.CONTAINER]),
    requiredProps: ['text'],
  },
  {
    type: COMPONENT_TYPES.SUBTITLE,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.STACK, COMPONENT_TYPES.ROW, COMPONENT_TYPES.CONTAINER]),
    requiredProps: ['text'],
  },
  {
    type: COMPONENT_TYPES.HEADING,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.HEADER, COMPONENT_TYPES.STACK, COMPONENT_TYPES.ROW, COMPONENT_TYPES.CONTAINER]),
    requiredProps: ['text'],
  },
  {
    type: COMPONENT_TYPES.PARAGRAPH,
    allowedChildren: new Set(),
    allowedParents: new Set([
      ...CONTENT_PARENTS,
      COMPONENT_TYPES.HEADER,
      COMPONENT_TYPES.FOOTER,
      COMPONENT_TYPES.STACK,
      COMPONENT_TYPES.ROW,
      COMPONENT_TYPES.CONTAINER,
    ]),
    requiredProps: ['text'],
  },
  {
    type: COMPONENT_TYPES.CAPTION,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.FOOTER, COMPONENT_TYPES.STACK, COMPONENT_TYPES.ROW, COMPONENT_TYPES.CONTAINER]),
    requiredProps: ['text'],
  },
  {
    type: COMPONENT_TYPES.LABEL,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.STACK, COMPONENT_TYPES.ROW, COMPONENT_TYPES.CONTAINER]),
    requiredProps: ['text'],
  },
  {
    type: COMPONENT_TYPES.DIVIDER,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.STACK, COMPONENT_TYPES.ROW, COMPONENT_TYPES.CONTAINER]),
    requiredProps: [],
  },
  {
    type: COMPONENT_TYPES.TABLE,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.STACK, COMPONENT_TYPES.CONTAINER]),
    requiredProps: ['columns', 'rows'],
  },
  {
    type: COMPONENT_TYPES.IMAGE,
    allowedChildren: new Set(),
    allowedParents: new Set([
      ...CONTENT_PARENTS,
      COMPONENT_TYPES.HEADER,
      COMPONENT_TYPES.FOOTER,
      COMPONENT_TYPES.STACK,
      COMPONENT_TYPES.ROW,
      COMPONENT_TYPES.CONTAINER,
    ]),
    requiredProps: ['src'],
  },
  {
    type: COMPONENT_TYPES.LOGO,
    allowedChildren: new Set(),
    allowedParents: new Set([
      ...CONTENT_PARENTS,
      COMPONENT_TYPES.HEADER,
      COMPONENT_TYPES.FOOTER,
      COMPONENT_TYPES.STACK,
      COMPONENT_TYPES.ROW,
      COMPONENT_TYPES.CONTAINER,
    ]),
    requiredProps: ['src'],
  },
  {
    type: COMPONENT_TYPES.ICON,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.STACK, COMPONENT_TYPES.ROW, COMPONENT_TYPES.CONTAINER]),
    requiredProps: ['name'],
  },
  {
    type: COMPONENT_TYPES.CHART,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.STACK, COMPONENT_TYPES.CONTAINER]),
    requiredProps: ['type', 'data'],
  },
  {
    type: COMPONENT_TYPES.SUMMARY_CARD,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.STACK, COMPONENT_TYPES.ROW, COMPONENT_TYPES.CONTAINER]),
    requiredProps: ['value'],
  },
  {
    type: COMPONENT_TYPES.METRIC_CARD,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.STACK, COMPONENT_TYPES.ROW, COMPONENT_TYPES.CONTAINER]),
    requiredProps: ['label', 'value'],
  },
  {
    type: COMPONENT_TYPES.KPI,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.STACK, COMPONENT_TYPES.ROW, COMPONENT_TYPES.CONTAINER]),
    requiredProps: ['name', 'value'],
  },
  {
    type: COMPONENT_TYPES.BADGE,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.STACK, COMPONENT_TYPES.ROW, COMPONENT_TYPES.CONTAINER]),
    requiredProps: ['text'],
  },
  {
    type: COMPONENT_TYPES.STATUS_PILL,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.STACK, COMPONENT_TYPES.ROW, COMPONENT_TYPES.CONTAINER]),
    requiredProps: ['text'],
  },
  {
    type: COMPONENT_TYPES.INFO_BOX,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.STACK, COMPONENT_TYPES.CONTAINER]),
    requiredProps: ['message'],
  },
  {
    type: COMPONENT_TYPES.ALERT_BOX,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.STACK, COMPONENT_TYPES.CONTAINER]),
    requiredProps: ['message'],
  },
  {
    type: COMPONENT_TYPES.QR_CODE,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.STACK, COMPONENT_TYPES.CONTAINER]),
    requiredProps: ['value'],
  },
  {
    type: COMPONENT_TYPES.BARCODE,
    allowedChildren: new Set(),
    allowedParents: new Set([...CONTENT_PARENTS, COMPONENT_TYPES.STACK, COMPONENT_TYPES.CONTAINER]),
    requiredProps: ['value'],
  },
];

export function createDefaultRegistry(): ComponentRegistry {
  const registry = new ComponentRegistry();
  for (const entry of BUILT_IN_COMPONENT_ENTRIES) {
    registry.register(entry);
  }
  return registry;
}
