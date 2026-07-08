import type {
  ReportMetadata,
  ReportSchema,
  RenderOptions,
  ValidationResult,
} from '@reportforge/shared';

import type { ComponentDescriptor } from '@reportforge/components';
import { COMPONENT_TYPES } from '@reportforge/components';
import type {
  BarcodeProps,
  ChartProps,
  ImageProps,
  QRCodeProps,
  SummaryCardProps,
  TableProps,
} from './components.js';
import { createDefaultRegistry } from './components.js';
import type { InternalNode } from './node.js';
import { createNode } from './node.js';
import type { ComponentRegistry } from './registry.js';
import { applyDescriptor } from './apply-descriptor.js';
import { deserialize, serialize } from './serializer.js';
import { createIdGenerator } from './utils.js';
import { createDefaultValidationFramework } from './validator.js';

// ─── Shared builder helper ───────────────────────────────────────────────────

/**
 * Appends a new leaf node as a child of `contextNode`.
 * Used by all builder classes to reduce duplication.
 *
 * Props are accepted as `object` to allow typed prop interfaces without
 * requiring them to carry a `[key: string]: unknown` index signature.
 * They are spread into a plain `Record<string, unknown>` internally.
 */
function addNode(
  contextNode: InternalNode,
  idGenerator: (type: string) => string,
  type: string,
  props: object,
): InternalNode {
  const plainProps: Record<string, unknown> = { ...props };
  const node = createNode(idGenerator(type), type, plainProps, contextNode);
  contextNode.children.push(node);
  return node;
}

// ─── HeaderBuilder ──────────────────────────────────────────────────────────

/**
 * Scoped builder for the Header component.
 * Only components allowed inside a header are available as methods.
 *
 * Received as the argument in: `.header(h => { h.title('...') })`
 */
export class HeaderBuilder {
  /** @internal */
  constructor(
    private readonly node: InternalNode,
    private readonly idGen: (type: string) => string,
  ) {}

  /**
   * Adds a Title to the header.
   * @param text - The title text.
   */
  title(text: string): this {
    addNode(this.node, this.idGen, COMPONENT_TYPES.TITLE, { text });
    return this;
  }

  /**
   * Adds a Paragraph to the header.
   * @param text - The paragraph text.
   */
  paragraph(text: string): this {
    addNode(this.node, this.idGen, COMPONENT_TYPES.PARAGRAPH, { text });
    return this;
  }

  /**
   * Adds an Image to the header.
   * @param props - Image source and optional metadata.
   */
  image(props: ImageProps): this {
    addNode(this.node, this.idGen, COMPONENT_TYPES.IMAGE, props);
    return this;
  }
}

// ─── FooterBuilder ──────────────────────────────────────────────────────────

/**
 * Scoped builder for the Footer component.
 * Only components allowed inside a footer are available as methods.
 *
 * Received as the argument in: `.footer(f => { f.paragraph('...') })`
 */
export class FooterBuilder {
  /** @internal */
  constructor(
    private readonly node: InternalNode,
    private readonly idGen: (type: string) => string,
  ) {}

  /**
   * Adds a Paragraph to the footer.
   * @param text - The paragraph text.
   */
  paragraph(text: string): this {
    addNode(this.node, this.idGen, COMPONENT_TYPES.PARAGRAPH, { text });
    return this;
  }

  /**
   * Adds an Image to the footer.
   * @param props - Image source and optional metadata.
   */
  image(props: ImageProps): this {
    addNode(this.node, this.idGen, COMPONENT_TYPES.IMAGE, props);
    return this;
  }
}

// ─── SectionBuilder ──────────────────────────────────────────────────────────

/**
 * Scoped builder for a Section component.
 * All content components are available, plus nested sections.
 *
 * Received as the argument in: `.section(s => { s.title('...') })`
 *
 * @example
 * report.section(s => {
 *   s.title('Q1 Results')
 *    .paragraph('Revenue grew 12%.')
 *    .table({ columns, rows });
 * });
 */
export class SectionBuilder {
  /** @internal */
  constructor(
    private readonly node: InternalNode,
    private readonly idGen: (type: string) => string,
    private readonly registry: ComponentRegistry,
  ) {}

  /** Adds a Title to this section. */
  title(text: string): this {
    addNode(this.node, this.idGen, COMPONENT_TYPES.TITLE, { text });
    return this;
  }

  /** Adds a Subtitle to this section. */
  subtitle(text: string): this {
    addNode(this.node, this.idGen, COMPONENT_TYPES.SUBTITLE, { text });
    return this;
  }

