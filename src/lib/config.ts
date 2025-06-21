import { Username } from "./types.ts";
import { timestampMicrosecond } from "./utils.ts";

// Environment variable validation
function getRequiredEnvVar<T extends string>(name: string): T {
  const value = Deno.env.get(name);
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    console.error(`Please check your .env file and ensure ${name} is set.`);
    Deno.exit(1);
  }
  return value as T;
}

export const SYSTEM_MESSAGE: string = getRequiredEnvVar("SYSTEM_PROMPT");
export const TARGET_USER: Username = getRequiredEnvVar("TARGET_USER");
export const CHANNEL_ID: string = getRequiredEnvVar("CHANNEL_ID");

export const CONTEXT_DIFF_THRESHOLD = 5 * 60 * 1_000_000; // 5 minutes in microseconds
export const GROUPED_DIFF_THRESHOLD = 2 * 60 * 1_000_000; // 4 minutes in microseconds
export const AFTER = timestampMicrosecond(new Date(2024, 6, 1)); // 1st Jul 2024 (month is 0-indexed)
export const REALTIME_GROUPED_DIFF_THRESHOLD = 7 * 1_000_000; // 7 seconds in microseconds
export const ASSISTANT_MESSAGE_RATIO = 0.42;

export const DEFAULT_MODEL = "gpt-4.1-mini-2025-04-14";