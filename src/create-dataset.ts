import { createTrainingData } from "./refactoring/create-train-data.ts";
import { groupMessages } from "./refactoring/group-wp-chats.ts";
import { modifyUserSelected } from "./refactoring/modify-user-selected.ts";
import { parseChat } from "./refactoring/refactor-wp.ts";
import { printStats } from "./refactoring/stats-train-data.ts";
import { saveAllMessages } from "./refactoring/get-all-messages.ts";
import { Message } from "./lib/types.ts";
import { TARGET_USER } from "./lib/config.ts";

if (import.meta.main) {
  await Deno.mkdir("./data/refactored-chats", { recursive: true });

  const chatText = await Deno.readTextFile("./data/original-chats/chat.txt");
  const chatLines = chatText.split("\n");

  const chatMessages: Message[] = parseChat(chatLines);

  const chatOutputPath = "./data/refactored-chats/pure-wp.json";
  await saveJson(chatOutputPath, chatMessages);
  console.log(`Parsed ${chatMessages.length} messages and saved to ${chatOutputPath}`);

  await saveAllMessages(chatMessages, TARGET_USER);

  const gruopedMessages = groupMessages(chatMessages);

  const groupedOutputPath = "./data/refactored-chats/grouped-wp.json";
  await saveJson(groupedOutputPath, gruopedMessages);
  console.log(`Grouped messages saved to ${groupedOutputPath}`);

  const trainingData = createTrainingData(gruopedMessages);

  await saveText("./data/refactored-chats/user-train-data.jsonl", trainingData.map(data => JSON.stringify(data)).join("\n"));
  console.log(`Created training data with ${trainingData.length} contexts.`);

  const finalTrainingData = modifyUserSelected(trainingData);
  await saveText("./data/refactored-chats/final-train-data.jsonl", finalTrainingData.map(data => JSON.stringify(data)).join("\n"));
  console.log(`Modified training data to ${finalTrainingData.length} final examples.`);

  printStats(finalTrainingData);
}

function saveText(path: string, content: string) {
  return Deno.writeTextFile(path, content);
}

function saveJson(path: string, data: object) {
  return saveText(path, JSON.stringify(data, null, 2));
}