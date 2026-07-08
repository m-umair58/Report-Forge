import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { loadConfig, writeProjectFile } from '../config.js';
import { logger } from '../logger.js';
import { getCreateReportFile } from '../scaffolds/index.js';
import type { ScaffoldTemplateId } from '../types.js';
import { SCAFFOLD_TEMPLATES } from '../types.js';

export interface CreateCommandOptions {
  readonly template?: string;
  readonly name?: string;
  readonly theme?: string;
}

function resolveTemplateId(input?: string): ScaffoldTemplateId {
  const normalized = (input ?? 'blank').toLowerCase().replace(/\s+/g, '-');
  const match = SCAFFOLD_TEMPLATES.find((t) => t.id === normalized || t.label.toLowerCase() === normalized);
  if (match === undefined) {
    throw new Error(
      `Unknown template '${input}'. Choose from: ${SCAFFOLD_TEMPLATES.map((t) => t.id).join(', ')}`,
    );
  }
  return match.id;
}

export async function runCreate(templateArg?: string, options: CreateCommandOptions = {}): Promise<void> {
  const template = resolveTemplateId(options.template ?? templateArg);
  const config = await loadConfig();
  const theme = options.theme ?? config?.theme ?? 'corporate';
  const fileName = options.name ?? `src/reports/${template}.ts`;
  const absolutePath = join(process.cwd(), fileName);

  if (existsSync(absolutePath)) {
    throw new Error(`File already exists: ${absolutePath}`);
  }

  const files = getCreateReportFile(template, theme, fileName);
  for (const [relativePath, contents] of Object.entries(files)) {
    await writeProjectFile(join(process.cwd(), relativePath), contents);
  }

  logger.success(`Created report: ${fileName}`);
  logger.dim(`  reportforge render ${fileName}`);
}
