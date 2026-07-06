/** Package identifier for @reportforge/templates. */
export const PACKAGE_NAME = '@reportforge/templates' as const;

/** Returns the package identifier. */
export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}
