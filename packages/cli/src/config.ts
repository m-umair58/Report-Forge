import { existsSync } from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import { createJiti } from 'jiti';

import type { ReportForgeConfig } from './types.js';

const CONFIG_FILES = [
  'reportforge.config.ts',
  'reportforge.config.mts',
  'reportforge.config.js',
  'reportforge.config.mjs',
] as const;

export function findConfigFile(cwd = process.cwd()): string | null {
  for (const file of CONFIG_FILES) {
    const fullPath = join(cwd, file);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

export async function loadConfig(cwd = process.cwd()): Promise<ReportForgeConfig | null> {
  const configPath = findConfigFile(cwd);
  if (configPath === null) return null;

  const jiti = createJiti(import.meta.url, { interopDefault: true });
  const loaded = jiti(configPath) as ReportForgeConfig | { default: ReportForgeConfig };
  if (loaded !== null && typeof loaded === 'object' && 'default' in loaded) {
    return loaded.default;
  }
  return loaded as ReportForgeConfig;
}

export function mergeConfig(
  base: ReportForgeConfig | null,
  overrides: Partial<ReportForgeConfig>,
): ReportForgeConfig {
  return {
    ...(base ?? {}),
    ...overrides,
    plugins: overrides.plugins ?? base?.plugins ?? [],
    reports: overrides.reports ?? base?.reports ?? [],
  };
}

export function configFileTemplate(options: {
  renderer: string;
  theme: string;
  output: string;
}): string {
  return `import type { ReportForgeConfig } from '@reportforge/cli';

const config: ReportForgeConfig = {
  renderer: '${options.renderer}',
  theme: '${options.theme}',
  output: '${options.output}',
  plugins: [],
  reports: ['./src/reports'],
};

export default config;
`;
}

export async function writeProjectFile(path: string, contents: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents, 'utf8');
}

export async function readJsonFile<T>(path: string): Promise<T> {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as T;
}

export function resolveOutputPath(
  config: ReportForgeConfig | null,
  reportPath: string,
  format: string,
): string {
  const outputDir = resolve(process.cwd(), config?.output ?? './dist');
  const baseName = reportPath.replace(/\.[^.]+$/, '').split(/[/\\]/).pop() ?? 'report';
  const extension = format === 'html' ? 'html' : format === 'svg' ? 'svg' : 'pdf';
  return join(outputDir, `${baseName}.${extension}`);
}
