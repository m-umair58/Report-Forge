# Plugin System

ReportForge is designed for extension. The plugin system provides a unified registration mechanism for components, themes, renderers, templates, and validators.

Plugins implement `IPlugin` and register extensions through a central registry provided by `@reportforge/core`.

## Plugin Contract

```typescript
interface IPlugin {
  readonly name: string;
  readonly version: string;
  register(registry: IPluginRegistry): void;
}
```

## Plugin Registry

```typescript
interface IPluginRegistry {
  registerComponent(definition: ComponentDefinition): void;
  registerRenderer(renderer: IRenderer): void;
  registerTheme(theme: ITheme): void;
  registerTemplate(template: TemplateDefinition): void;
  registerValidator(validator: ValidatorDefinition): void;
}
```

## Extension Points

### 1. Components

Register custom component types that integrate with the Builder API and report schema.

```typescript
registry.registerComponent({
  type: 'custom-widget',
  allowedParents: ['section'],
  allowedChildren: [],
  builderMethod: 'customWidget',
  serialize: (component: IComponent): IReportNode => ({
    id: component.id,
    type: 'custom-widget',
    props: component.props,
    children: [],
  }),
});
```

**When to use:** Adding domain-specific content blocks (e.g., invoice line items, Gantt charts, org charts).

### 2. Themes

Register visual themes that define typography, colors, and spacing.

```typescript
registry.registerTheme({
  name: 'corporate',
  tokens: {
    colors: { primary: '#003366', secondary: '#666666' },
    typography: { fontFamily: 'Inter', fontSize: 12 },
    spacing: { section: 24, paragraph: 12 },
  },
});
```

**When to use:** Brand-specific styling, dark mode themes, industry templates.

### 3. Renderers

Register output format renderers.

```typescript
registry.registerRenderer({
  name: 'html',
  mimeTypes: ['text/html'],
  render: async (context: IRenderContext) => {
    // Future HTML renderer implementation
    return new Uint8Array();
  },
});
```

**When to use:** Supporting new output formats (HTML, DOCX, PNG, etc.).

### 4. Templates

Register reusable report structures.

```typescript
registry.registerTemplate({
  name: 'invoice',
  description: 'Standard invoice layout',
  build: (builder: IBuilder, data: Record<string, unknown>) => {
    builder
      .header()
      .title('Invoice')
      .endHeader()
      .section('Line Items')
      .table({ columns: data['columns'], rows: data['rows'] })
      .endSection();
  },
});
```

**When to use:** Pre-built report layouts that teams reuse with different data.

### 5. Validators

Register custom validation rules for the report schema.

```typescript
registry.registerValidator({
  name: 'max-table-rows',
  validate: (node: IReportNode) => {
    if (node.type === 'table') {
      const rows = node.props['rows'];
      if (Array.isArray(rows) && rows.length > 1000) {
        return { valid: false, message: 'Tables cannot exceed 1000 rows' };
      }
    }
    return { valid: true };
  },
});
```

**When to use:** Business rules, compliance constraints, organizational policies.

## Plugin Lifecycle

```
1. Developer creates IPlugin
2. Plugin is passed to Report.create({ plugins: [...] })
3. Core initializes IPluginRegistry
4. Plugin.register(registry) is called
5. Extensions are available for the report lifecycle
```

Plugins are scoped to the report instance that registered them. They do not mutate global state.

## Plugin Discovery

### Explicit Registration (default)

```typescript
import { Report } from '@reportforge/core';
import { acmePlugin } from '@acme/reportforge-plugin';

const report = Report.create({ plugins: [acmePlugin] });
```

### Package Naming Convention

Community plugins should follow the naming pattern:

```
@scope/reportforge-plugin-<name>
reportforge-plugin-<name>
```

## Dependency Rules

| Plugin type | May depend on                                             | Must not depend on               |
| ----------- | --------------------------------------------------------- | -------------------------------- |
| Component   | `@reportforge/shared`, `@reportforge/core`                | Renderer packages                |
| Theme       | `@reportforge/shared`, `@reportforge/themes`              | Renderer packages                |
| Renderer    | `@reportforge/shared`, `@reportforge/layout` (types only) | `@reportforge/core`              |
| Template    | `@reportforge/core`                                       | Renderer packages                |
| Validator   | `@reportforge/shared`                                     | Renderer packages, layout engine |

## Versioning

Plugins declare a `version` string. Core checks compatibility with the current schema version during registration. Breaking changes to extension point contracts require a major version bump of the plugin API.

## Security Considerations

- Plugins execute during report generation with the same privileges as the host process.
- Validators should not execute arbitrary code from schema content.
- Renderer plugins should sanitize any external resources (images, fonts) they load.

## Relationship to Packages

| Package                     | Plugin support                                                    |
| --------------------------- | ----------------------------------------------------------------- |
| `@reportforge/core`         | Owns `IPlugin`, `IPluginRegistry`, and registration orchestration |
| `@reportforge/shared`       | Defines extension point interfaces                                |
| `@reportforge/layout`       | Consumes registered component layout hints                        |
| `@reportforge/renderer-pdf` | Registers itself as a built-in renderer                           |
| `@reportforge/themes`       | Provides built-in themes; accepts plugin themes                   |
| `@reportforge/templates`    | Provides built-in templates; accepts plugin templates             |
