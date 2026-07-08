/**
 * @reportforge/core
 *
 * Core domain layer for ReportForge.
 * Provides the Builder API, component tree, report schema serialization,
 * and validation framework.
 *
 * @example
 * import { Report } from '@reportforge/core';
 *
 * const report = Report.create({ metadata: { title: 'Monthly Sales' } });
 * report
 *   .title('Monthly Sales')
 *   .paragraph('Summary paragraph.')
 *   .section(s => {
 *     s.title('Orders').paragraph('Order statistics here.');
 *   })
 *   .divider();
 *
 * const json = report.toJSON();
 * console.log(JSON.stringify(json, null, 2));
 */

// ─── Public API ──────────────────────────────────────────────────────────────

export { Report } from './report.js';
export { ReportBuilder, SectionBuilder, HeaderBuilder, FooterBuilder } from './builder.js';
export type { ReportCreateOptions } from './builder.js';

// ─── Component types and props ───────────────────────────────────────────────

export {
  COMPONENT_TYPES,
  BUILT_IN_COMPONENT_ENTRIES,
  createDefaultRegistry,
} from './components.js';
export type {
  ComponentType,
  TitleProps,
  SubtitleProps,
  ParagraphProps,
  SectionProps,
  TableProps,
  TableColumn,
  ImageProps,
  ChartProps,
  ChartData,
  ChartDataset,
  ChartType,
  SummaryCardProps,
  QRCodeProps,
  BarcodeProps,
  BarcodeFormat,
} from './components.js';

// ─── Registry ────────────────────────────────────────────────────────────────

export { ComponentRegistry } from './registry.js';
export type { ComponentRegistryEntry } from './registry.js';

// ─── Validation ──────────────────────────────────────────────────────────────

export {
  ValidationFramework,
  createDefaultValidationFramework,
  duplicateIdValidator,
  knownTypeValidator,
  allowedChildrenValidator,
  requiredPropsValidator,
} from './validator.js';
export type { ValidatorFunction, ValidationContext } from './validator.js';

// ─── Serialization ────────────────────────────────────────────────────────────

export { SCHEMA_VERSION, serialize, deserialize } from './serializer.js';
export type { DeserializedReport } from './serializer.js';

// ─── Errors ──────────────────────────────────────────────────────────────────

export {
  ReportForgeError,
  BuilderError,
  SerializationError,
  DeserializationError,
  ValidationFailureError,
  RenderError,
} from './errors.js';

// ─── Package identity ────────────────────────────────────────────────────────

/** Package identifier for @reportforge/core. */
export const PACKAGE_NAME = '@reportforge/core' as const;

/** Returns the package identifier. */
export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}
