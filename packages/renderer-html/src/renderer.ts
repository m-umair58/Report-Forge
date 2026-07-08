import {
  DEFAULT_RENDERER_CAPABILITIES,
  StringRenderer,
  escapeHtml,
  ptToPx,
  type RenderContext,
  type RenderOperation,
  type RenderOptions,
  type RenderPage,
} from '@reportforge/render';

export interface HtmlRenderOptions extends RenderOptions {
  readonly includeStyles?: boolean;
  readonly standalone?: boolean;
}

function metaString(meta: Readonly<Record<string, unknown>>, key: string): string | undefined {
  const value = meta[key];
  return typeof value === 'string' ? value : undefined;
}

function cssPosition(x: number, y: number, width?: number, height?: number): string {
  const parts = [
    `left:${ptToPx(x).toFixed(2)}px`,
    `top:${ptToPx(y).toFixed(2)}px`,
  ];
  if (width !== undefined) parts.push(`width:${ptToPx(width).toFixed(2)}px`);
  if (height !== undefined) parts.push(`height:${ptToPx(height).toFixed(2)}px`);
  return parts.join(';');
}

function cssOpacity(opacity: number): string {
  return opacity < 1 ? `opacity:${opacity.toFixed(3)}` : '';
}

function cssTransform(rotation: number): string {
  return rotation !== 0 ? `transform:rotate(${rotation}deg);transform-origin:top left` : '';
}

/**
 * Generates semantic HTML from unified render operations.
 */
export class HtmlRenderer extends StringRenderer {
  readonly name = 'reportforge-html-renderer' as const;
  readonly mimeTypes = ['text/html'] as const;
  readonly capabilities = {
    ...DEFAULT_RENDERER_CAPABILITIES,
    supportsSVG: true,
  };

  private currentPageParts: string[] = [];
  private pageBackground: string | null = null;

  override initialize(context: RenderContext): void {
    this.reset();
    this.pageBackground =
      context.options.pageBackground ??
      metaString(context.document.metadata, 'pageBackground') ??
      null;
  }

  override beginDocument(context: RenderContext): void {
    const lang = context.options.lang ?? 'en';
    const title = context.options.title ?? metaString(context.document.metadata, 'title') ?? 'Report';

    if (context.options.standalone !== false) {
      this.append('<!DOCTYPE html>\n');
      this.append(`<html lang="${escapeHtml(lang)}">\n<head>\n`);
      this.append('<meta charset="utf-8">\n');
      this.append(`<title>${escapeHtml(title)}</title>\n`);
      if (context.options.includeStyles !== false) {
        this.append('<style>\n');
        this.append(this.buildGlobalStyles());
        this.append('</style>\n');
      }
      this.append('</head>\n<body>\n');
      this.append('<main class="rf-document" role="document">\n');
    }
  }

  override beginPage(page: RenderPage, _context: RenderContext): void {
    this.currentPageParts = [];
    const style = [
      `width:${ptToPx(page.width).toFixed(2)}px`,
      `height:${ptToPx(page.height).toFixed(2)}px`,
      'position:relative',
      'margin:24px auto',
      'background:#ffffff',
      'box-shadow:0 2px 8px rgba(0,0,0,0.08)',
      'overflow:hidden',
    ];
    if (this.pageBackground !== null) {
      style.push(`background:${this.pageBackground}`);
    }
    this.currentPageParts.push(
      `<section class="rf-page" data-page="${page.pageNumber.toString()}" ` +
        `style="${style.join(';')}" aria-label="Page ${page.pageNumber.toString()}">\n`,
    );
  }

