import { describe, expect, it } from 'vitest';

import { getPackageName, PACKAGE_NAME } from './index.js';

describe('@reportforge/templates', () => {
  it('exports the package identifier', () => {
    expect(PACKAGE_NAME).toBe('@reportforge/templates');
    expect(getPackageName()).toBe('@reportforge/templates');
  });
});
