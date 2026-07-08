import { Command } from 'commander';

import { runBuild } from './commands/build.js';
import { runCreate } from './commands/create.js';
import { runDoctorCommand } from './commands/doctor.js';
import { runInfoCommand } from './commands/info.js';
import { runInit } from './commands/init.js';
import { runList } from './commands/list.js';
import { runPreview } from './commands/preview.js';
import { runRenderCommand } from './commands/render.js';
import { runValidateCommand } from './commands/validate.js';
import { getCliVersion, runUpgradeCommand, runVersionCommand } from './commands/version.js';
import { defaultCliRegistry } from './plugin-registry.js';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('reportforge')
    .description('Official CLI for ReportForge — scaffold, build, render, and validate reports');

  program
    .command('init')
    .description('Create a new ReportForge project')
    .option('-n, --name <name>', 'Project name')
    .option('--package-manager <pm>', 'Package manager (pnpm, npm, yarn)')
    .option('-t, --template <template>', 'Scaffold template')
    .option('--theme <theme>', 'Default theme')
    .option('--renderer <renderer>', 'Default renderer (pdf, html, svg)')
    .option('--language <language>', 'Language (typescript, javascript)')
    .option('-y, --yes', 'Skip prompts when required options are provided')
    .action(async (options) => {
      await runInit(options);
    });

  program
    .command('create [template]')
    .alias('new')
    .description('Add a report file from a template')
    .option('-n, --name <path>', 'Output file path')
    .option('-t, --template <template>', 'Template id')
    .option('--theme <theme>', 'Theme id')
    .action(async (template, options) => {
      await runCreate(template, options);
    });

  program
    .command('build')
    .description('Compile and validate report definitions')
    .action(async () => {
      await runBuild();
    });

  const renderOptions = (cmd: Command): Command =>
    cmd
      .option('--pdf', 'Render as PDF')
      .option('--html', 'Render as HTML')
      .option('--svg', 'Render as SVG')
      .option('-f, --format <format>', 'Output format (pdf, html, svg)')
      .option('-o, --output <path>', 'Output file path');

  renderOptions(
    program
      .command('render <file>')
      .description('Generate report output')
      .action(async (file, options) => {
        await runRenderCommand(file, options);
      }),
  );

  renderOptions(
    program
      .command('preview <file>')
      .description('Render and open output in the default application')
      .action(async (file, options) => {
        await runPreview(file, options);
      }),
  );

  program
    .command('validate')
    .description('Validate theme, template, configuration, plugins, and assets')
    .action(async () => {
      await runValidateCommand();
    });

  program
    .command('doctor')
    .description('Check Node version, dependencies, fonts, renderer, and plugins')
    .action(async () => {
      await runDoctorCommand();
    });

  program
    .command('list [category]')
    .description('List templates, themes, commands, or plugins')
    .action((category) => {
      const valid = ['templates', 'themes', 'commands', 'plugins', 'all'] as const;
      const selected = valid.includes(category) ? category : 'all';
      runList(selected);
    });

  program
    .command('info')
    .description('Show project and configuration information')
    .action(async () => {
      await runInfoCommand();
    });

  program
    .command('version')
    .description('Print CLI version')
    .action(async () => {
      await runVersionCommand();
    });

  program
    .command('upgrade')
    .description('Show upgrade instructions for ReportForge packages')
    .action(async () => {
      await runUpgradeCommand();
    });

  for (const command of defaultCliRegistry.commands.values()) {
    program.command(command.name).description(command.description).action(command.action);
  }

  return program;
}

export async function runCli(argv: readonly string[]): Promise<void> {
  const program = createProgram();
  const version = await getCliVersion();
  program.version(version);
  await program.parseAsync([...argv]);
}
