import { Message, Username } from "@/lib/types.ts";
import { AFTER } from "@/lib/config.ts";

export async function saveAllMessages(messages: Message[], username: Username): Promise<void> {
  const allMessages: Message[] = [];
  for (const message of messages) {
    if (message.author === username && message.time > AFTER) {
      allMessages.push(message);
    }
  }

  const outputPath = `./data/refactored-chats/${username}-messages.txt`;
  const content = allMessages.map(msg => `${msg.text}`).join("\n");
  await Deno.writeTextFile(outputPath, content);
  console.log(`Saved ${allMessages.length} messages for ${username} to ${outputPath}`);
}