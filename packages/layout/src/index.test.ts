import { describe, expect, it } from 'vitest';

import { getPackageName, PACKAGE_NAME } from './index.js';

describe('@reportforge/layout', () => {
  it('exports the package identifier', () => {
    expect(PACKAGE_NAME).toBe('@reportforge/layout');
    expect(getPackageName()).toBe('@reportforge/layout');
  });
});
