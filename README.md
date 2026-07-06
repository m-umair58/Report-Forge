# ReportForge

ReportForge is a professional open-source reporting framework for Node.js. Developers describe reports in a natural, type-safe API; the framework handles layout; renderers produce the output.

ReportForge is **not** a PDF library. It is a reporting framework with a renderer-independent architecture.

## Vision

Build the best open-source reporting framework for Node.js with developer experience as the highest priority.

## Goals

- **Beautiful API** — describe business reports, not drawing primitives
- **Extensible** — plug in renderers, themes, and templates
- **Renderer independent** — layout and rendering are decoupled
- **Type-safe** — fully typed public APIs with strict TypeScript
- **Production-ready** — designed for real-world reporting workloads

## Architecture

ReportForge follows a layered pipeline where each stage communicates through interfaces:

```
Developer Code
      ↓
Builder API
      ↓
Component Tree
      ↓
Report Schema (Intermediate Representation)
      ↓
Validation
      ↓
Layout Engine
      ↓
Renderer
      ↓
Output
```

Key principles:

- The **Builder** knows nothing about PDF or any output format.
- The **renderer** knows nothing about the Builder API.
- Everything communicates through **interfaces** defined in `@reportforge/shared`.

### Example

```typescript
import { Report } from '@reportforge/core';

const report = Report.create({
  metadata: { title: 'Quarterly Sales', theme: 'corporate' },
});

const pdf = await report
  .title('Quarterly Sales Report')
  .section('Overview')
  .paragraph('Revenue increased by 12%.')
  .table({ columns, rows })
  .endSection()
  .footer('Confidential')
  .render({ format: 'pdf' });
```

### Packages

| Package                     | Responsibility                                  |
| --------------------------- | ----------------------------------------------- |
| `@reportforge/core`         | Builder API, component tree, schema, validation |
| `@reportforge/shared`       | Interfaces and shared types                     |
| `@reportforge/layout`       | Pagination, spacing, positioning                |
| `@reportforge/renderer-pdf` | PDF output generation                           |
| `@reportforge/themes`       | Typography, colors, spacing tokens              |
| `@reportforge/templates`    | Reusable report templates                       |
| `@reportforge/cli`          | Command-line interface                          |

### Architecture Documentation

Full architecture documentation is in [`docs/architecture/`](docs/architecture/):

- [Overview](docs/architecture/overview.md)
- [Report Pipeline](docs/architecture/report-pipeline.md)
- [Component System](docs/architecture/component-system.md)
- [Report Schema](docs/architecture/report-schema.md)
- [Builder API](docs/architecture/builder-api.md)
- [Layout Engine](docs/architecture/layout-engine.md)
- [Renderer](docs/architecture/renderer.md)
- [Plugin System](docs/architecture/plugin-system.md)
- [Theme System](docs/architecture/theme-system.md)
- [Package Responsibilities](docs/architecture/package-responsibilities.md)
- [Lifecycle](docs/architecture/lifecycle.md)

## Repository Structure

```
reportforge/
├── .changeset/          # Version management (Changesets)
├── .cursor/             # Cursor IDE rules and prompts
├── .github/workflows/   # CI pipelines
├── docs/
│   ├── architecture/    # Architecture documentation (source of truth)
│   ├── api/             # API reference
│   ├── guides/          # How-to guides
│   └── decisions/       # Architecture Decision Records
├── examples/            # Example projects
├── packages/
│   ├── core/            # @reportforge/core
│   ├── layout/          # @reportforge/layout
│   ├── renderer-pdf/    # @reportforge/renderer-pdf
│   ├── shared/          # @reportforge/shared (interfaces)
│   ├── themes/          # @reportforge/themes
│   ├── templates/       # @reportforge/templates
│   └── cli/             # @reportforge/cli
└── scripts/             # Development scripts
```

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 10

### Getting Started

```bash
git clone https://github.com/reportforge/reportforge.git
cd reportforge
pnpm install
```

### Commands

| Command             | Description                       |
| ------------------- | --------------------------------- |
| `pnpm build`        | Build all packages                |
| `pnpm test`         | Run all tests                     |
| `pnpm lint`         | Lint all packages                 |
| `pnpm format`       | Format code with Prettier         |
| `pnpm format:check` | Check formatting                  |
| `pnpm changeset`    | Create a changeset for versioning |

### Verify Everything

```bash
./scripts/verify.sh
```

## Contributing

We welcome contributions. Please follow these guidelines:

1. **Read the architecture docs** — [`docs/architecture/`](docs/architecture/) is the source of truth for all implementation
2. **Conventional commits** — use [Conventional Commits](https://www.conventionalcommits.org/) format (enforced by Commitlint)
3. **Changesets** — add a changeset when your PR includes user-facing changes: `pnpm changeset`
4. **Tests** — include tests for new functionality
5. **Documentation** — update docs for public API changes

### Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `./scripts/verify.sh` locally
5. Open a pull request

## License

[MIT](LICENSE)
