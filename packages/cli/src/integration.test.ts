import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { runInit } from './commands/init.js';
import { runBuild } from './commands/build.js';
import { runValidation } from './validate.js';

describe('init scaffolding', () => {
  it('creates a project with report and config files', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'rf-cli-'));
    const previousCwd = process.cwd();

    try {
      process.chdir(parent);
      await runInit({
        yes: true,
        name: 'test-project',
        template: 'blank',
        theme: 'minimal',
        renderer: 'pdf',
        packageManager: 'pnpm',
        language: 'typescript',
      });

      const projectDir = join(parent, 'test-project');
      const issues = await runValidation(projectDir);
      expect(issues.some((i) => i.level === 'error')).toBe(false);
      await runBuild(projectDir);
    } finally {
      process.chdir(previousCwd);
      await rm(parent, { recursive: true, force: true });
    }
  });
});

describe('runValidation', () => {
  it('warns when config is missing', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'rf-val-'));
    try {
      const issues = await runValidation(dir);
      expect(issues.some((i) => i.message.includes('No reportforge.config'))).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('loads config and reports directory', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'rf-val-'));
    try {
      await writeFile(
        join(dir, 'reportforge.config.ts'),
        "export default { renderer: 'pdf', theme: 'corporate', output: './dist', reports: ['./src/reports'] };",
      );
      await mkdir(join(dir, 'src', 'reports'), { recursive: true });
      await writeFile(join(dir, 'src', 'reports', 'main.ts'), 'export const report = 1;');

      const issues = await runValidation(dir);
      expect(issues.some((i) => i.message.includes('Config loaded'))).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
