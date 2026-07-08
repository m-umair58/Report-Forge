import { existsSync } from 'node:fs';
import { join } from 'node:path';

import inquirer from 'inquirer';

import { writeProjectFile } from '../config.js';
import { logger } from '../logger.js';
import { defaultCliRegistry } from '../plugin-registry.js';
import { getScaffoldFiles } from '../scaffolds/index.js';
import type { InitOptions, PackageManager, ReportForgeLanguage, ReportForgeRenderer, ScaffoldTemplateId } from '../types.js';
import { BUILT_IN_THEMES, SCAFFOLD_TEMPLATES } from '../types.js';

export interface InitCommandOptions {
  readonly name?: string;
  readonly packageManager?: PackageManager;
  readonly template?: ScaffoldTemplateId;
  readonly theme?: string;
  readonly renderer?: ReportForgeRenderer;
  readonly language?: ReportForgeLanguage;
  readonly yes?: boolean;
}

async function promptInitOptions(partial: InitCommandOptions): Promise<InitOptions> {
  if (partial.yes === true && partial.name !== undefined) {
    return {
      name: partial.name,
      packageManager: partial.packageManager ?? 'pnpm',
      template: partial.template ?? 'invoice',
      theme: partial.theme ?? 'corporate',
      renderer: partial.renderer ?? 'pdf',
      language: partial.language ?? 'typescript',
    };
  }

  const answers = await inquirer.prompt<InitOptions>([
    {
      type: 'input',
      name: 'name',
      message: 'Project name',
      default: partial.name ?? 'my-reportforge-app',
      when: partial.name === undefined,
    },
    {
      type: 'list',
      name: 'packageManager',
      message: 'Package manager',
      choices: ['pnpm', 'npm', 'yarn'],
      default: partial.packageManager ?? 'pnpm',
      when: partial.packageManager === undefined,
    },
    {
      type: 'list',
      name: 'template',
      message: 'Template',
      choices: SCAFFOLD_TEMPLATES.map((t) => ({ name: t.label, value: t.id })),
      default: partial.template ?? 'invoice',
      when: partial.template === undefined,
    },
    {
      type: 'list',
      name: 'theme',
      message: 'Theme',
      choices: [...BUILT_IN_THEMES],
      default: partial.theme ?? 'corporate',
      when: partial.theme === undefined,
    },
    {
      type: 'list',
      name: 'renderer',
      message: 'Default renderer',
      choices: ['pdf', 'html', 'svg'],
      default: partial.renderer ?? 'pdf',
      when: partial.renderer === undefined,
    },
    {
      type: 'list',
      name: 'language',
      message: 'Language',
      choices: ['typescript', 'javascript'],
      default: partial.language ?? 'typescript',
      when: partial.language === undefined,
    },
  ]);

  return {
    name: partial.name ?? answers.name,
    packageManager: partial.packageManager ?? answers.packageManager,
    template: partial.template ?? answers.template,
    theme: partial.theme ?? answers.theme,
    renderer: partial.renderer ?? answers.renderer,
    language: partial.language ?? answers.language,
  };
}

export async function runInit(options: InitCommandOptions = {}): Promise<void> {
  logger.title('Create a new ReportForge project');

  const initOptions = await promptInitOptions(options);
  const targetDir = join(process.cwd(), initOptions.name);

  if (existsSync(targetDir)) {
    throw new Error(`Directory already exists: ${targetDir}`);
  }

  const files = getScaffoldFiles(initOptions);

  for (const [relativePath, contents] of Object.entries(files)) {
    await writeProjectFile(join(targetDir, relativePath), contents);
  }

  for (const scaffold of defaultCliRegistry.scaffolds.values()) {
    for (const [relativePath, contents] of Object.entries(scaffold.files)) {
      await writeProjectFile(join(targetDir, relativePath), contents);
    }
  }

  logger.success(`Created project at ${targetDir}`);
  logger.info(`Next steps:`);
  logger.dim(`  cd ${initOptions.name}`);
  logger.dim(`  ${initOptions.packageManager} install`);
  logger.dim(`  ${initOptions.packageManager} run render`);
  logger.dim(`  ${initOptions.packageManager} run preview`);
}
