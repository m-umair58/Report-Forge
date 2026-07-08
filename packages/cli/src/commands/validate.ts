import { logger } from '../logger.js';
import { runValidation } from '../validate.js';

export async function runValidateCommand(): Promise<void> {
  const issues = await runValidation();
  let errors = 0;
  let warnings = 0;

  for (const issue of issues) {
    if (issue.level === 'error') {
      logger.error(issue.path !== undefined ? `${issue.message} (${issue.path})` : issue.message);
      errors += 1;
    } else if (issue.level === 'warning') {
      logger.warn(issue.path !== undefined ? `${issue.message} (${issue.path})` : issue.message);
      warnings += 1;
    } else {
      logger.info(issue.path !== undefined ? `${issue.message} (${issue.path})` : issue.message);
    }
  }

  if (errors > 0) {
    throw new Error(`Validation failed with ${errors} error(s) and ${warnings} warning(s).`);
  }

  logger.success(`Validation passed (${warnings} warning${warnings === 1 ? '' : 's'}).`);
}
