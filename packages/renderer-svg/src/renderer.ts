import {
  DEFAULT_RENDERER_CAPABILITIES,
  StringRenderer,
  escapeHtml,
  type RenderContext,
  type RenderOperation,
  type RenderPage,
} from '@reportforge/render';

function metaString(meta: Readonly<Record<string, unknown>>, key: string): string | undefined {
  const value = meta[key];
  return typeof value === 'string' ? value : undefined;
}

function opacityAttr(opacity: number): string {
  return opacity < 1 ? ` opacity="${opacity.toFixed(3)}"` : '';
}

function transformAttr(rotation: number, cx?: number, cy?: number): string {
  if (rotation === 0) return '';
  const origin = cx !== undefined && cy !== undefined ? ` rotate(${rotation} ${cx} ${cy})` : ` rotate(${rotation})`;
  return ` transform="${origin.trim()}"`;
}

/**
 * Generates valid SVG from unified render operations.
 */
export class SvgRenderer extends StringRenderer {
  readonly name = 'reportforge-svg-renderer' as const;
  readonly mimeTypes = ['image/svg+xml'] as const;
  readonly capabilities = {
    ...DEFAULT_RENDERER_CAPABILITIES,
    supportsSVG: true,
  };

  private pageGroups: string[] = [];
  private pageBackground: string | null = null;
  private documentWidth = 595;
  private documentHeight = 842;

  override initialize(context: RenderContext): void {
    this.reset();
    this.pageBackground =
      context.options.pageBackground ??
      metaString(context.document.metadata, 'pageBackground') ??
      null;
  }

  override beginDocument(context: RenderContext): void {
    const firstPage = context.document.pages[0];
    if (firstPage !== undefined) {
      this.documentWidth = firstPage.width;
      this.documentHeight = firstPage.height;
    }

    const title = context.options.title ?? metaString(context.document.metadata, 'title') ?? 'Report';
    this.append('<?xml version="1.0" encoding="UTF-8"?>\n');
    this.append(
      `<svg xmlns="http://www.w3.org/2000/svg" ` +
        `width="${this.documentWidth}" height="${this.calculateTotalHeight(context)}" ` +
        `viewBox="0 0 ${this.documentWidth} ${this.calculateTotalHeight(context)}" ` +
        `role="img" aria-label="${escapeHtml(title)}">\n`,
    );
    this.append('<defs><style>text{font-family:Helvetica,Arial,sans-serif}</style></defs>\n');
  }

  override beginPage(page: RenderPage, _context: RenderContext): void {
    this.pageGroups = [];
    const offsetY = (page.pageNumber - 1) * (page.height + 24);
    this.pageGroups.push(
      `<g class="rf-page" data-page="${page.pageNumber.toString()}" transform="translate(0 ${offsetY})">\n`,
    );
    if (this.pageBackground !== null) {
      this.pageGroups.push(
        `<rect x="0" y="0" width="${page.width}" height="${page.height}" fill="${this.pageBackground}" />\n`,
      );
    } else {
      this.pageGroups.push(
        `<rect x="0" y="0" width="${page.width}" height="${page.height}" fill="#ffffff" stroke="#e5e7eb" />\n`,
      );
    }
  }