  override renderOperation(
    operation: RenderOperation,
    page: RenderPage,
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
      case 'circle':
      case 'ellipse':
      case 'polygon':
        this.renderSvgShape(operation, page);
        break;
      case 'table':
        this.renderTable(operation);
        break;
      case 'group':
        for (const child of operation.children) {
          this.renderOperation(child, page, context);
        }
        break;
      default:
        context.warnings.push(
          `[${operation.type}] HTML renderer does not support operation on node '${operation.sourceNodeId}'.`,
        );
    }
  }

  override endPage(_page: RenderPage, _context: RenderContext): void {
    this.currentPageParts.push('</section>\n');
    this.append(this.currentPageParts.join(''));
  }

  override endDocument(context: RenderContext): Uint8Array {
    if (context.options.standalone !== false) {
      this.append('</main>\n</body>\n</html>\n');
    }
    return this.joinOutput();
  }

  private buildGlobalStyles(): string {
    return [
      '*,*::before,*::after{box-sizing:border-box}',
      'body{margin:0;padding:16px;background:#f3f4f6;font-family:Helvetica,Arial,sans-serif;color:#111827}',
      '.rf-document{display:flex;flex-direction:column;gap:24px}',
      '.rf-text{position:absolute;margin:0;white-space:pre-wrap;word-wrap:break-word}',
      '.rf-rect,.rf-image,.rf-line,.rf-table,.rf-svg{position:absolute}',
      '.rf-table{border-collapse:collapse;font-size:12px}',
      '.rf-table th,.rf-table td{border:1px solid #d1d5db;padding:4px 8px}',
      '.rf-table th{background:#f9fafb;font-weight:600}',
    ].join('\n');
  }

  private renderText(op: Extract<RenderOperation, { type: 'text' }>): void {
    if (op.text.length === 0) return;
    const styles = [
      cssPosition(op.x, op.y, op.width, op.height),
      `font-family:${escapeHtml(op.font)},Helvetica,Arial,sans-serif`,
      `font-size:${ptToPx(op.fontSize).toFixed(2)}px`,
      `font-weight:${op.fontWeight === 'bold' ? '700' : '400'}`,
      `line-height:${op.lineHeight.toFixed(2)}`,
      `color:${op.color}`,
      `text-align:${op.textAlign}`,
      cssOpacity(op.opacity),
      cssTransform(op.rotation),
    ].filter((value) => value.length > 0);

    this.currentPageParts.push(
      `<p class="rf-text" data-node="${escapeHtml(op.sourceNodeId)}" style="${styles.join(';')}">` +
        `${escapeHtml(op.text)}</p>\n`,
    );
  }

  private renderRectangle(op: Extract<RenderOperation, { type: 'rectangle' }>): void {
    const styles = [
      cssPosition(op.x, op.y, op.width, op.height),
      op.fillColor !== null ? `background:${op.fillColor}` : '',
      op.borderColor !== null ? `border:${ptToPx(op.borderWidth).toFixed(2)}px solid ${op.borderColor}` : '',
      op.cornerRadius > 0 ? `border-radius:${ptToPx(op.cornerRadius).toFixed(2)}px` : '',
      cssOpacity(op.opacity),
    ].filter((value) => value.length > 0);

    this.currentPageParts.push(
      `<div class="rf-rect" data-node="${escapeHtml(op.sourceNodeId)}" style="${styles.join(';')}"></div>\n`,
    );
  }

  private renderLine(op: Extract<RenderOperation, { type: 'line' }>): void {
    const left = Math.min(op.x1, op.x2);
    const top = Math.min(op.y1, op.y2);
    const width = Math.max(Math.abs(op.x2 - op.x1), ptToPx(op.width));
    const height = Math.max(Math.abs(op.y2 - op.y1), ptToPx(op.width));
    const styles = [
      cssPosition(left, top, width, height),
      `border-top:${ptToPx(op.width).toFixed(2)}px solid ${op.color}`,
      cssOpacity(op.opacity),
    ].filter((value) => value.length > 0);

    this.currentPageParts.push(
      `<div class="rf-line" data-node="${escapeHtml(op.sourceNodeId)}" style="${styles.join(';')}"></div>\n`,
    );
  }

  private renderImage(op: Extract<RenderOperation, { type: 'image' }>): void {
    const styles = [
      cssPosition(op.x, op.y, op.width, op.height),
      'object-fit:contain',
      cssOpacity(op.opacity),
      cssTransform(op.rotation),
    ].filter((value) => value.length > 0);

    this.currentPageParts.push(
      `<img class="rf-image" data-node="${escapeHtml(op.sourceNodeId)}" ` +
        `src="${escapeHtml(op.src)}" alt="${escapeHtml(op.alt)}" style="${styles.join(';')}" />\n`,
    );
  }

  private renderSvgShape(operation: RenderOperation, page: RenderPage): void {
    const width = ptToPx(page.width).toFixed(2);
    const height = ptToPx(page.height).toFixed(2);
    let inner = '';

    if (operation.type === 'path') {
      inner = `<path d="${escapeHtml(operation.pathData)}" fill="${operation.fillColor ?? 'none'}" ` +
        `stroke="${operation.strokeColor ?? 'none'}" stroke-width="${operation.strokeWidth}" />`;
    } else if (operation.type === 'circle') {
      inner = `<circle cx="${operation.cx}" cy="${operation.cy}" r="${operation.radius}" ` +
        `fill="${operation.fillColor ?? 'none'}" stroke="${operation.strokeColor ?? 'none'}" ` +
        `stroke-width="${operation.strokeWidth}" />`;
    } else if (operation.type === 'ellipse') {
      inner = `<ellipse cx="${operation.cx}" cy="${operation.cy}" rx="${operation.rx}" ry="${operation.ry}" ` +
        `fill="${operation.fillColor ?? 'none'}" stroke="${operation.strokeColor ?? 'none'}" ` +
        `stroke-width="${operation.strokeWidth}" />`;
    } else if (operation.type === 'polygon') {
      const points = operation.points.map((point) => `${point.x},${point.y}`).join(' ');
      inner = `<polygon points="${points}" fill="${operation.fillColor ?? 'none'}" ` +
        `stroke="${operation.strokeColor ?? 'none'}" stroke-width="${operation.strokeWidth}" />`;
    }

    this.currentPageParts.push(
      `<svg class="rf-svg" data-node="${escapeHtml(operation.sourceNodeId)}" ` +
        `viewBox="0 0 ${page.width} ${page.height}" width="${width}px" height="${height}px" ` +
        `style="position:absolute;left:0;top:0;pointer-events:none">${inner}</svg>\n`,
    );
  }

  private renderTable(op: Extract<RenderOperation, { type: 'table' }>): void {
    const styles = [
      cssPosition(op.x, op.y, op.width, op.height),
      cssOpacity(op.opacity),
    ].filter((value) => value.length > 0);

    const columns = op.columns as readonly { key?: string; title?: string; label?: string }[];
    const rows = op.rows as readonly Record<string, unknown>[];

    let table = `<table class="rf-table" data-node="${escapeHtml(op.sourceNodeId)}" style="${styles.join(';')}"><thead><tr>`;
    for (const column of columns) {
      const title = column.title ?? column.label ?? column.key ?? '';
      table += `<th>${escapeHtml(String(title))}</th>`;
    }
    table += '</tr></thead><tbody>';
    for (const row of rows) {
      table += '<tr>';
      for (const column of columns) {
        const key = column.key ?? column.label ?? '';
        table += `<td>${escapeHtml(String(row[key] ?? ''))}</td>`;
      }
      table += '</tr>';
    }
    table += '</tbody></table>\n';
    this.currentPageParts.push(table);
  }
}

export { HtmlRenderer as default };
