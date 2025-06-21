import { TrainingData } from "@/lib/types.ts";

const ASSISTANT_MESSAGE_RATIO = 0.37;

export function modifyUserSelected(trainingData: TrainingData[]) {
  const finalTrainingData: TrainingData[] = [];

  for (const context of trainingData) {
    const extraTrainingData: TrainingData[] = [];
    const temp = [...context.messages];

    // Create progressive training examples
    for (let i = 0; i < context.messages.length; i++) {
      const message = context.messages[i];
      
      if (message.role === "assistant") {
        extraTrainingData.push({
          messages: temp.slice(0, i + 1),
        });
      }
    }

    finalTrainingData.push(...extraTrainingData);
  }

  return finalTrainingData.filter((data) => {
    const assistantCount = data.messages.filter((msg) => msg.role === "assistant").length;
    return assistantCount / data.messages.length > ASSISTANT_MESSAGE_RATIO
  });
}