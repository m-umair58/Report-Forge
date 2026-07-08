import { describe, expect, it } from 'vitest';

import {
  definePlugin,
  isVersionCompatible,
  satisfiesPeerDependency,
  validateManifest,
} from './index.js';

describe('definePlugin', () => {
  it('creates a plugin with manifest metadata', () => {
    const plugin = definePlugin({
      id: 'demo',
      name: 'Demo',
      version: '1.0.0',
      description: 'Demo plugin',
      register() {},
    });

    expect(plugin.manifest.id).toBe('demo');
    expect(plugin.manifest.version).toBe('1.0.0');
  });
});

describe('validateManifest', () => {
  it('reports missing required fields', () => {
    const errors = validateManifest({
      id: '',
      name: 'Demo',
      version: '1.0.0',
      description: 'Demo',
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('version compatibility', () => {
  it('accepts compatible versions', () => {
    expect(isVersionCompatible('1.2.0', '1.0.0').compatible).toBe(true);
  });

  it('rejects older major versions', () => {
    expect(isVersionCompatible('0.9.0', '1.0.0').compatible).toBe(false);
  });

  it('validates peer dependency ranges', () => {
    expect(satisfiesPeerDependency('1.2.3', '^1.0.0').compatible).toBe(true);
    expect(satisfiesPeerDependency(undefined, '^1.0.0').compatible).toBe(false);
  });
});
