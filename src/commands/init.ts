import * as p from '@clack/prompts';
import { buildCommand } from '@stricli/core';
import pc from 'picocolors';
import { config } from '../lib/config.js';

export const initCommand = buildCommand({
  parameters: {},
  docs: { brief: 'Initialize Resend CLI and set API key' },
  func: async () => {
    p.intro(pc.cyan('Resend CLI Initialization'));

      const apiKey = await p.text({
      message: 'Enter your Resend API Key:',
      validate: (value: string) => {
        if (!value) return 'API Key is required';
        if (!value.startsWith('re_')) return 'Invalid API Key format (should start with re_)';
      },
    });

    if (p.isCancel(apiKey)) {
      p.cancel('Initialization cancelled.');
      process.exit(0);
    }

    config.apiKey = apiKey as string;

    p.outro(pc.green('Successfully initialized! You can now use the CLI.'));
  },
});
