import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import ora from 'ora';

import { loadConfig } from '../config.js';
import { logger } from '../logger.js';
import { loadReportFromFile } from '../report-loader.js';

const REPORT_EXTENSIONS = /\.(ts|js|mts|mjs)$/;

export async function runBuild(cwd = process.cwd()): Promise<void> {
  const config = await loadConfig(cwd);
  const reportDirs = config?.reports ?? ['./src/reports'];
  const spinner = ora('Compiling report definitions').start();
  let compiled = 0;
  const errors: string[] = [];

  for (const dir of reportDirs) {
    const absolute = resolve(cwd, dir);
    if (!existsSync(absolute)) {
      errors.push(`Reports directory not found: ${dir}`);
      continue;
    }

    const entries = await readdir(absolute, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !REPORT_EXTENSIONS.test(entry.name)) continue;
      const filePath = join(absolute, entry.name);
      try {
        await loadReportFromFile(filePath);
        compiled += 1;
      } catch (error) {
        errors.push(`${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  if (errors.length > 0) {
    spinner.fail('Build failed');
    for (const message of errors) {
      logger.error(message);
    }
    throw new Error('Build failed');
  }

  spinner.succeed(`Compiled ${compiled} report definition${compiled === 1 ? '' : 's'}`);
}
