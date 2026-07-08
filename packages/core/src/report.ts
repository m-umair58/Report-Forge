import type { ReportMetadata } from '@reportforge/shared';

import type { ReportCreateOptions } from './builder.js';
import { ReportBuilder, createReportBuilder, createReportBuilderFromSchema } from './builder.js';

/**
 * Entry point for the ReportForge Builder API.
 *
 * `Report` is a static factory — it is never instantiated directly.
 * Use `Report.create()` to start building a report, or `Report.fromJSON()` to
 * restore a previously serialized report.
 *
 * @example
 * // Create a new report
 * const report = Report.create({ metadata: { title: 'Quarterly Sales' } });
 * report
 *   .title('Quarterly Sales')
 *   .section(s => s.paragraph('Content here.'))
 *   .divider();
 *
 * // Serialize
 * const json = report.toJSON();
 *
 * // Restore from JSON
 * const restored = Report.fromJSON(json);
 */
export class Report {
  // Prevent instantiation — all functionality is through static methods.
  private constructor() {}

  /**
   * Creates a new, empty report builder.
   *
   * @param options - Optional metadata (title, author, theme, locale, etc.) and plugin list.
   * @returns A `ReportBuilder` ready for content.
   *
   * @example
   * const report = Report.create({
   *   metadata: { title: 'Annual Report', author: 'Finance Team' },
   *   theme: CorporateTheme,
   * });
   */
  static create(options?: ReportCreateOptions): ReportBuilder {
    return createReportBuilder(options);
  }

  /**
   * Restores a `ReportBuilder` from a previously serialized report schema.
   *
   * The schema must have been produced by `report.toJSON()` or `report.toSchema()`.
   * All node IDs, props, and hierarchy are restored exactly as serialized.
   *
   * @param json - A `ReportSchema` object (plain object from JSON.parse or toJSON()).
   * @returns A `ReportBuilder` initialized with the deserialized tree.
   * @throws {DeserializationError} If `json` is not a valid report schema.
   *
   * @example
   * const original = Report.create().title('Hello').paragraph('World');
   * const json = original.toJSON();
   *
   * const restored = Report.fromJSON(json);
   * console.log(JSON.stringify(restored.toJSON()) === JSON.stringify(json)); // true
   */
  static fromJSON(json: unknown): ReportBuilder {
    return createReportBuilderFromSchema(json);
  }

  /**
   * Creates a report builder initialized with specific metadata.
   * Convenience method for cases where only metadata needs to be set.
   *
   * @example
   * const report = Report.withMetadata({ title: 'My Report', theme: 'default' });
   */
  static withMetadata(metadata: ReportMetadata): ReportBuilder {
    return createReportBuilder({ metadata });
  }
}
