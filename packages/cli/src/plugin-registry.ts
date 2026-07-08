import type {
  CliCommandDefinition,
  CliGeneratorDefinition,
  CliValidatorDefinition,
} from './types.js';

/** Registry for plugin-contributed CLI extensions. */
export class CliPluginRegistry {
  readonly commands = new Map<string, CliCommandDefinition>();
  readonly generators = new Map<string, CliGeneratorDefinition>();
  readonly validators = new Map<string, CliValidatorDefinition>();
  readonly scaffolds = new Map<string, { readonly id: string; readonly description: string; readonly files: Readonly<Record<string, string>> }>();

  registerCommand(command: CliCommandDefinition): void {
    this.commands.set(command.name, command);
  }

  registerGenerator(generator: CliGeneratorDefinition): void {
    this.generators.set(generator.id, generator);
  }

  registerValidator(validator: CliValidatorDefinition): void {
    this.validators.set(validator.id, validator);
  }

  registerScaffold(
    id: string,
    description: string,
    files: Readonly<Record<string, string>>,
  ): void {
    this.scaffolds.set(id, { id, description, files });
  }

  listCommands(): readonly string[] {
    return [...this.commands.keys()].sort();
  }
}

export const defaultCliRegistry = new CliPluginRegistry();
