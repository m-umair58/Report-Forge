import { builtInThemes } from '@reportforge/themes';

import { logger } from '../logger.js';
import { defaultCliRegistry } from '../plugin-registry.js';
import { BUILT_IN_TEMPLATES, SCAFFOLD_TEMPLATES } from '../types.js';

export type ListCategory = 'templates' | 'themes' | 'commands' | 'plugins' | 'all';

export function runList(category: ListCategory = 'all'): void {
  const sections: Array<{ title: string; items: readonly string[] }> = [];

  if (category === 'templates' || category === 'all') {
    sections.push({
      title: 'Built-in document templates',
      items: BUILT_IN_TEMPLATES,
    });
    sections.push({
      title: 'Scaffold templates (init/create)',
      items: SCAFFOLD_TEMPLATES.map((t) => `${t.id} — ${t.label}`),
    });
  }

  if (category === 'themes' || category === 'all') {
    sections.push({
      title: 'Built-in themes',
      items: builtInThemes.map((t) => t.name),
    });
  }

  if (category === 'commands' || category === 'all') {
    const pluginCommands = defaultCliRegistry.listCommands();
    sections.push({
      title: 'CLI commands',
      items: [
        'init',
        'create',
        'build',
        'render',
        'preview',
        'validate',
        'doctor',
        'list',
        'info',
        'version',
        'upgrade',
        ...pluginCommands,
      ],
    });
  }

  if (category === 'plugins' || category === 'all') {
    sections.push({
      title: 'Plugin scaffolds',
      items:
        defaultCliRegistry.scaffolds.size === 0
          ? ['(none registered)']
          : [...defaultCliRegistry.scaffolds.values()].map((s) => `${s.id} — ${s.description}`),
    });
  }

  for (const section of sections) {
    logger.title(section.title);
    for (const item of section.items) {
      logger.dim(`  • ${item}`);
    }
  }
}
