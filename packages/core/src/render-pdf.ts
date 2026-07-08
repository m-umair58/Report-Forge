import { writeFile } from 'node:fs/promises';

import { PdfRenderer } from '@reportforge/renderer-pdf';
import type { RenderOptions } from '@reportforge/shared';

import type { ReportBuilder } from './builder.js';
import { RenderError, ValidationFailureError } from './errors.js';
import { buildDisplayListFromBuilder, emitHook } from './render-pipeline.js';

/**
 * Runs the full ReportForge pipeline and returns PDF bytes.
 */
export async function renderReportToPdfBytes(builder: ReportBuilder): Promise<Uint8Array> {
  try {
    const pipeline = await buildDisplayListFromBuilder(builder);
    await emitHook(builder, 'beforeRender', { schema: pipeline.schema, displayList: pipeline.displayList });

    const renderer = new PdfRenderer();
    const meta = pipeline.schema.metadata as Record<string, unknown>;

    const renderOptions: Parameters<typeof renderer.render>[1] = {
      creator: 'ReportForge',
      pageBackground: pipeline.pageBackground,
    };

    if (pipeline.schema.metadata.title !== undefined) renderOptions.title = pipeline.schema.metadata.title;
    if (pipeline.schema.metadata.author !== undefined) renderOptions.author = pipeline.schema.metadata.author;

    const subject = meta['subject'];
    if (typeof subject === 'string') renderOptions.subject = subject;

    const keywords = meta['keywords'];
    if (Array.isArray(keywords) && keywords.every((entry) => typeof entry === 'string')) {
      renderOptions.keywords = keywords;
    }

    const pageBackground = meta['pageBackground'];
    if (typeof pageBackground === 'string') renderOptions.pageBackground = pageBackground;

    const bytes = await renderer.render(pipeline.displayList, renderOptions);
    await emitHook(builder, 'afterRender', { schema: pipeline.schema, bytes });
    return bytes;
  } catch (error) {
    await emitHook(builder, 'onError', { error, phase: 'render' });
    if (error instanceof ValidationFailureError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new RenderError(`PDF rendering failed: ${message}`, { cause: error });
  }
}

export async function renderReportToPdf(builder: ReportBuilder, outputPath: string): Promise<void> {
  await emitHook(builder, 'beforeExport', { outputPath });
  const bytes = await renderReportToPdfBytes(builder);
  try {
    await writeFile(outputPath, bytes);
    await emitHook(builder, 'afterExport', { outputPath, bytes });
  } catch (error) {
    await emitHook(builder, 'onError', { error, phase: 'export' });
    const message = error instanceof Error ? error.message : String(error);
    throw new RenderError(`Failed to write PDF to '${outputPath}': ${message}`, { cause: error });
  }
}

export async function renderReport(
  builder: ReportBuilder,
  options: RenderOptions,
): Promise<Uint8Array> {
  let bytes: Uint8Array;

  switch (options.format) {
    case 'pdf':
      bytes = await renderReportToPdfBytes(builder);
      break;
    case 'html': {
      const { renderReportToHtmlBytes } = await import('./render-html.js');
      bytes = await renderReportToHtmlBytes(builder);
      break;
    }
    case 'svg': {
      const { renderReportToSvgBytes } = await import('./render-svg.js');
      bytes = await renderReportToSvgBytes(builder);
      break;
    }
    default:
      throw new RenderError(
        `Unsupported output format: '${options.format}'. Supported formats: pdf, html, svg.`,
      );
  }

  if (options.output !== undefined) {
    await writeFile(options.output, bytes);
  }

  return bytes;
}
