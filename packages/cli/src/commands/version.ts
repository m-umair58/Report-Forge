import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { logger } from '../logger.js';

export async function getCliVersion(): Promise<string> {
  try {
    const pkgPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export async function runVersionCommand(): Promise<void> {
  const version = await getCliVersion();
  console.log(version);
}

export async function runUpgradeCommand(): Promise<void> {
  logger.title('Upgrade ReportForge packages');
  logger.info('Run one of the following in your project directory:');
  logger.dim('  pnpm up @reportforge/core @reportforge/cli @reportforge/templates @reportforge/themes');
  logger.dim('  npm update @reportforge/core @reportforge/cli @reportforge/templates @reportforge/themes');
  logger.dim('  yarn upgrade @reportforge/core @reportforge/cli @reportforge/templates @reportforge/themes');
}