  /** Adds a Paragraph to this section. */
  paragraph(text: string): this {
    addNode(this.node, this.idGen, COMPONENT_TYPES.PARAGRAPH, { text });
    return this;
  }

  /** Adds a Divider to this section. */
  divider(): this {
    addNode(this.node, this.idGen, COMPONENT_TYPES.DIVIDER, {});
    return this;
  }

  /** Adds a Table to this section. */
  table(props: TableProps): this {
    addNode(this.node, this.idGen, COMPONENT_TYPES.TABLE, props);
    return this;
  }

  /** Adds an Image to this section. */
  image(props: ImageProps): this {
    addNode(this.node, this.idGen, COMPONENT_TYPES.IMAGE, props);
    return this;
  }

  /** Adds a Chart to this section. */
  chart(props: ChartProps): this {
    addNode(this.node, this.idGen, COMPONENT_TYPES.CHART, props);
    return this;
  }

  /** Adds a SummaryCard to this section. */
  summaryCard(props: SummaryCardProps): this {
    addNode(this.node, this.idGen, COMPONENT_TYPES.SUMMARY_CARD, props);
    return this;
  }

  /** Adds a QRCode to this section. */
  qrCode(props: QRCodeProps): this {
    addNode(this.node, this.idGen, COMPONENT_TYPES.QR_CODE, props);
    return this;
  }

  /** Adds a Barcode to this section. */
  barcode(props: BarcodeProps): this {
    addNode(this.node, this.idGen, COMPONENT_TYPES.BARCODE, props);
    return this;
  }

  /**
   * Adds a component from the official component library.
   *
   * @example
   * section.add(Components.MetricCard({ label: 'Users', value: '12,400' }));
   */
  add(descriptor: ComponentDescriptor): this {
    applyDescriptor(this.node, this.idGen, descriptor, this.registry, COMPONENT_TYPES.SECTION);
    return this;
  }

  /**
   * Adds a nested Section with an optional label.
   *
   * @param labelOrCallback - A label string or the section callback.
   * @param callback - The section callback (required when label is given).
   *
   * @example
   * section.section('Sub-details', sub => {
   *   sub.paragraph('Nested content.');
   * });
   */
  section(callback: (builder: SectionBuilder) => void): this;
  section(label: string, callback: (builder: SectionBuilder) => void): this;
  section(
    labelOrCallback: string | ((builder: SectionBuilder) => void),
    maybeCallback?: (builder: SectionBuilder) => void,
  ): this {
    const { label, callback } = resolveSection(labelOrCallback, maybeCallback);
    const sectionNode = addNode(
      this.node,
      this.idGen,
      COMPONENT_TYPES.SECTION,
      label !== undefined ? { label } : {},
    );
    const nested = new SectionBuilder(sectionNode, this.idGen, this.registry);
    callback(nested);
    return this;
  }
}

// ─── ReportBuilder ───────────────────────────────────────────────────────────

/** Options for constructing a new report. */
export interface ReportCreateOptions {
  /** Report-level metadata (title, author, etc.). */
  readonly metadata?: ReportMetadata;
  /** Global theme (object or registered theme name). */
  readonly theme?: import('@reportforge/theme').ThemeInput;
}

/**
 * Fluent builder for constructing a report.
 * Created via `Report.create()` — do not instantiate directly.
 *
 * Every content method returns `this` for chaining.
 * Container methods (`section`, `header`, `footer`) use a callback to scope their content.
 *
 * @example
 * const report = Report.create({ metadata: { title: 'Monthly Sales' } });
 * report
 *   .title('Monthly Sales')
 *   .paragraph('Summary')
 *   .section(s => {
 *     s.title('Details').table({ columns, rows });
 *   })
 *   .divider();
 *
 * const json = report.toJSON();
 */
export class ReportBuilder {
  private readonly rootNode: InternalNode;
  private readonly idGen: (type: string) => string;
  private readonly registry: ComponentRegistry;
  private readonly metadata: ReportMetadata;
  private readonly theme?: import('@reportforge/theme').ThemeInput;

  /** @internal — use `Report.create()` or `Report.fromJSON()` */
  constructor(
    rootNode: InternalNode,
    metadata: ReportMetadata,
    registry: ComponentRegistry,
    idGen: (type: string) => string,
    theme?: import('@reportforge/theme').ThemeInput,
  ) {
    this.rootNode = rootNode;
    this.metadata = metadata;
    this.registry = registry;
    this.idGen = idGen;
    if (theme !== undefined) {
      this.theme = theme;
    }
  }

