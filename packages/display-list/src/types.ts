import type { DisplayCommand } from './commands.js';

// ─── Display page ─────────────────────────────────────────────────────────────

/**
 * A single page in the display list.
 *
 * Commands are ordered from back to front (painter's model):
 * later commands render on top of earlier ones.
 * Renderers iterate the commands array sequentially.
 *
 * @example
 * for (const page of displayList.pages) {
 *   console.log(`Page ${page.pageNumber}: ${page.commands.length} commands`);
 * }
 */
export interface DisplayPage {
  /** Page number (1-indexed). */
  readonly pageNumber: number;
  /** Page width in points. */
  readonly width: number;
  /** Page height in points. */
  readonly height: number;
  /** Drawing commands for this page, in paint order (back to front). */
  readonly commands: readonly DisplayCommand[];
}

// ─── Display list ─────────────────────────────────────────────────────────────

/**
 * The complete renderer-independent display list for a report.
 *
 * A Display List is the **final stage before rendering**. It contains only
 * drawing primitives — no report components, no Builder objects, no layout
 * concerns. Renderers consume this data structure exclusively.
 *
 * ## Renderer interface
 *
 * Every renderer receives a `DisplayList` and translates each command:
 *
 * | Renderer  | DrawText         | DrawRectangle    | DrawLine       |
 * |-----------|-----------------|-----------------|----------------|
 * | PDF       | BT/Tf/Tj/ET     | re/f/S          | m/l/S          |
 * | HTML      | `<p>` / `<span>`| `<div>` + CSS   | `<hr>` / SVG  |
 * | Canvas    | fillText()      | fillRect()      | moveTo/lineTo  |
 * | SVG       | `<text>`        | `<rect>`        | `<line>`       |
 *
 * @example
 * const displayList = generator.generate(layout);
 * console.log(`Total pages: ${displayList.pages.length}`);
 * console.log(`Total commands: ${displayList.commandCount}`);
 */
export interface DisplayList {
  /** One entry per page in the document. */
  readonly pages: readonly DisplayPage[];
  /**
   * Report-level metadata (title, author, creation date, etc.).
   * Forwarded from the layout output.
   */
  readonly metadata: Readonly<Record<string, unknown>>;
  /** Total number of drawing commands across all pages. */
  readonly commandCount: number;
}

// ─── Display context ──────────────────────────────────────────────────────────

/**
 * Per-page context used internally by the Display List Generator.
 * Carries resolved defaults for the current page being processed.
 *
 * Renderers do NOT receive this — it is internal to the generator.
 */
export interface DisplayContext {
  /** Page width in points. */
  readonly pageWidth: number;
  /** Page height in points. */
  readonly pageHeight: number;
  /** Default font family. */
  readonly defaultFont: string;
  /** Default font size in points. */
  readonly defaultFontSize: number;
  /** Default text color. */
  readonly defaultColor: string;
  /** Default opacity (0–1). */
  readonly defaultOpacity: number;
}

// ─── Generator options ────────────────────────────────────────────────────────

/**
 * Options controlling how the Display List Generator produces commands.
 *
 * All fields are optional — omitted fields use the built-in defaults.
 */
export interface DisplayListOptions {
  /**
   * Default font family for text commands.
   * @default 'Helvetica'
   */
  readonly defaultFont?: string;

  /**
   * Default body font size in points.
   * @default 12
   */
  readonly defaultFontSize?: number;

  /**
   * Default text color (hex or rgb string).
   * @default '#1a1a1a'
   */
  readonly defaultColor?: string;

  /**
   * Default opacity for generated commands (0–1).
   * @default 1
   */
  readonly defaultOpacity?: number;

  /**
   * When true, the optimizer removes commands with zero or negative size.
   * @default true
   */
  readonly optimizeEmptyCommands?: boolean;

  /**
   * When true, the optimizer removes commands with opacity ≤ 0.
   * @default true
   */
  readonly optimizeInvisibleCommands?: boolean;

  /**
   * When true, the validator checks all generated commands for invalid values.
   * @default true
   */
  readonly validateCommands?: boolean;
}

// ─── Validation result ────────────────────────────────────────────────────────

/** Severity of a display list validation issue. */
export type ValidationSeverity = 'error' | 'warning';

/** A single validation issue found by the Display List Validator. */
export interface DisplayListValidationIssue {
  /** The originating node ID. */
  readonly nodeId: string;
  /** The command kind that triggered the issue. */
  readonly commandKind: string;
  /** Severity level. */
  readonly severity: ValidationSeverity;
  /** Human-readable description of the issue. */
  readonly message: string;
}

/** Result of validating a complete Display List. */
export interface DisplayListValidationResult {
  readonly valid: boolean;
  readonly issues: readonly DisplayListValidationIssue[];
}
