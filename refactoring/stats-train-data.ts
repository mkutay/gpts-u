import { SYSTEM_MESSAGE } from "./config.ts";
import { TrainingData } from "./types.ts";

interface Stats {
  average: number;
  max: number;
  min: number;
  total: number;
  count: number;
  lengths: number[];
}

export function calculateStats(trainingData: TrainingData[]): Stats {
  const systemMessageLength = SYSTEM_MESSAGE.length;
  let totalLength = 0;
  let maxLength = 0;
  let minLength = 1_000_000;
  const lengths: number[] = [];

  for (const data of trainingData) {
    let contextLength = 0;
    
    for (const message of data.messages) {
      contextLength += message.content.length;
    }
    
    // Subtract system message length (as in original Python code)
    contextLength -= systemMessageLength;
    
    totalLength += contextLength;
    maxLength = Math.max(maxLength, contextLength);
    minLength = Math.min(minLength, contextLength);
    lengths.push(contextLength);
  }

  const stats: Stats = {
    average: totalLength / trainingData.length,
    max: maxLength,
    min: minLength,
    total: totalLength,
    count: trainingData.length,
    lengths,
  };

  return stats;
}

export function printStats(trainingData: TrainingData[]) {
  const stats = calculateStats(trainingData);
  
  console.log("Training Data Statistics:");
  console.log("=".repeat(40));
  console.log(`Total examples: ${stats.count}`);
  console.log(`Average length: ${stats.average.toFixed(2)} characters`);
  console.log(`Maximum length: ${stats.max} characters`);
  console.log(`Minimum length: ${stats.min} characters`);
  console.log(`Total length: ${stats.total} characters`);
  
  // console.log("\nIndividual lengths:");
  // stats.lengths.forEach((length, index) => {
  //   console.log(`Example ${index + 1}: ${length} characters`);
  // });
}