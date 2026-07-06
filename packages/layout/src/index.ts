/** Package identifier for @reportforge/layout. */
export const PACKAGE_NAME = '@reportforge/layout' as const;

/** Returns the package identifier. */
export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}
