import { AFTER, GROUPED_DIFF_THRESHOLD } from "@/lib/config.ts";
import { GroupedMessage, Message } from "@/lib/types.ts";

export function groupMessages(messages: Message[]) {
  const groupedMessages: GroupedMessage[] = [];

  for (const message of messages) {
    // Skip system messages, attachments, and messages before August 2024
    if (
      message.type === "system" || 
      message.type === "attachment" || 
      message.time < AFTER
    ) {
      continue;
    }

    if (groupedMessages.length === 0) {
      groupedMessages.push({
        messages: [message.text],
        firstTime: message.time,
        lastTime: message.time,
        author: message.author,
        type: message.type,
      });
      continue;
    }

    const lastMessage = groupedMessages[groupedMessages.length - 1];
    
    // Group consecutive messages from same author within time threshold
    if (message.author === lastMessage.author && message.time - lastMessage.lastTime < GROUPED_DIFF_THRESHOLD) {
      lastMessage.messages.push(message.text);
      lastMessage.lastTime = message.time;
    } else {
      groupedMessages.push({
        messages: [message.text],
        firstTime: message.time,
        lastTime: message.time,
        author: message.author,
        type: message.type,
      });
    }
  }

  return groupedMessages;
}