import { writeFile } from 'node:fs/promises';

import { DisplayListGenerator } from '@reportforge/display-list';
import { LayoutEngine } from '@reportforge/layout';
import { PdfRenderer } from '@reportforge/renderer-pdf';
import {
  ThemeProvider,
  applyThemeToLayout,
  createDisplayListThemeOptions,
  toLayoutTheme,
} from '@reportforge/theme';
import { defaultThemeRegistry } from '@reportforge/themes';
import type { RenderOptions } from '@reportforge/shared';

import type { ReportBuilder } from './builder.js';
import { RenderError, ValidationFailureError } from './errors.js';

const themeProvider = new ThemeProvider(defaultThemeRegistry);

/**
 * Runs the full ReportForge pipeline and returns PDF bytes.
 */
export async function renderReportToPdfBytes(builder: ReportBuilder): Promise<Uint8Array> {
  const validation = builder.validate();
  if (!validation.valid) {
    const messages = validation.errors.map((e) => e.message).join('; ');
    throw new ValidationFailureError(`Report validation failed: ${messages}`);
  }

  try {
    const theme = themeProvider.resolve(builder.getTheme());
    const schema = builder.toSchema();

    const layoutEngine = new LayoutEngine();
    const rawLayout = layoutEngine.layout({ schema, theme: toLayoutTheme(theme) });

    const themedLayout = applyThemeToLayout(rawLayout, theme, schema.root);

    const displayOptions = createDisplayListThemeOptions(theme);
    const generator = new DisplayListGenerator();
    const displayList = generator.generate(themedLayout, {
      defaultFont: displayOptions.defaultFont,
      defaultFontSize: displayOptions.defaultFontSize,
      defaultColor: displayOptions.defaultColor,
    });

    const renderer = new PdfRenderer();
    const meta = schema.metadata as Record<string, unknown>;

    const renderOptions: Parameters<typeof renderer.render>[1] = {
      creator: 'ReportForge',
      pageBackground: displayOptions.pageBackground ?? undefined,
    };

    if (schema.metadata.title !== undefined) renderOptions.title = schema.metadata.title;
    if (schema.metadata.author !== undefined) renderOptions.author = schema.metadata.author;

    const subject = meta['subject'];
    if (typeof subject === 'string') renderOptions.subject = subject;

    const keywords = meta['keywords'];
    if (Array.isArray(keywords) && keywords.every((k) => typeof k === 'string')) {
      renderOptions.keywords = keywords;
    }

    const pageBackground = meta['pageBackground'];
    if (typeof pageBackground === 'string') renderOptions.pageBackground = pageBackground;

    return await renderer.render(displayList, renderOptions);
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