  override renderOperation(
    operation: RenderOperation,
    _page: RenderPage,
    context: RenderContext,
  ): void {
    switch (operation.type) {
      case 'text':
        this.renderText(operation);
        break;
      case 'rectangle':
        this.renderRectangle(operation);
        break;
      case 'line':
        this.renderLine(operation);
        break;
      case 'image':
        this.renderImage(operation);
        break;
      case 'path':
        this.renderPath(operation);
        break;
      case 'circle':
        this.renderCircle(operation);
        break;
      case 'ellipse':
        this.renderEllipse(operation);
        break;
      case 'polygon':
        this.renderPolygon(operation);
        break;
      case 'table':
        this.renderTable(operation);
        break;
      case 'group':
        this.pageGroups.push(`<g data-node="${escapeHtml(operation.sourceNodeId)}">`);
        for (const child of operation.children) {
          this.renderOperation(child, _page, context);
        }
        this.pageGroups.push('</g>\n');
        break;
      case 'transform':
        this.pageGroups.push(
          `<g data-node="${escapeHtml(operation.sourceNodeId)}" transform="translate(${operation.translateX} ${operation.translateY}) rotate(${operation.rotate}) scale(${operation.scaleX} ${operation.scaleY})">`,
        );
        for (const child of operation.children) {
          this.renderOperation(child, _page, context);
        }
        this.pageGroups.push('</g>\n');
        break;
      default:
        context.warnings.push(
          `[${operation.type}] SVG renderer does not support operation on node '${operation.sourceNodeId}'.`,
        );
    }
  }

  override endPage(_page: RenderPage, _context: RenderContext): void {
    this.pageGroups.push('</g>\n');
    this.append(this.pageGroups.join(''));
  }

  override endDocument(_context: RenderContext): Uint8Array {
    this.append('</svg>\n');
    return this.joinOutput();
  }

  private calculateTotalHeight(context: RenderContext): number {
    if (context.document.pages.length === 0) return this.documentHeight;
    const pageHeight = context.document.pages[0]?.height ?? this.documentHeight;
    return context.document.pages.length * pageHeight + (context.document.pages.length - 1) * 24;
  }

  private renderText(op: Extract<RenderOperation, { type: 'text' }>): void {
    if (op.text.length === 0) return;
    const anchor = op.textAlign === 'center' ? 'middle' : op.textAlign === 'right' ? 'end' : 'start';
    const x = op.textAlign === 'center'
      ? op.x + op.width / 2
      : op.textAlign === 'right'
        ? op.x + op.width
        : op.x;

    this.pageGroups.push(
      `<text data-node="${escapeHtml(op.sourceNodeId)}" x="${x}" y="${op.y + op.fontSize}" ` +
        `font-size="${op.fontSize}" font-weight="${op.fontWeight === 'bold' ? '700' : '400'}" ` +
        `fill="${op.color}" text-anchor="${anchor}"${opacityAttr(op.opacity)}` +
        `${transformAttr(op.rotation, x, op.y + op.fontSize)}>${escapeHtml(op.text)}</text>\n`,
    );
  }

  private renderRectangle(op: Extract<RenderOperation, { type: 'rectangle' }>): void {
    const fill = op.fillColor ?? 'none';
    const stroke = op.borderColor ?? 'none';
    const rx = op.cornerRadius > 0 ? ` rx="${op.cornerRadius}"` : '';
    this.pageGroups.push(
      `<rect data-node="${escapeHtml(op.sourceNodeId)}" x="${op.x}" y="${op.y}" ` +
        `width="${op.width}" height="${op.height}" fill="${fill}" stroke="${stroke}" ` +
        `stroke-width="${op.borderWidth}"${rx}${opacityAttr(op.opacity)} />\n`,
    );
  }

  private renderLine(op: Extract<RenderOperation, { type: 'line' }>): void {
    this.pageGroups.push(
      `<line data-node="${escapeHtml(op.sourceNodeId)}" x1="${op.x1}" y1="${op.y1}" ` +
        `x2="${op.x2}" y2="${op.y2}" stroke="${op.color}" stroke-width="${op.width}"` +
        `${opacityAttr(op.opacity)} />\n`,
    );
  }

  private renderImage(op: Extract<RenderOperation, { type: 'image' }>): void {
    this.pageGroups.push(
      `<image data-node="${escapeHtml(op.sourceNodeId)}" href="${escapeHtml(op.src)}" ` +
        `x="${op.x}" y="${op.y}" width="${op.width}" height="${op.height}" ` +
        `preserveAspectRatio="xMidYMid meet"${opacityAttr(op.opacity)}` +
        `${transformAttr(op.rotation, op.x + op.width / 2, op.y + op.height / 2)} />\n`,
    );
  }

