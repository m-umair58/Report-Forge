import { describe, expect, it } from 'vitest';

import { getPackageName, PACKAGE_NAME } from './index.js';

describe('@reportforge/themes', () => {
  it('exports the package identifier', () => {
    expect(PACKAGE_NAME).toBe('@reportforge/themes');
    expect(getPackageName()).toBe('@reportforge/themes');
  });
});
