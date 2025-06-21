import { TARGET_USER } from "./config.ts";
import { ChatMessage, Context, GroupedMessage } from "./types.ts";

export function timestampMicrosecond(date: Date): number {
  return date.getTime() * 1000; // Convert milliseconds to microseconds
}

export function parseDateTime(dateStr: string): Date {
  // Parse format: "dd/mm/yyyy, hh:mm:ss"
  const [datePart, timePart] = dateStr.split(", ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);
  
  return new Date(year, month - 1, day, hour, minute, second);
}

export function converContextToChatFormat(context: Context) {
  const chatMessages: ChatMessage[] = [];
  let hasAssistant = false;
  for (const message of context.messages) {
    if (message.author === TARGET_USER) {
      chatMessages.push({
        role: "assistant",
        content: formatGroupedMessage(message),
        name: TARGET_USER,
      });
      hasAssistant = true;
    } else {
      chatMessages.push({
        role: "user",
        content: formatGroupedMessage(message),
        name: message.author,
      });
    }
  }
  return {
    chatMessages, hasAssistant
  };
}

export function formatGroupedMessage(message: GroupedMessage): string {
  return message.messages.join("\n");
}