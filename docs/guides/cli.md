# ReportForge CLI

The `@reportforge/cli` package is the official command-line interface for ReportForge. It helps you scaffold projects, compile report definitions, generate output, validate configuration, and diagnose environment issues.

## Installation

```bash
# In an existing Node.js project
pnpm add -D @reportforge/cli

# Or scaffold a new project
npm create reportforge@latest
pnpm create reportforge@latest
```

## Quick start

```bash
reportforge init
cd my-reportforge-app
pnpm install
pnpm run render
pnpm run preview
reportforge validate
reportforge doctor
```

## Configuration

Create `reportforge.config.ts` in your project root:

```typescript
export default {
  renderer: 'pdf',
  theme: 'corporate',
  output: './dist',
  plugins: [],
  reports: ['./src/reports'],
};
```

| Option     | Description                                      | Default           |
| ---------- | ------------------------------------------------ | ----------------- |
| `renderer` | Default output format: `pdf`, `html`, or `svg`   | `pdf`             |
| `theme`    | Built-in theme name                              | `default`         |
| `output`   | Output directory for rendered files              | `./dist`          |
| `plugins`  | Plugin definitions passed to the plugin loader   | `[]`              |
| `reports`  | Directories scanned by `build` and `validate`    | `./src/reports`   |

## Commands

### `reportforge init`

Create a new ReportForge project interactively.

**Prompts:** project name, package manager, template, theme, renderer, language.

```bash
reportforge init
reportforge init --name my-app --template invoice --yes
```

**Scaffold templates:** Invoice, Sales Report, Dashboard, Certificate, Financial Report, Blank.

---

### `reportforge create` / `reportforge new`

Add a report file from a template to an existing project.

```bash
reportforge create invoice
reportforge new sales-report --name src/reports/q1.ts
```

---

### `reportforge build`

Compile and validate all report definitions in configured report directories. Each file must export `createReport`, `report`, or a default export.

```bash
reportforge build
```

---

### `reportforge render`

Generate output from a report file.

```bash
reportforge render src/reports/invoice.ts
reportforge render report.ts --pdf
reportforge render report.ts --html
reportforge render report.ts --svg
reportforge render report.ts --output ./out/custom.pdf
```

Report files should export a factory:

```typescript
import { Templates } from '@reportforge/templates';
import { CorporateTheme } from '@reportforge/themes';

export function createReport() {
  return Templates.Invoice.create({ /* data */ }, { theme: CorporateTheme });
}
```

---

### `reportforge preview`

Render a report and open the output in your default application or browser.

```bash
reportforge preview src/reports/invoice.ts
reportforge preview report.ts --html
```

---

### `reportforge validate`

Validate theme, templates, configuration, plugins, and assets.

```bash
reportforge validate
```

---

### `reportforge doctor`

Check Node.js version, dependencies, renderer availability, fonts, and plugin configuration.

```bash
reportforge doctor
```

---

### `reportforge list`

List built-in templates, themes, commands, and plugin scaffolds.

```bash
reportforge list
reportforge list templates
reportforge list themes
```

---

### `reportforge info`

Show project metadata and loaded configuration.

```bash
reportforge info
```

---

### `reportforge version`

Print the CLI version.

```bash
reportforge version
```

---

### `reportforge upgrade`

Print package upgrade instructions for ReportForge dependencies.

```bash
reportforge upgrade
```

## Plugin extensions

Plugins can register CLI extensions through `CliPluginRegistry`:

- **Commands** — additional subcommands
- **Generators** — custom file generators
- **Validators** — project validation hooks
- **Scaffolds** — extra init templates

```typescript
import { defaultCliRegistry } from '@reportforge/cli';

defaultCliRegistry.registerCommand({
  name: 'my-command',
  description: 'Custom plugin command',
  action: async () => { /* ... */ },
});
```

## Examples

```bash
reportforge new invoice
reportforge render examples/invoice.ts --pdf
reportforge doctor
```

When working inside the ReportForge monorepo, point `render` at any example that exports a report factory, or use the scaffolded `src/reports/main.ts` from `init`.

## Report file conventions

The CLI loads `.ts`, `.js`, `.mts`, and `.mjs` files using [jiti](https://github.com/unjs/jiti). Supported exports:

| Export            | Type                                      |
| ----------------- | ----------------------------------------- |
| `createReport`    | `() => ReportBuilder \| Promise<...>`     |
| `report`          | `ReportBuilder`                           |
| `default`         | `ReportBuilder` or factory function       |

## See also

- [First PDF](./first-pdf.md)
- [Templates](./templates.md)
- [Renderers](./renderers.md)
- [Plugins](./plugins.md)
