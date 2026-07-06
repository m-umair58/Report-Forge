# Renderer

Renderers convert the laid-out document model into a specific output format. Each renderer implements `IRenderer` and handles all format-specific details internally.

Renderers live in dedicated packages (e.g., `@reportforge/renderer-pdf`). They depend on layout output, not on the Builder API or component tree.

## Renderer Contract

```typescript
interface IRenderer {
  readonly name: string;
  readonly mimeTypes: readonly string[];
  render(context: IRenderContext): Promise<Uint8Array>;
}
```

### Fields

| Field       | Description                                          |
| ----------- | ---------------------------------------------------- |
| `name`      | Unique renderer identifier (e.g., `'pdf'`, `'html'`) |
| `mimeTypes` | Supported MIME types (e.g., `'application/pdf'`)     |
| `render`    | Converts layout output to bytes                      |

## Render Context

```typescript
interface IRenderContext {
  readonly document: LayoutOutput;
  readonly theme: ITheme;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly options?: Readonly<Record<string, unknown>>;
}
```

| Field      | Description                                                   |
| ---------- | ------------------------------------------------------------- |
| `document` | Laid-out pages and positioned elements from the layout engine |
| `theme`    | Resolved theme for format-specific value mapping              |
| `metadata` | Report metadata (title, author, etc.)                         |
| `options`  | Renderer-specific options (compression, quality, etc.)        |

## Responsibilities

| Responsibility      | Description                                            |
| ------------------- | ------------------------------------------------------ |
| Format generation   | Produce valid output in the target format              |
| Element drawing     | Render each `LayoutElement` at its computed position   |
| Font embedding      | Embed or reference fonts appropriate for the format    |
| Image encoding      | Embed images in the format-native representation       |
| Metadata embedding  | Set document properties (title, author, creation date) |
| Resource management | Manage memory and streams for large documents          |

## Input and Output

```
Input:  IRenderContext { document, theme, metadata, options }
Output: Uint8Array (or ReadableStream in future versions)
```

The renderer receives positioned elements — it does not compute layout.

## Renderer Independence

```
Builder API ──✕──> Renderer     (no direct connection)
Component Tree ──✕──> Renderer  (no direct connection)
Report Schema ──✕──> Renderer   (no direct connection — layout sits in between)
Layout Output ──✓──> Renderer   (only valid input)
```

## Built-in and Future Renderers

| Renderer | Package                      | Output                                                                    | Status  |
| -------- | ---------------------------- | ------------------------------------------------------------------------- | ------- |
| PDF      | `@reportforge/renderer-pdf`  | `application/pdf`                                                         | Planned |
| HTML     | `@reportforge/renderer-html` | `text/html`                                                               | Future  |
| DOCX     | `@reportforge/renderer-docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | Future  |
| PNG      | `@reportforge/renderer-png`  | `image/png`                                                               | Future  |
| JPEG     | `@reportforge/renderer-jpeg` | `image/jpeg`                                                              | Future  |

Each renderer is a separate package that implements `IRenderer`. New renderers are registered via the plugin system.

## Renderer Registration

```typescript
const plugin: IPlugin = {
  name: 'html-renderer',
  register(registry) {
    registry.registerRenderer({
      name: 'html',
      mimeTypes: ['text/html'],
      render: async (context) => {
        // HTML generation logic (future implementation)
        return new Uint8Array();
      },
    });
  },
};
```

## Renderer-Specific Options

Each renderer may accept options via `IRenderContext.options`:

### PDF (planned)

```typescript
{
  compress: true,
  pdfVersion: '1.7',
  embedFonts: true,
}
```

### HTML (future)

```typescript
{
  standalone: true,
  includeStyles: true,
}
```

### PNG / JPEG (future)

```typescript
{
  dpi: 300,
  quality: 90,
  backgroundColor: '#ffffff',
}
```

## What Renderers Must Never Do

| Forbidden                       | Reason                       |
| ------------------------------- | ---------------------------- |
| Parse the Builder API           | Core responsibility          |
| Traverse the component tree     | Core responsibility          |
| Compute pagination or positions | Layout engine responsibility |
| Validate the report schema      | Core responsibility          |
| Import `@reportforge/core`      | Violates layer separation    |

## Error Handling

Renderers throw structured errors with context:

```typescript
interface RendererError {
  readonly renderer: string;
  readonly nodeId?: string;
  readonly message: string;
  readonly cause?: unknown;
}
```

Common failure cases: missing fonts, unsupported image formats, element overflow beyond page bounds (layout bug), and resource exhaustion on large documents.

## Relationship to Other Layers

```
ILayoutEngine.layout() → LayoutOutput
                              ↓
IRenderer.render(context) → Uint8Array
                              ↓
                         Output (file, buffer, stream)
```

Renderers depend on `@reportforge/shared` interfaces and layout output types only.
