/** Current ReportForge plugin API version used for compatibility checks. */
export const REPORTFORGE_VERSION = '0.0.0';

export interface VersionCompatibilityResult {
  readonly compatible: boolean;
  readonly reason?: string;
}

/**
 * Compares semver strings for compatibility.
 * Supports `major.minor.patch` with optional pre-release suffix.
 */
export function isVersionCompatible(
  current: string,
  minimum: string,
): VersionCompatibilityResult {
  const currentParts = parseSemver(current);
  const minimumParts = parseSemver(minimum);

  if (currentParts === null) {
    return { compatible: false, reason: `Invalid current version '${current}'.` };
  }
  if (minimumParts === null) {
    return { compatible: false, reason: `Invalid minimum version '${minimum}'.` };
  }

  if (currentParts.major < minimumParts.major) {
    return {
      compatible: false,
      reason: `ReportForge ${current} is older than required minimum ${minimum}.`,
    };
  }

  if (currentParts.major === minimumParts.major && currentParts.minor < minimumParts.minor) {
    return {
      compatible: false,
      reason: `ReportForge ${current} does not satisfy minimum ${minimum}.`,
    };
  }

  return { compatible: true };
}

export function satisfiesPeerDependency(
  installedVersion: string | undefined,
  requestedRange: string,
): VersionCompatibilityResult {
  if (installedVersion === undefined) {
    return { compatible: false, reason: `Missing peer dependency version for range '${requestedRange}'.` };
  }

  const exact = requestedRange.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (exact !== null) {
    return isVersionCompatible(installedVersion, requestedRange);
  }

  const caret = requestedRange.match(/^\^(\d+)\.(\d+)\.(\d+)$/);
  if (caret !== null) {
    const [, major, minor] = caret;
    const installed = parseSemver(installedVersion);
    const requested = parseSemver(`${major}.${minor}.0`);
    if (installed === null || requested === null) {
      return { compatible: false, reason: `Invalid peer dependency range '${requestedRange}'.` };
    }
    if (installed.major !== requested.major) {
      return {
        compatible: false,
        reason: `Installed version ${installedVersion} does not satisfy ${requestedRange}.`,
      };
    }
    return { compatible: true };
  }

  return isVersionCompatible(installedVersion, requestedRange.replace(/^>=/, ''));
}

interface SemverParts {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

function parseSemver(version: string): SemverParts | null {
  const match = version.trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (match === null) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}
