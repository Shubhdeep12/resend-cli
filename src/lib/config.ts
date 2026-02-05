import Conf from 'conf';

interface ConfigSchema {
  apiKey?: string;
  defaultFrom?: string;
  profile?: string;
}

export class Config {
  private conf: Conf<ConfigSchema>;

  constructor() {
    this.conf = new Conf<ConfigSchema>({
      projectName: 'resend-cli',
      defaults: {
        profile: 'default',
      },
    });
  }

  get apiKey(): string | undefined {
    return this.conf.get('apiKey') || process.env.RESEND_API_KEY;
  }

  set apiKey(value: string | undefined) {
    this.conf.set('apiKey', value);
  }

  get defaultFrom(): string | undefined {
    return this.conf.get('defaultFrom');
  }

  set defaultFrom(value: string | undefined) {
    this.conf.set('defaultFrom', value);
  }

  clear() {
    this.conf.clear();
  }
}

export const config = new Config();
