import { TrainingData } from "@/lib/types.ts";

const ASSISTANT = "assistant";

export function modifyUserSelected(trainingData: TrainingData[]) {

  const finalTrainingData: TrainingData[] = [];

  for (const context of trainingData) {
    const extraTrainingData: TrainingData[] = [];
    const temp = [...context.messages];

    // Create progressive training examples
    for (let i = 0; i < context.messages.length; i++) {
      const message = context.messages[i];
      
      if (message.role === ASSISTANT) {
        extraTrainingData.push({
          messages: temp.slice(0, i + 1),
        });
      }
    }

    // Take every second example (as in the original Python code)
    const selectedExamples = extraTrainingData.filter((_, index) => index % 2 === 0);
    finalTrainingData.push(...selectedExamples);
  }

  return finalTrainingData;
}