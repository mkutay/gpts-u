import { ASSISTANT, CONTEXT_DIFF_THRESHOLD, SYSTEM_MESSAGE, TARGET_USER, USER } from "@/lib/config.ts";
import { TrainingData, ChatMessage, GroupedMessage, Context } from "@/lib/types.ts";

export function createTrainingData(messages: GroupedMessage[]) {
  const trainingData: TrainingData[] = [];
  let context: Context | null = null;

  for (const message of messages) {
    if (context === null) {
      context = {
        messages: [message],
        firstTime: message.firstTime,
        lastTime: message.lastTime,
      };
      continue;
    }

    // Group messages by time proximity
    if (message.lastTime - context.lastTime < CONTEXT_DIFF_THRESHOLD) {
      context.messages.push(message);
      context.lastTime = message.lastTime;
      continue;
    }

    // Process the current context
    const contextData = processContext(context);
    if (contextData) {
      trainingData.push(contextData);
    }

    context = {
      messages: [message],
      firstTime: message.firstTime,
      lastTime: message.lastTime,
    };
  }

  // Process the last context
  if (context) {
    const contextData = processContext(context);
    if (contextData) {
      trainingData.push(contextData);
    }
  }

  return trainingData;
}

function processContext(context: Context): TrainingData | null {
  const chatMessages: ChatMessage[] = [];
  let hasAssistant = false;

  // Convert messages to chat format
  for (const message of context.messages) {
    if (message.author === TARGET_USER) {
      chatMessages.push({
        role: ASSISTANT,
        content: formatGroupedMessage(message),
        name: TARGET_USER,
      });
      hasAssistant = true;
    } else {
      chatMessages.push({
        role: USER,
        content: formatGroupedMessage(message),
        name: message.author,
      });
    }
  }

  // Skip if no assistant messages
  if (!hasAssistant) {
    return null;
  }

  // Remove leading assistant messages
  while (chatMessages.length > 0 && chatMessages[0].role === ASSISTANT) {
    chatMessages.shift();
  }

  // Remove trailing non-assistant messages
  while (chatMessages.length > 0 && chatMessages[chatMessages.length - 1].role !== ASSISTANT) {
    chatMessages.pop();
  }

  // Skip if no messages left
  if (chatMessages.length === 0) {
    return null;
  }

  // Skip if any message contains @ (mentions)
  if (chatMessages.some(msg => msg.content.includes("@"))) {
    return null;
  }

  return {
    messages: [
      {
        role: "system",
        content: SYSTEM_MESSAGE,
      },
      ...chatMessages,
    ],
  };
}

function formatGroupedMessage(message: GroupedMessage): string {
  return message.messages.join("\n");
}