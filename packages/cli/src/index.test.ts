import { describe, expect, it } from 'vitest';

import { getPackageName, PACKAGE_NAME } from './index.js';

describe('@reportforge/cli', () => {
  it('exports the package identifier', () => {
    expect(PACKAGE_NAME).toBe('@reportforge/cli');
    expect(getPackageName()).toBe('@reportforge/cli');
  });
});
