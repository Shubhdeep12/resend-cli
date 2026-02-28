import { Resend } from "resend";
import { config } from "./config/index.js";
import { MESSAGES } from "./constants/index.js";
import { CliError } from "./errors.js";
import { logger } from "./logger.js";

let instance: Resend | null = null;

function getInstance(): Resend {
  if (!instance) {
    const apiKey = config.apiKey;
    if (!apiKey) {
      throw new CliError(MESSAGES.apiKeyMissing);
    }
    logger.debug({ msg: "Resend client initialized" });
    instance = new Resend(apiKey);
  }
  return instance;
}

export const ResendClient = { getInstance };
