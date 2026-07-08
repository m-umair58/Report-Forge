import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { loadConfig } from './config.js';
import type { DoctorCheck } from './types.js';

const MIN_NODE_MAJOR = 20;

export async function runDoctorChecks(cwd = process.cwd()): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];

  const nodeVersion = process.version;
  const major = Number.parseInt(nodeVersion.slice(1).split('.')[0] ?? '0', 10);
  checks.push({
    name: 'Node.js',
    status: major >= MIN_NODE_MAJOR ? 'pass' : 'fail',
    message:
      major >= MIN_NODE_MAJOR
        ? `Node ${nodeVersion} meets the minimum (>= ${MIN_NODE_MAJOR}).`
        : `Node ${nodeVersion} is below the minimum (>= ${MIN_NODE_MAJOR}).`,
  });

  const pkgPath = join(cwd, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const corePackages = ['@reportforge/core', '@reportforge/cli'];
      for (const name of corePackages) {
        checks.push({
          name: `Dependency: ${name}`,
          status: deps[name] !== undefined ? 'pass' : 'warn',
          message:
            deps[name] !== undefined
              ? `${name}@${deps[name]} installed.`
              : `${name} is not listed in package.json.`,
        });
      }
    } catch {
      checks.push({ name: 'package.json', status: 'fail', message: 'Could not parse package.json.' });
    }
  } else {
    checks.push({
      name: 'package.json',
      status: 'warn',
      message: 'No package.json in current directory.',
    });
  }

  const config = await loadConfig(cwd);
  const renderer = config?.renderer ?? 'pdf';
  checks.push({
    name: 'Renderer',
    status: ['pdf', 'html', 'svg'].includes(renderer) ? 'pass' : 'fail',
    message: `Default renderer: ${renderer}`,
  });

  const fontsDir = join(cwd, 'assets', 'fonts');
  if (existsSync(fontsDir)) {
    checks.push({ name: 'Fonts', status: 'pass', message: 'Custom fonts directory found.' });
  } else {
    checks.push({
      name: 'Fonts',
      status: 'pass',
      message: 'Using built-in fonts (no custom fonts directory).',
    });
  }

  const pluginCount = config?.plugins?.length ?? 0;
  checks.push({
    name: 'Plugins',
    status: 'pass',
    message: pluginCount === 0 ? 'No plugins configured.' : `${pluginCount} plugin(s) configured.`,
  });

  return checks;
}
