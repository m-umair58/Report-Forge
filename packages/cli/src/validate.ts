import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { builtInThemes } from '@reportforge/themes';

import { findConfigFile, loadConfig } from './config.js';
import { defaultCliRegistry } from './plugin-registry.js';
import type { ValidationContext, ValidationIssue } from './types.js';
import { BUILT_IN_TEMPLATES } from './types.js';

const THEME_IDS = new Set(builtInThemes.map((t) => t.name));

export async function createValidationContext(cwd = process.cwd()): Promise<ValidationContext> {
  return { cwd, config: await loadConfig(cwd) };
}

export function validateTheme(config: ValidationContext['config']): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const theme = config?.theme;

  if (theme === undefined || theme === '') {
    issues.push({ level: 'info', message: 'No theme configured; default theme will be used.' });
    return issues;
  }

  if (!THEME_IDS.has(theme)) {
    issues.push({
      level: 'warning',
      message: `Theme '${theme}' is not a built-in theme. Ensure a plugin registers it.`,
    });
  }

  return issues;
}

export function validateConfiguration(cwd: string, config: ValidationContext['config']): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (config === null) {
    issues.push({
      level: 'warning',
      message: 'No reportforge.config file found.',
      path: cwd,
    });
    return issues;
  }

  if (config.output !== undefined && config.output.trim() === '') {
    issues.push({ level: 'error', message: 'Config output path must not be empty.', path: 'output' });
  }

  if (config.renderer !== undefined && !['pdf', 'html', 'svg'].includes(config.renderer)) {
    issues.push({
      level: 'error',
      message: `Invalid renderer '${config.renderer}'. Use pdf, html, or svg.`,
      path: 'renderer',
    });
  }

  return issues;
}

export function validateTemplateReferences(): ValidationIssue[] {
  return BUILT_IN_TEMPLATES.map((name) => ({
    level: 'info' as const,
    message: `Built-in template available: ${name}`,
  }));
}

export async function validateAssets(cwd: string, config: ValidationContext['config']): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const reportDirs = config?.reports ?? ['./src/reports'];

  for (const dir of reportDirs) {
    const absolute = resolve(cwd, dir);
    if (!existsSync(absolute)) {
      issues.push({
        level: 'warning',
        message: `Reports directory not found: ${dir}`,
        path: absolute,
      });
      continue;
    }

    const entries = await readdir(absolute, { withFileTypes: true });
    const reportFiles = entries.filter((e) => e.isFile() && /\.(ts|js|mts|mjs)$/.test(e.name));
    if (reportFiles.length === 0) {
      issues.push({
        level: 'warning',
        message: `No report files in ${dir}`,
        path: absolute,
      });
    }
  }

  const assetsDir = join(cwd, 'assets');
  if (existsSync(assetsDir)) {
    issues.push({ level: 'info', message: 'Assets directory found.', path: assetsDir });
  }

  return issues;
}

export async function validatePlugins(config: ValidationContext['config']): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const plugins = config?.plugins ?? [];

  if (plugins.length === 0) {
    issues.push({ level: 'info', message: 'No plugins configured.' });
    return issues;
  }

  for (const plugin of plugins) {
    const name =
      typeof plugin === 'object' && plugin !== null && 'name' in plugin
        ? String((plugin as { name: string }).name)
        : 'unknown';
    issues.push({ level: 'info', message: `Plugin registered: ${name}` });
  }

  for (const validator of defaultCliRegistry.validators.values()) {
    issues.push(...validator.validate({ cwd: process.cwd(), config }));
  }

  return issues;
}

export async function runValidation(cwd = process.cwd()): Promise<ValidationIssue[]> {
  const context = await createValidationContext(cwd);
  const configPath = findConfigFile(cwd);

  return [
    ...(configPath !== null
      ? [{ level: 'info' as const, message: `Config loaded: ${configPath}`, path: configPath }]
      : []),
    ...validateConfiguration(cwd, context.config),
    ...validateTheme(context.config),
    ...validateTemplateReferences(),
    ...(await validateAssets(cwd, context.config)),
    ...(await validatePlugins(context.config)),
  ];
}