  private renderPath(op: Extract<RenderOperation, { type: 'path' }>): void {
    this.pageGroups.push(
      `<path data-node="${escapeHtml(op.sourceNodeId)}" d="${escapeHtml(op.pathData)}" ` +
        `fill="${op.fillColor ?? 'none'}" stroke="${op.strokeColor ?? 'none'}" ` +
        `stroke-width="${op.strokeWidth}"${opacityAttr(op.opacity)} />\n`,
    );
  }

  private renderCircle(op: Extract<RenderOperation, { type: 'circle' }>): void {
    this.pageGroups.push(
      `<circle data-node="${escapeHtml(op.sourceNodeId)}" cx="${op.cx}" cy="${op.cy}" r="${op.radius}" ` +
        `fill="${op.fillColor ?? 'none'}" stroke="${op.strokeColor ?? 'none'}" ` +
        `stroke-width="${op.strokeWidth}"${opacityAttr(op.opacity)} />\n`,
    );
  }

  private renderEllipse(op: Extract<RenderOperation, { type: 'ellipse' }>): void {
    this.pageGroups.push(
      `<ellipse data-node="${escapeHtml(op.sourceNodeId)}" cx="${op.cx}" cy="${op.cy}" ` +
        `rx="${op.rx}" ry="${op.ry}" fill="${op.fillColor ?? 'none'}" ` +
        `stroke="${op.strokeColor ?? 'none'}" stroke-width="${op.strokeWidth}"` +
        `${opacityAttr(op.opacity)} />\n`,
    );
  }

  private renderPolygon(op: Extract<RenderOperation, { type: 'polygon' }>): void {
    const points = op.points.map((point) => `${point.x},${point.y}`).join(' ');
    this.pageGroups.push(
      `<polygon data-node="${escapeHtml(op.sourceNodeId)}" points="${points}" ` +
        `fill="${op.fillColor ?? 'none'}" stroke="${op.strokeColor ?? 'none'}" ` +
        `stroke-width="${op.strokeWidth}"${opacityAttr(op.opacity)} />\n`,
    );
  }

  private renderTable(op: Extract<RenderOperation, { type: 'table' }>): void {
    const columns = op.columns as readonly { key?: string; title?: string; label?: string }[];
    const rows = op.rows as readonly Record<string, unknown>[];
    const rowHeight = rows.length > 0 ? op.height / (rows.length + 1) : 24;
    const colWidth = columns.length > 0 ? op.width / columns.length : op.width;

    this.pageGroups.push(`<g data-node="${escapeHtml(op.sourceNodeId)}"${opacityAttr(op.opacity)}>\n`);
    columns.forEach((column, index) => {
      const title = column.title ?? column.label ?? column.key ?? '';
      const x = op.x + index * colWidth;
      this.pageGroups.push(
        `<rect x="${x}" y="${op.y}" width="${colWidth}" height="${rowHeight}" fill="#f9fafb" stroke="#d1d5db" />\n`,
      );
      this.pageGroups.push(
        `<text x="${x + 4}" y="${op.y + rowHeight * 0.7}" font-size="10" font-weight="700" fill="#111827">` +
          `${escapeHtml(String(title))}</text>\n`,
      );
    });

    rows.forEach((row, rowIndex) => {
      const y = op.y + rowHeight * (rowIndex + 1);
      columns.forEach((column, colIndex) => {
        const key = column.key ?? column.label ?? '';
        const x = op.x + colIndex * colWidth;
        this.pageGroups.push(
          `<rect x="${x}" y="${y}" width="${colWidth}" height="${rowHeight}" fill="#ffffff" stroke="#d1d5db" />\n`,
        );
        this.pageGroups.push(
          `<text x="${x + 4}" y="${y + rowHeight * 0.7}" font-size="10" fill="#374151">` +
            `${escapeHtml(String(row[key] ?? ''))}</text>\n`,
        );
      });
    });

    this.pageGroups.push('</g>\n');
  }
}

export { SvgRenderer as default };
