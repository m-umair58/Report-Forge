import open from 'open';

import { logger } from '../logger.js';
import { runRender, type RenderCommandOptions } from './render.js';

export async function runPreview(reportPath: string, options: RenderCommandOptions = {}): Promise<void> {
  const outputPath = await runRender(reportPath, options);
  logger.info(`Opening ${outputPath}`);
  await open(outputPath);
}
