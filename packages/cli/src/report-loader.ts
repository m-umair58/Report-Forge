import { resolve } from 'node:path';

import type { ReportBuilder } from '@reportforge/core';
import { createJiti } from 'jiti';

export interface LoadedReportModule {
  readonly report?: ReportBuilder;
  readonly createReport?: () => ReportBuilder | Promise<ReportBuilder>;
  readonly default?: ReportBuilder | (() => ReportBuilder | Promise<ReportBuilder>);
}

export async function loadReportFromFile(filePath: string): Promise<ReportBuilder> {
  const absolutePath = resolve(filePath);
  const jiti = createJiti(import.meta.url, { interopDefault: true });
  const module = jiti(absolutePath) as LoadedReportModule;

  if (module.report !== undefined) {
    return module.report;
  }

  if (typeof module.createReport === 'function') {
    return await module.createReport();
  }

  if (typeof module.default === 'function') {
    return await module.default();
  }

  if (module.default !== undefined && typeof module.default !== 'function') {
    return module.default;
  }

  throw new Error(
    `Report file '${filePath}' must export 'report', 'createReport', or a default ReportBuilder/function.`,
  );
}

export type OutputFormat = 'pdf' | 'html' | 'svg';

export async function renderReportToFile(
  report: ReportBuilder,
  outputPath: string,
  format: OutputFormat,
): Promise<void> {
  switch (format) {
    case 'pdf':
      await report.toPDF(outputPath);
      break;
    case 'html':
      await report.toHTML(outputPath);
      break;
    case 'svg':
      await report.toSVG(outputPath);
      break;
  }
}

export function resolveFormat(options: {
  pdf?: boolean;
  html?: boolean;
  svg?: boolean;
  format?: string;
}): OutputFormat {
  if (options.html === true) return 'html';
  if (options.svg === true) return 'svg';
  if (options.pdf === true) return 'pdf';
  if (options.format === 'html' || options.format === 'svg') return options.format;
  return 'pdf';
}
