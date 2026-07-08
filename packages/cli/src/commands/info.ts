import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { findConfigFile, loadConfig } from '../config.js';
import { logger } from '../logger.js';

export async function runInfoCommand(): Promise<void> {
  const config = await loadConfig();
  const configPath = findConfigFile();

  logger.title('ReportForge project info');

  try {
    const pkgPath = join(process.cwd(), 'package.json');
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as { name?: string; version?: string };
    logger.info(`Project: ${pkg.name ?? '(unnamed)'}@${pkg.version ?? '0.0.0'}`);
  } catch {
    logger.warn('No package.json in current directory.');
  }

  if (configPath !== null) {
    logger.info(`Config: ${configPath}`);
  } else {
    logger.warn('No reportforge.config file found.');
  }

  if (config !== null) {
    logger.dim(`  renderer: ${config.renderer ?? 'pdf'}`);
    logger.dim(`  theme: ${config.theme ?? 'default'}`);
    logger.dim(`  output: ${config.output ?? './dist'}`);
    logger.dim(`  plugins: ${config.plugins?.length ?? 0}`);
    logger.dim(`  reports: ${(config.reports ?? ['./src/reports']).join(', ')}`);
  }

  const cliPkgPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
  try {
    const cliPkg = JSON.parse(await readFile(cliPkgPath, 'utf8')) as { version?: string };
    logger.info(`CLI version: ${cliPkg.version ?? '0.0.0'}`);
  } catch {
    logger.info('CLI version: 0.0.0');
  }
}
