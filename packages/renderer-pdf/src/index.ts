/** Package identifier for @reportforge/renderer-pdf. */
export const PACKAGE_NAME = '@reportforge/renderer-pdf' as const;

/** Returns the package identifier. */
export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}
