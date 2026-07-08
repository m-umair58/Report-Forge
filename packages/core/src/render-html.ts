import { writeFile } from 'node:fs/promises';

import { HtmlRenderer } from '@reportforge/renderer-html';
import type { RenderOptions } from '@reportforge/render';

import type { ReportBuilder } from './builder.js';
import { RenderError } from './errors.js';
import { buildDisplayListFromBuilder, emitHook } from './render-pipeline.js';

function buildRenderOptions(
  builder: ReportBuilder,
  pipeline: Awaited<ReturnType<typeof buildDisplayListFromBuilder>>,
): RenderOptions {
  const meta = pipeline.schema.metadata as Record<string, unknown>;
  const options: RenderOptions = { creator: 'ReportForge' };

  if (pipeline.pageBackground !== undefined) {
    options.pageBackground = pipeline.pageBackground;
  }
  if (pipeline.schema.metadata.title !== undefined) options.title = pipeline.schema.metadata.title;
  if (pipeline.schema.metadata.author !== undefined) options.author = pipeline.schema.metadata.author;

  const subject = meta['subject'];
  if (typeof subject === 'string') options.subject = subject;

  const keywords = meta['keywords'];
  if (Array.isArray(keywords) && keywords.every((entry) => typeof entry === 'string')) {
    options.keywords = keywords;
  }

  const pageBackground = meta['pageBackground'];
  if (typeof pageBackground === 'string') options.pageBackground = pageBackground;

  return options;
}

export async function renderReportToHtmlBytes(builder: ReportBuilder): Promise<Uint8Array> {
  try {
    const pipeline = await buildDisplayListFromBuilder(builder);
    await emitHook(builder, 'beforeRender', { schema: pipeline.schema, displayList: pipeline.displayList });

    const renderer = new HtmlRenderer();
    const bytes = await renderer.render(pipeline.displayList, buildRenderOptions(builder, pipeline));

    await emitHook(builder, 'afterRender', { schema: pipeline.schema, bytes });
    return bytes;
  } catch (error) {
    await emitHook(builder, 'onError', { error, phase: 'render' });
    const message = error instanceof Error ? error.message : String(error);
    throw new RenderError(`HTML rendering failed: ${message}`, { cause: error });
  }
}

export async function renderReportToHtml(builder: ReportBuilder, outputPath: string): Promise<void> {
  await emitHook(builder, 'beforeExport', { outputPath });
  const bytes = await renderReportToHtmlBytes(builder);
  try {
    await writeFile(outputPath, bytes);
    await emitHook(builder, 'afterExport', { outputPath, bytes });
  } catch (error) {
    await emitHook(builder, 'onError', { error, phase: 'export' });
    const message = error instanceof Error ? error.message : String(error);
    throw new RenderError(`Failed to write HTML to '${outputPath}': ${message}`, { cause: error });
  }
}

export async function renderReportToHtmlString(builder: ReportBuilder): Promise<string> {
  const bytes = await renderReportToHtmlBytes(builder);
  return new TextDecoder().decode(bytes);
}
