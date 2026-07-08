# Plugin System Guide

ReportForge plugins let third-party developers extend the framework without modifying core packages. The plugin system is **type-safe**, **renderer-independent**, and designed for future expansion.

## Packages

| Package | Purpose |
|---------|---------|
| `@reportforge/plugin-sdk` | Plugin contracts, `definePlugin`, hooks, manifest validation, version checks |
| `@reportforge/plugin-loader` | Plugin loading, dependency resolution, `createReportForge`, pipeline hooks |

## Quick start

```typescript
import { createReportForge, definePlugin } from '@reportforge/plugin-loader';

const MyPlugin = definePlugin({
  id: 'my-company-components',
  name: 'My Company Components',
  version: '1.0.0',
  description: 'Custom components for Acme Corp reports.',
  register(app) {
    app.components.register({
      type: 'acme-banner',
      allowedParents: ['report', 'section'],
      allowedChildren: [],
      serialize: (component) => ({
        id: component.id,
        type: 'acme-banner',
        props: component.props,
        children: [],
      }),
    });
  },
});

const app = createReportForge();
await app.use(MyPlugin, { color: 'blue', showLogo: true });

const report = app.createReport({ metadata: { title: 'Quarterly Update' } })
  .title('Quarterly Update');

await report.toPDF('report.pdf');
```

## Plugin manifest

Every plugin must expose metadata:

```typescript
definePlugin({
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  description: 'What this plugin does',
  author: 'Your Name',
  license: 'MIT',
  homepage: 'https://example.com/my-plugin',
  keywords: ['theme', 'brand'],
  peerDependencies: {
    '@reportforge/core': '^0.0.0',
  },
  minimumReportForgeVersion: '0.0.0',
  register(app) { /* ... */ },
});
```

## Lifecycle

| Phase | When it runs |
|-------|----------------|
| `initialize` | Before registration — setup resources |
| `register` | Register extensions (components, themes, hooks) |
| `enable` | Plugin becomes active |
| `disable` | Temporarily deactivate |
| `dispose` | Cleanup when removed |

Plugins should never crash the host. Lifecycle errors are captured as diagnostics and routed to the `onError` hook.

## Extension points

Plugins can register:

- **Components** — custom schema node types
- **Themes** — design token presets
- **Templates** — reusable report layouts
- **Charts** — chart type metadata
- **Render commands** — display-list converters (future rendering)
- **Validators** — schema validation rules
- **Fonts** — font family metadata
- **Icons** — icon assets

## Hook system

Register hooks inside `register()`:

```typescript
register(app) {
  app.hooks.on('beforeLayout', async ({ schema }) => {
    console.log('Laying out', schema.metadata.title);
  });

  app.hooks.on('onError', ({ error, phase }) => {
    console.error(`Plugin pipeline error during ${phase}:`, error);
  });
}
```

Supported hooks:

- `beforeReportValidation` / `afterReportValidation`
- `beforeLayout` / `afterLayout`
- `beforeRender` / `afterRender`
- `beforeExport` / `afterExport`
- `onError`

## Dependency resolution

The loader detects:

- Duplicate plugin IDs
- Missing peer dependencies
- Version incompatibilities (`minimumReportForgeVersion`)
- Circular plugin dependencies (via `@reportforge/plugins` peer entries)

## Official example plugins

| Package | Demonstrates |
|---------|--------------|
| `@reportforge/example-plugin-theme` | Custom brand theme with config |
| `@reportforge/example-plugin-component` | Custom component type registration |
| `@reportforge/example-plugin-template` | Reusable template registration |
| `@reportforge/example-plugin-chart` | Chart + render command registration |

## Versioning strategy

- Plugins declare semver in `version`
- Set `minimumReportForgeVersion` for breaking API changes
- Use `peerDependencies` for package-level requirements
- Major bumps to extension point contracts require a plugin SDK major version

## Best practices

1. Keep plugins renderer-independent — register schema/layout extensions, not PDF calls
2. Validate configuration inside `register()` and throw descriptive errors early
3. Use hooks for cross-cutting concerns (logging, metrics, enrichment)
4. Namespace custom component types (`acme-banner`, not `banner`)
5. Publish under `@scope/reportforge-plugin-<name>` or `reportforge-plugin-<name>`

## Out of scope (future milestones)

- Remote plugin marketplace
- Automatic downloads
- Sandboxed execution
- Online plugin registry

## Migration from direct `Report.create()`

**Before:**

```typescript
import { Report } from '@reportforge/core';

const report = Report.create({ theme: 'corporate' });
```

**After (with plugins):**

```typescript
import { createReportForge } from '@reportforge/plugin-loader';

const app = createReportForge();
await app.use(MyPlugin);

const report = app.createReport({ theme: 'corporate' });
```

Existing reports continue to work with `Report.create()`. Use `createReportForge()` when you need plugin extensions and lifecycle management.
