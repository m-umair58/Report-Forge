import { writeFile } from 'node:fs/promises';

import { DisplayListGenerator } from '@reportforge/display-list';
import { LayoutEngine } from '@reportforge/layout';
import { PdfRenderer } from '@reportforge/renderer-pdf';
import type { RenderOptions } from '@reportforge/shared';

import type { ReportBuilder } from './builder.js';
import { RenderError, ValidationFailureError } from './errors.js';

/**
 * Runs the full ReportForge pipeline and returns PDF bytes.
 *
 * ```
 * ReportBuilder → validate → LayoutEngine → DisplayListGenerator → PdfRenderer
 * ```
 *
 * @throws {ValidationFailureError} If the report fails validation.
 * @throws {RenderError} If any pipeline stage fails.
 */
export async function renderReportToPdfBytes(builder: ReportBuilder): Promise<Uint8Array> {
  const validation = builder.validate();
  if (!validation.valid) {
    const messages = validation.errors.map((e) => e.message).join('; ');
    throw new ValidationFailureError(`Report validation failed: ${messages}`);
  }

  try {
    const layoutEngine = new LayoutEngine();
    const layout = layoutEngine.layout(builder);

    const generator = new DisplayListGenerator();
    const displayList = generator.generate(layout);

    const renderer = new PdfRenderer();
    const schema = builder.toSchema();

    return await renderer.render(displayList, {
      title: schema.metadata.title,
      author: schema.metadata.author,
      creator: 'ReportForge',
    });
  } catch (error) {
    if (error instanceof ValidationFailureError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new RenderError(`PDF rendering failed: ${message}`, {
      cause: error,
    });
  }
}

/**
 * Runs the full pipeline and writes PDF bytes to `outputPath`.
 */
export async function renderReportToPdf(builder: ReportBuilder, outputPath: string): Promise<void> {
  const bytes = await renderReportToPdfBytes(builder);
  try {
    await writeFile(outputPath, bytes);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new RenderError(`Failed to write PDF to '${outputPath}': ${message}`, {
      cause: error,
    });
  }
}

/**
 * Renders a report using `RenderOptions` from the shared contract.
 * Currently only `format: 'pdf'` is supported.
 */
export async function renderReport(
  builder: ReportBuilder,
  options: RenderOptions,
): Promise<Uint8Array> {
  if (options.format !== 'pdf') {
    throw new RenderError(
      `Unsupported output format: '${options.format}'. Only 'pdf' is supported.`,
    );
  }

  const bytes = await renderReportToPdfBytes(builder);

  if (options.output !== undefined) {
    await writeFile(options.output, bytes);
  }

  return bytes;
}
