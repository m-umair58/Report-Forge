import type { ColumnDefinition, TableDataInput, TableValidationIssue, TableValidationResult } from './types.js';
import { columnTitle } from './constants.js';

function issue(message: string, path?: string): TableValidationIssue {
  return path !== undefined ? { message, path } : { message };
}

function validateColumn(column: ColumnDefinition, index: number): TableValidationIssue[] {
  const errors: TableValidationIssue[] = [];
  const path = `columns[${index.toString()}]`;

  if (typeof column.key !== 'string' || column.key.trim().length === 0) {
    errors.push(issue(`Column key must be a non-empty string.`, `${path}.key`));
  }

  const title = columnTitle(column);
  if (title.trim().length === 0) {
    errors.push(issue(`Column header must be non-empty.`, `${path}.title`));
  }

  if (column.minWidth !== undefined && (typeof column.minWidth !== 'number' || column.minWidth < 0)) {
    errors.push(issue(`Column minWidth must be a non-negative number.`, `${path}.minWidth`));
  }

  if (column.maxWidth !== undefined && (typeof column.maxWidth !== 'number' || column.maxWidth < 0)) {
    errors.push(issue(`Column maxWidth must be a non-negative number.`, `${path}.maxWidth`));
  }

  if (
    column.minWidth !== undefined &&
    column.maxWidth !== undefined &&
    column.minWidth > column.maxWidth
  ) {
    errors.push(issue(`Column minWidth cannot exceed maxWidth.`, path));
  }

  if (column.width !== undefined) {
    if (typeof column.width === 'number') {
      if (column.width < 0) {
        errors.push(issue(`Fixed column width must be non-negative.`, `${path}.width`));
      }
    } else if (column.width !== 'auto' && !/^\d+(\.\d+)?%$/.test(column.width)) {
      errors.push(issue(`Column width must be a number, 'auto', or a percentage string.`, `${path}.width`));
    }
  }

  return errors;
}

/**
 * Validates table column definitions and row keys.
 */
export function validateTableData(input: TableDataInput): TableValidationResult {
  const errors: TableValidationIssue[] = [];

  if (!Array.isArray(input.columns) || input.columns.length === 0) {
    return { valid: false, errors: [issue(`Table requires at least one column.`)] };
  }

  const seenKeys = new Set<string>();
  for (let i = 0; i < input.columns.length; i++) {
    const column = input.columns[i];
    if (column === undefined) continue;

    errors.push(...validateColumn(column, i));

    if (seenKeys.has(column.key)) {
      errors.push(issue(`Duplicate column key '${column.key}'.`, `columns[${i.toString()}].key`));
    }
    seenKeys.add(column.key);
  }

  if (!Array.isArray(input.rows)) {
    errors.push(issue(`Table requires a rows array.`));
  } else {
    for (let rowIndex = 0; rowIndex < input.rows.length; rowIndex++) {
      const row = input.rows[rowIndex];
      if (row === undefined) continue;
      for (const column of input.columns) {
        if (!(column.key in row)) {
          errors.push(
            issue(
              `Row ${rowIndex.toString()} is missing key '${column.key}'.`,
              `rows[${rowIndex.toString()}].${column.key}`,
            ),
          );
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
