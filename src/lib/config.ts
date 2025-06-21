import { Username } from "./types.ts";
import { timestampMicrosecond } from "./utils.ts";

export const SYSTEM_MESSAGE = ``;

export const CONTEXT_DIFF_THRESHOLD = 5 * 60 * 1_000_000; // 5 minutes in microseconds
export const TARGET_USER: Username = "Usuyus";

export const GROUPED_DIFF_THRESHOLD = 4 * 60 * 1_000_000; // 4 minutes in microseconds
export const AFTER = timestampMicrosecond(new Date(2024, 6, 1)); // 1st Jul 2024 (month is 0-indexed)

export const REALTIME_GROUPED_DIFF_THRESHOLD = 2 * 1_000_000; // 7 seconds in microseconds

// susai channel
export const CHANNEL_ID = "1322252010040332319";

export const DEFAULT_MODEL = "gpt-4.1-mini-2025-04-14";