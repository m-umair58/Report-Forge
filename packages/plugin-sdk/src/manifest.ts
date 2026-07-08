/** Required metadata every plugin must expose. */
export interface PluginManifest {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly author?: string;
  readonly license?: string;
  readonly homepage?: string;
  readonly keywords?: readonly string[];
  readonly peerDependencies?: Readonly<Record<string, string>>;
  readonly minimumReportForgeVersion?: string;
}

export function validateManifest(manifest: PluginManifest): readonly string[] {
  const errors: string[] = [];

  if (manifest.id.trim().length === 0) {
    errors.push('Plugin manifest requires a non-empty id.');
  }
  if (manifest.name.trim().length === 0) {
    errors.push('Plugin manifest requires a non-empty name.');
  }
  if (manifest.version.trim().length === 0) {
    errors.push('Plugin manifest requires a version.');
  }
  if (manifest.description.trim().length === 0) {
    errors.push('Plugin manifest requires a description.');
  }

  return errors;
}
