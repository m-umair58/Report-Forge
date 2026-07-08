export interface PluginDiagnostic {
  readonly pluginId?: string;
  readonly code: string;
  readonly message: string;
  readonly severity: 'error' | 'warning' | 'info';
  readonly cause?: unknown;
}

export class PluginError extends Error {
  readonly diagnostics: readonly PluginDiagnostic[];

  constructor(message: string, diagnostics: readonly PluginDiagnostic[] = []) {
    super(message);
    this.name = 'PluginError';
    this.diagnostics = diagnostics;
  }
}

export function createDiagnostic(
  code: string,
  message: string,
  options?: {
    readonly pluginId?: string;
    readonly severity?: PluginDiagnostic['severity'];
    readonly cause?: unknown;
  },
): PluginDiagnostic {
  return {
    code,
    message,
    severity: options?.severity ?? 'error',
    ...(options?.pluginId !== undefined ? { pluginId: options.pluginId } : {}),
    ...(options?.cause !== undefined ? { cause: options.cause } : {}),
  };
}
