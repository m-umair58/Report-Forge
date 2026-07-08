/** Package identifier for @reportforge/cli. */
export const PACKAGE_NAME = '@reportforge/cli' as const;

/** Returns the package identifier. */
export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}
