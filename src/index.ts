#!/usr/bin/env node
import { run } from '@stricli/core';
import { app } from './app.js';

run(app, process.argv.slice(2), { process }).catch((err) => {
  console.error(err);
  process.exitCode = process.exitCode ?? 1;
});
