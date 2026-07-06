import { describe, expect, it } from 'vitest';

import { getPackageName, PACKAGE_NAME } from './index.js';

describe('@reportforge/renderer-pdf', () => {
  it('exports the package identifier', () => {
    expect(PACKAGE_NAME).toBe('@reportforge/renderer-pdf');
    expect(getPackageName()).toBe('@reportforge/renderer-pdf');
  });
});