  /** Returns the configured theme input, if any. */
  getTheme(): import('@reportforge/theme').ThemeInput | undefined {
    return this.theme ?? this.metadata.theme;
  }

  // ─── Content methods ───────────────────────────────────────────────────────

  /** Adds a Title to the report. */
  title(text: string): this {
    addNode(this.rootNode, this.idGen, COMPONENT_TYPES.TITLE, { text });
    return this;
  }

  /** Adds a Subtitle to the report. */
  subtitle(text: string): this {
    addNode(this.rootNode, this.idGen, COMPONENT_TYPES.SUBTITLE, { text });
    return this;
  }

  /** Adds a Paragraph to the report. */
  paragraph(text: string): this {
    addNode(this.rootNode, this.idGen, COMPONENT_TYPES.PARAGRAPH, { text });
    return this;
  }

  /** Adds a Divider to the report. */
  divider(): this {
    addNode(this.rootNode, this.idGen, COMPONENT_TYPES.DIVIDER, {});
    return this;
  }

  /** Adds a Table to the report. */
  table(props: TableProps): this {
    addNode(this.rootNode, this.idGen, COMPONENT_TYPES.TABLE, props);
    return this;
  }

  /** Adds an Image to the report. */
  image(props: ImageProps): this {
    addNode(this.rootNode, this.idGen, COMPONENT_TYPES.IMAGE, props);
    return this;
  }

  /** Adds a Chart to the report. */
  chart(props: ChartProps): this {
    addNode(this.rootNode, this.idGen, COMPONENT_TYPES.CHART, props);
    return this;
  }

  /** Adds a SummaryCard to the report. */
  summaryCard(props: SummaryCardProps): this {
    addNode(this.rootNode, this.idGen, COMPONENT_TYPES.SUMMARY_CARD, props);
    return this;
  }

  /** Adds a QRCode to the report. */
  qrCode(props: QRCodeProps): this {
    addNode(this.rootNode, this.idGen, COMPONENT_TYPES.QR_CODE, props);
    return this;
  }

  /** Adds a Barcode to the report. */
  barcode(props: BarcodeProps): this {
    addNode(this.rootNode, this.idGen, COMPONENT_TYPES.BARCODE, props);
    return this;
  }

  /**
   * Adds a component from the official component library.
   *
   * @example
   * report
   *   .add(Components.Title({ text: 'Monthly Sales' }))
   *   .add(Components.Paragraph({ text: 'Summary...' }))
   *   .add(Components.Divider())
   *   .add(Components.SummaryCard({ title: 'Revenue', value: '$1.2M' }));
   */
  add(descriptor: ComponentDescriptor): this {
    applyDescriptor(this.rootNode, this.idGen, descriptor, this.registry, COMPONENT_TYPES.REPORT);
    return this;
  }

  // ─── Container methods ─────────────────────────────────────────────────────

  /**
   * Adds a Header. The callback receives a `HeaderBuilder` scoped to the header.
   *
   * @example
   * report.header(h => h.title('Acme Corp').image({ src: './logo.png' }));
   */
  header(callback: (builder: HeaderBuilder) => void): this {
    const headerNode = addNode(this.rootNode, this.idGen, COMPONENT_TYPES.HEADER, {});
    callback(new HeaderBuilder(headerNode, this.idGen));
    return this;
  }

  /**
   * Adds a Footer. The callback receives a `FooterBuilder` scoped to the footer.
   *
   * @example
   * report.footer(f => f.paragraph('Page {pageNumber} of {totalPages}'));
   */
  footer(callback: (builder: FooterBuilder) => void): this {
    const footerNode = addNode(this.rootNode, this.idGen, COMPONENT_TYPES.FOOTER, {});
    callback(new FooterBuilder(footerNode, this.idGen));
    return this;
  }

  /**
   * Adds a Section. The callback receives a `SectionBuilder` scoped to the section.
   *
   * @example
   * report.section(s => {
   *   s.title('Details').paragraph('Content here.');
   * });
   *
   * report.section('Sales', s => {
   *   s.table({ columns, rows });
   * });
   */
  section(callback: (builder: SectionBuilder) => void): this;
  section(label: string, callback: (builder: SectionBuilder) => void): this;
  section(
    labelOrCallback: string | ((builder: SectionBuilder) => void),
    maybeCallback?: (builder: SectionBuilder) => void,
  ): this {
    const { label, callback } = resolveSection(labelOrCallback, maybeCallback);
    const sectionNode = addNode(
      this.rootNode,
      this.idGen,
      COMPONENT_TYPES.SECTION,
      label !== undefined ? { label } : {},
    );
    const nested = new SectionBuilder(sectionNode, this.idGen, this.registry);
    callback(nested);
    return this;
  }

