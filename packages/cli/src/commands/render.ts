import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import ora from 'ora';

import { loadConfig, resolveOutputPath } from '../config.js';
import { logger } from '../logger.js';
import { loadReportFromFile, renderReportToFile, resolveFormat } from '../report-loader.js';

export interface RenderCommandOptions {
  readonly pdf?: boolean;
  readonly html?: boolean;
  readonly svg?: boolean;
  readonly format?: string;
  readonly output?: string;
}

export async function runRender(reportPath: string, options: RenderCommandOptions = {}): Promise<string> {
  const config = await loadConfig();
  const format = options.format ?? resolveFormat(options);
  const outputPath = options.output ?? resolveOutputPath(config, reportPath, format);
  const spinner = ora(`Rendering ${format.toUpperCase()}`).start();

  try {
    const report = await loadReportFromFile(reportPath);
    await mkdir(dirname(outputPath), { recursive: true });
    await renderReportToFile(report, outputPath, format);
    spinner.succeed(`Written to ${outputPath}`);
    return outputPath;
  } catch (error) {
    spinner.fail('Render failed');
    throw error;
  }
}

export async function runRenderCommand(reportPath: string, options: RenderCommandOptions = {}): Promise<void> {
  await runRender(reportPath, options);
  logger.dim(`Tip: run \`reportforge preview ${reportPath}\` to open the output.`);
}
