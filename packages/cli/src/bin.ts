#!/usr/bin/env node
import { runCli } from './cli.js';
import { logger } from './logger.js';

runCli(process.argv).catch((error: unknown) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
