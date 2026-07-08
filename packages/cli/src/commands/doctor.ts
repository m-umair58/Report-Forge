import { logger } from '../logger.js';
import { runDoctorChecks } from '../doctor.js';

export async function runDoctorCommand(): Promise<void> {
  logger.title('ReportForge Doctor');
  const checks = await runDoctorChecks();
  let failures = 0;

  for (const check of checks) {
    if (check.status === 'pass') logger.success(`${check.name}: ${check.message}`);
    else if (check.status === 'warn') logger.warn(`${check.name}: ${check.message}`);
    else {
      logger.error(`${check.name}: ${check.message}`);
      failures += 1;
    }
  }

  if (failures > 0) {
    throw new Error(`Doctor found ${failures} issue(s).`);
  }
}
