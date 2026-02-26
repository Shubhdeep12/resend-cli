import { Resend } from "resend";
import { config } from "./config.js";
import { MESSAGES } from "./constants/index.js";
import { logger } from "./logger.js";

let instance: Resend | null = null;

function getInstance(): Resend {
  if (!instance) {
    const apiKey = config.apiKey;
    if (!apiKey) {
      logger.error({ msg: "API key not found" });
      throw new Error(MESSAGES.apiKeyMissing);
    }
    logger.debug({ msg: "Resend client initialized" });
    instance = new Resend(apiKey);
  }
  return instance;
}

export const ResendClient = { getInstance };
