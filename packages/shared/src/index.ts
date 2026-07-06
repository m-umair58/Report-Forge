export * from './contracts/index.js';

/** Package identifier for @reportforge/shared. */
export const PACKAGE_NAME = '@reportforge/shared' as const;

/** Returns the package identifier. */
export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}
