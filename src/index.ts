#!/usr/bin/env node
import { run } from '@stricli/core';
import { app } from './app.js';
import { logger } from './lib/logger.js';

run(app, process.argv.slice(2), { process }).catch((err) => {
  logger.error({ err: err instanceof Error ? err.message : String(err) }, 'Unhandled error');
  process.exitCode = process.exitCode ?? 1;
});
