import { Resend } from "resend";
import { config } from "./config.js";
import { logger } from "./logger.js";

let instance: Resend | null = null;

function getInstance(): Resend {
  if (!instance) {
    const apiKey = config.apiKey;
    if (!apiKey) {
      logger.error({ msg: "API key not found" });
      throw new Error(
        "API key not found. Please run `resend auth login` or set RESEND_API_KEY environment variable.",
      );
    }
    logger.debug({ msg: "Resend client initialized" });
    instance = new Resend(apiKey);
  }
  return instance;
}

export const ResendClient = { getInstance };
