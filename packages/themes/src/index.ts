/** Package identifier for @reportforge/themes. */
export const PACKAGE_NAME = '@reportforge/themes' as const;

/** Returns the package identifier. */
export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}