  // ─── Serialization ─────────────────────────────────────────────────────────

  /**
   * Serializes the report to a portable JSON schema (intermediate representation).
   * The result can be stored, transmitted, and later restored via `Report.fromJSON()`.
   *
   * Calling `toJSON()` does not modify the builder — further content can be added after.
   */
  toSchema(): ReportSchema {
    return serialize(this.rootNode, this.metadata);
  }

  /**
   * Alias for `toSchema()`. Returns the same portable JSON schema.
   * Named `toJSON` so `JSON.stringify(report)` works naturally.
   */
  toJSON(): ReportSchema {
    return this.toSchema();
  }

  // ─── Validation ─────────────────────────────────────────────────────────────

  /**
   * Validates the report schema without rendering.
   * Returns a `ValidationResult` with `valid: true` or a list of structured errors.
   *
   * @example
   * const { valid, errors } = report.validate();
   * if (!valid) {
   *   errors.forEach(e => console.error(e.message));
   * }
   */
  validate(): ValidationResult {
    const schema = this.toSchema();
    const framework = createDefaultValidationFramework();
    return framework.validate(schema, this.registry);
  }

  /**
   * Renders the report to a PDF file.
   *
   * Runs the complete pipeline:
   * Builder → Validation → Layout Engine → Display List → PDF Renderer → file
   *
   * @param outputPath - Destination file path (e.g. `'hello.pdf'`).
   *
   * @example
   * const report = Report.create()
   *   .title('Hello ReportForge')
   *   .paragraph('This is our first PDF.')
   *   .divider();
   *
   * await report.toPDF('hello.pdf');
   */
  async toPDF(outputPath: string): Promise<void> {
    const { renderReportToPdf } = await import('./render-pdf.js');
    await renderReportToPdf(this, outputPath);
  }

  /**
   * Renders the report and returns PDF bytes.
   *
   * @param options - Render options. Only `format: 'pdf'` is supported.
   *                  Pass `output` to also write the file.
   *
   * @example
   * const bytes = await report.render({ format: 'pdf' });
   */
  async render(options: RenderOptions): Promise<Uint8Array> {
    const { renderReport } = await import('./render-pdf.js');
    return renderReport(this, options);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Normalises the overloaded `section()` arguments into a label + callback pair. */
function resolveSection(
  labelOrCallback: string | ((builder: SectionBuilder) => void),
  maybeCallback: ((builder: SectionBuilder) => void) | undefined,
): { label: string | undefined; callback: (builder: SectionBuilder) => void } {
  if (typeof labelOrCallback === 'function') {
    return { label: undefined, callback: labelOrCallback };
  }
  if (maybeCallback === undefined) {
    throw new Error('section() requires a callback when a label is provided.');
  }
  return { label: labelOrCallback, callback: maybeCallback };
}

// ─── Builder factory helpers ──────────────────────────────────────────────────

/**
 * Creates a fresh `ReportBuilder` with an empty report node.
 * Used internally by `Report.create()`.
 */
export function createReportBuilder(options?: ReportCreateOptions): ReportBuilder {
  const idGen = createIdGenerator();
  const registry = createDefaultRegistry();
  const metadata: ReportMetadata = options?.metadata ?? {};
  const rootNode = createNode(idGen(COMPONENT_TYPES.REPORT), COMPONENT_TYPES.REPORT, {}, null);
  return new ReportBuilder(rootNode, metadata, registry, idGen, options?.theme);
}

/**
 * Reconstructs a `ReportBuilder` from a serialized `ReportSchema`.
 * Used internally by `Report.fromJSON()`.
 *
 * @throws {DeserializationError} If `input` is not a valid schema.
 */
export function createReportBuilderFromSchema(input: unknown): ReportBuilder {
  const { rootNode, metadata } = deserialize(input);
  const registry = createDefaultRegistry();
  // Use a fresh ID generator that starts at a high offset to avoid
  // colliding with IDs already present in the deserialized tree.
  const idGen = createIdGenerator();
  return new ReportBuilder(rootNode, metadata, registry, idGen);
}
