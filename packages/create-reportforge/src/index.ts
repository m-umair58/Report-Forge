#!/usr/bin/env node
import { runInit } from '@reportforge/cli';

const args = process.argv.slice(2);
const nameArgIndex = args.findIndex((arg) => arg === '--name' || arg === '-n');
const name = nameArgIndex >= 0 ? args[nameArgIndex + 1] : undefined;

runInit({
  name,
  yes: name !== undefined,
}).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
