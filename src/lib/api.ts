import { Resend } from 'resend';
import { config } from './config.js';

export class ResendClient {
  private static instance: Resend;

  static getInstance(): Resend {
    if (!this.instance) {
      const apiKey = config.apiKey;
      if (!apiKey) {
        throw new Error(
          'API key not found. Please run `resend init` or set RESEND_API_KEY environment variable.',
        );
      }
      this.instance = new Resend(apiKey);
    }
    return this.instance;
  }
}
