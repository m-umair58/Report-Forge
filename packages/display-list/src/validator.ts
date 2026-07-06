import type {
  DisplayCommand,
  DrawBarcodeCommand,
  DrawCircleCommand,
  DrawEllipseCommand,
  DrawImageCommand,
  DrawLineCommand,
  DrawPolygonCommand,
  DrawQRCodeCommand,
  DrawRectangleCommand,
  DrawTableCommand,
  DrawTextCommand,
} from './commands.js';
import type {
  DisplayList,
  DisplayListValidationIssue,
  DisplayListValidationResult,
} from './types.js';

// ─── Color validation ─────────────────────────────────────────────────────────

/** Matches `#RGB`, `#RRGGBB`, or `#RRGGBBAA`. */
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** Matches `rgb(...)` or `rgba(...)`. */
const RGB_COLOR_RE = /^rgba?\s*\(/;

/**
 * Returns true if the value is a valid non-null CSS color string.
 * Accepted formats: hex (`#RGB`, `#RRGGBB`, `#RRGGBBAA`), `rgb()`, `rgba()`, `transparent`.
 */
export function isValidColor(color: string): boolean {
  return HEX_COLOR_RE.test(color) || RGB_COLOR_RE.test(color) || color === 'transparent';
}

// ─── Issue builders ───────────────────────────────────────────────────────────

function issue(
  nodeId: string,
  commandKind: string,
  severity: DisplayListValidationIssue['severity'],
  message: string,
): DisplayListValidationIssue {
  return { nodeId, commandKind, severity, message };
}

function error(nodeId: string, commandKind: string, message: string): DisplayListValidationIssue {
  return issue(nodeId, commandKind, 'error', message);
}

function warning(nodeId: string, commandKind: string, message: string): DisplayListValidationIssue {
  return issue(nodeId, commandKind, 'warning', message);
}

// ─── Per-command validators ───────────────────────────────────────────────────

function validateColor(
  nodeId: string,
  commandKind: string,
  field: string,
  color: string | null,
  issues: DisplayListValidationIssue[],
): void {
  if (color !== null && !isValidColor(color)) {
    issues.push(
      error(
        nodeId,
        commandKind,
        `Invalid color for '${field}': '${color}'. Expected hex, rgb(), rgba(), or 'transparent'.`,
      ),
    );
  }
}

function validatePositiveSize(
  nodeId: string,
  commandKind: string,
  field: string,
  value: number,
  issues: DisplayListValidationIssue[],
): void {
  if (value < 0) {
    issues.push(
      error(nodeId, commandKind, `Negative ${field}: ${value.toFixed(2)}pt. Sizes must be ≥ 0.`),
    );
  }
}

function validateOpacity(
  nodeId: string,
  commandKind: string,
  opacity: number,
  issues: DisplayListValidationIssue[],
): void {
  if (opacity < 0 || opacity > 1) {
    issues.push(error(nodeId, commandKind, `Opacity ${opacity} is out of range [0, 1].`));
  }
  if (opacity === 0) {
    issues.push(
      warning(
        nodeId,
        commandKind,
        'Command has opacity 0 — it will be invisible. Consider removing it.',
      ),
    );
  }
}

function validateDrawText(cmd: DrawTextCommand, issues: DisplayListValidationIssue[]): void {
  const k = cmd.kind;
  const id = cmd.sourceNodeId;

  validatePositiveSize(id, k, 'width', cmd.width, issues);
  validatePositiveSize(id, k, 'height', cmd.height, issues);
  validatePositiveSize(id, k, 'fontSize', cmd.fontSize, issues);
  validateColor(id, k, 'color', cmd.color, issues);
  validateOpacity(id, k, cmd.opacity, issues);

  if (cmd.lineHeight <= 0) {
    issues.push(error(id, k, `lineHeight must be > 0 (got ${cmd.lineHeight}).`));
  }
  if (cmd.text.length === 0) {
    issues.push(warning(id, k, 'DrawText command has empty text content.'));
  }
}

function validateDrawRectangle(
  cmd: DrawRectangleCommand,
  issues: DisplayListValidationIssue[],
): void {
  const k = cmd.kind;
  const id = cmd.sourceNodeId;

  validatePositiveSize(id, k, 'width', cmd.width, issues);
  validatePositiveSize(id, k, 'height', cmd.height, issues);
  validateColor(id, k, 'fillColor', cmd.fillColor, issues);
  validateColor(id, k, 'borderColor', cmd.borderColor, issues);
  validatePositiveSize(id, k, 'borderWidth', cmd.borderWidth, issues);
  validatePositiveSize(id, k, 'cornerRadius', cmd.cornerRadius, issues);
  validateOpacity(id, k, cmd.opacity, issues);

  if (cmd.fillColor === null && cmd.borderColor === null) {
    issues.push(
      warning(
        id,
        k,
        'DrawRectangle has no fill and no border — it will produce no visible output.',
      ),
    );
  }
}

function validateDrawLine(cmd: DrawLineCommand, issues: DisplayListValidationIssue[]): void {
  const k = cmd.kind;
  const id = cmd.sourceNodeId;

  validateColor(id, k, 'color', cmd.color, issues);
  validatePositiveSize(id, k, 'width', cmd.width, issues);
  validateOpacity(id, k, cmd.opacity, issues);

  if (cmd.x1 === cmd.x2 && cmd.y1 === cmd.y2) {
    issues.push(
      warning(
        id,
        k,
        'DrawLine has identical start and end points — it will produce no visible output.',
      ),
    );
  }
}

function validateDrawImage(cmd: DrawImageCommand, issues: DisplayListValidationIssue[]): void {
  const k = cmd.kind;
  const id = cmd.sourceNodeId;

  validatePositiveSize(id, k, 'width', cmd.width, issues);
  validatePositiveSize(id, k, 'height', cmd.height, issues);
  validateOpacity(id, k, cmd.opacity, issues);

  if (cmd.src.length === 0) {
    issues.push(error(id, k, 'DrawImage has an empty src.'));
  }
}

function validateDrawCircle(cmd: DrawCircleCommand, issues: DisplayListValidationIssue[]): void {
  const k = cmd.kind;
  const id = cmd.sourceNodeId;

  validatePositiveSize(id, k, 'radius', cmd.radius, issues);
  validateColor(id, k, 'fillColor', cmd.fillColor, issues);
  validateColor(id, k, 'strokeColor', cmd.strokeColor, issues);
  validatePositiveSize(id, k, 'strokeWidth', cmd.strokeWidth, issues);
  validateOpacity(id, k, cmd.opacity, issues);
}

function validateDrawEllipse(cmd: DrawEllipseCommand, issues: DisplayListValidationIssue[]): void {
  const k = cmd.kind;
  const id = cmd.sourceNodeId;

  validatePositiveSize(id, k, 'rx', cmd.rx, issues);
  validatePositiveSize(id, k, 'ry', cmd.ry, issues);
  validateColor(id, k, 'fillColor', cmd.fillColor, issues);
  validateColor(id, k, 'strokeColor', cmd.strokeColor, issues);
  validatePositiveSize(id, k, 'strokeWidth', cmd.strokeWidth, issues);
  validateOpacity(id, k, cmd.opacity, issues);
}

function validateDrawPolygon(cmd: DrawPolygonCommand, issues: DisplayListValidationIssue[]): void {
  const k = cmd.kind;
  const id = cmd.sourceNodeId;

  validateColor(id, k, 'fillColor', cmd.fillColor, issues);
  validateColor(id, k, 'strokeColor', cmd.strokeColor, issues);
  validatePositiveSize(id, k, 'strokeWidth', cmd.strokeWidth, issues);
  validateOpacity(id, k, cmd.opacity, issues);

  if (cmd.points.length < 3) {
    issues.push(error(id, k, `DrawPolygon requires at least 3 points (got ${cmd.points.length}).`));
  }
}

function validateDrawQRCode(cmd: DrawQRCodeCommand, issues: DisplayListValidationIssue[]): void {
  const k = cmd.kind;
  const id = cmd.sourceNodeId;

  validatePositiveSize(id, k, 'width', cmd.width, issues);
  validatePositiveSize(id, k, 'height', cmd.height, issues);
  validateOpacity(id, k, cmd.opacity, issues);

  if (cmd.value.length === 0) {
    issues.push(error(id, k, 'DrawQRCode has an empty value.'));
  }
}

function validateDrawBarcode(cmd: DrawBarcodeCommand, issues: DisplayListValidationIssue[]): void {
  const k = cmd.kind;
  const id = cmd.sourceNodeId;

  validatePositiveSize(id, k, 'width', cmd.width, issues);
  validatePositiveSize(id, k, 'height', cmd.height, issues);
  validateOpacity(id, k, cmd.opacity, issues);

  if (cmd.value.length === 0) {
    issues.push(error(id, k, 'DrawBarcode has an empty value.'));
  }
  if (cmd.format.length === 0) {
    issues.push(error(id, k, 'DrawBarcode has an empty format.'));
  }
}

function validateDrawTable(cmd: DrawTableCommand, issues: DisplayListValidationIssue[]): void {
  const k = cmd.kind;
  const id = cmd.sourceNodeId;

  validatePositiveSize(id, k, 'width', cmd.width, issues);
  validatePositiveSize(id, k, 'height', cmd.height, issues);
  validateOpacity(id, k, cmd.opacity, issues);
}

// ─── Main validator ────────────────────────────────────────────────────────────

/**
 * Validates a single display command.
 * Returns an array of validation issues (may be empty if the command is valid).
 */
export function validateCommand(command: DisplayCommand): readonly DisplayListValidationIssue[] {
  const issues: DisplayListValidationIssue[] = [];

  switch (command.kind) {
    case 'draw-text':
      validateDrawText(command, issues);
      break;
    case 'draw-rectangle':
      validateDrawRectangle(command, issues);
      break;
    case 'draw-line':
      validateDrawLine(command, issues);
      break;
    case 'draw-image':
      validateDrawImage(command, issues);
      break;
    case 'draw-circle':
      validateDrawCircle(command, issues);
      break;
    case 'draw-ellipse':
      validateDrawEllipse(command, issues);
      break;
    case 'draw-polygon':
      validateDrawPolygon(command, issues);
      break;
    case 'draw-qr-code':
      validateDrawQRCode(command, issues);
      break;
    case 'draw-barcode':
      validateDrawBarcode(command, issues);
      break;
    case 'draw-table':
      validateDrawTable(command, issues);
      break;
    case 'draw-path':
      // DrawPath validation: minimal checks
      if (command.pathData.length === 0) {
        issues.push(
          error(command.sourceNodeId, command.kind, 'DrawPath has an empty pathData string.'),
        );
      }
      validateOpacity(command.sourceNodeId, command.kind, command.opacity, issues);
      break;
  }

  return issues;
}

/**
 * Validates all commands in a complete Display List.
 *
 * Checks each command for:
 * - Negative width/height
 * - Invalid color strings
 * - Out-of-range opacity
 * - Empty required string fields (src, value, text)
 * - Structural issues (empty polygon, degenerate line)
 *
 * @returns A validation result containing all found issues.
 *
 * @example
 * const result = validateDisplayList(displayList);
 * if (!result.valid) {
 *   for (const issue of result.issues) {
 *     console.error(`[${issue.severity}] ${issue.message}`);
 *   }
 * }
 */
export function validateDisplayList(displayList: DisplayList): DisplayListValidationResult {
  const issues: DisplayListValidationIssue[] = [];

  for (const page of displayList.pages) {
    for (const command of page.commands) {
      issues.push(...validateCommand(command));
    }
  }

  const hasErrors = issues.some((i) => i.severity === 'error');
  return {
    valid: !hasErrors,
    issues,
  };
}
