import { describe, expect, it } from 'vitest';

import { createProgram } from './cli.js';
import { mergeConfig } from './config.js';
import { resolveFormat } from './report-loader.js';
import { getScaffoldFiles } from './scaffolds/index.js';
import { validateConfiguration, validateTheme } from './validate.js';

describe('resolveFormat', () => {
  it('defaults to pdf', () => {
    expect(resolveFormat({})).toBe('pdf');
  });

  it('respects format flags', () => {
    expect(resolveFormat({ html: true })).toBe('html');
    expect(resolveFormat({ svg: true })).toBe('svg');
    expect(resolveFormat({ pdf: true })).toBe('pdf');
    expect(resolveFormat({ format: 'svg' })).toBe('svg');
  });
});

describe('mergeConfig', () => {
  it('merges overrides with defaults', () => {
    expect(
      mergeConfig({ renderer: 'pdf', theme: 'corporate' }, { output: './out' }),
    ).toEqual({
      renderer: 'pdf',
      theme: 'corporate',
      output: './out',
      plugins: [],
      reports: [],
    });
  });
});

describe('validateConfiguration', () => {
  it('flags invalid renderer', () => {
    const issues = validateConfiguration('/tmp', { renderer: 'docx' });
    expect(issues.some((i) => i.level === 'error')).toBe(true);
  });
});

describe('validateTheme', () => {
  it('accepts built-in theme names', () => {
    const issues = validateTheme({ theme: 'corporate' });
    expect(issues.some((i) => i.level === 'error')).toBe(false);
  });
});

describe('getScaffoldFiles', () => {
  it('generates invoice project files', () => {
    const files = getScaffoldFiles({
      name: 'demo-app',
      packageManager: 'pnpm',
      template: 'invoice',
      theme: 'corporate',
      renderer: 'pdf',
      language: 'typescript',
    });

    expect(files['package.json']).toContain('"name": "demo-app"');
    expect(files['src/reports/main.ts']).toContain('Templates.Invoice.create');
    expect(files['reportforge.config.ts']).toContain("renderer: 'pdf'");
  });
});

describe('createProgram', () => {
  it('registers core commands', () => {
    const program = createProgram();
    const names = program.commands.map((cmd) => cmd.name());
    expect(names).toContain('init');
    expect(names).toContain('render');
    expect(names).toContain('doctor');
    expect(names).toContain('validate');
  });

  it('registers render format options', () => {
    const program = createProgram();
    const render = program.commands.find((cmd) => cmd.name() === 'render');
    expect(render).toBeDefined();
    const longFlags = render!.options.map((option) => option.long);
    expect(longFlags).toContain('--html');
    expect(longFlags).toContain('--svg');
    expect(longFlags).toContain('--pdf');
  });
});
