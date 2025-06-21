import { encoding_for_model } from "tiktoken";

import { DEFAULT_MODEL } from "@/lib/config.ts";
import { TrainingData } from "@/lib/types.ts";

interface Stats {
  average: number;
  max: number;
  min: number;
  total: number;
  count: number;
  lengths: number[];
  // Token statistics
  averageTokens: number;
  maxTokens: number;
  minTokens: number;
  totalTokens: number;
  tokenCounts: number[];
}

export function calculateStats(trainingData: TrainingData[]): Stats {
  let totalLength = 0;
  let maxLength = 0;
  let minLength = 1_000_000;
  const lengths: number[] = [];

  // Token counting
  const encoder = encoding_for_model(DEFAULT_MODEL);
  let totalTokens = 0;
  let maxTokens = 0;
  let minTokens = 5_000_000;
  const tokenCounts: number[] = [];

  for (const data of trainingData) {
    let contextLength = 0;
    let contextTokens = 0;
    
    for (const message of data.messages) {
      contextLength += message.content.length;
      // Count tokens for this message
      const messageTokens = encoder.encode(message.content).length;
      contextTokens += messageTokens;
    }
    
    totalLength += contextLength;
    maxLength = Math.max(maxLength, contextLength);
    minLength = Math.min(minLength, contextLength);
    lengths.push(contextLength);

    totalTokens += contextTokens;
    maxTokens = Math.max(maxTokens, contextTokens);
    minTokens = Math.min(minTokens, contextTokens);
    tokenCounts.push(contextTokens);
  }

  encoder.free(); // Clean up the encoder

  const stats: Stats = {
    average: totalLength / trainingData.length,
    max: maxLength,
    min: minLength,
    total: totalLength,
    count: trainingData.length,
    lengths,
    averageTokens: totalTokens / trainingData.length,
    maxTokens: maxTokens,
    minTokens: minTokens,
    totalTokens: totalTokens,
    tokenCounts,
  };

  return stats;
}

export function printStats(trainingData: TrainingData[]) {
  const stats = calculateStats(trainingData);
  
  console.log("Training Data Statistics:");
  console.log("=".repeat(40));
  console.log(`Total examples: ${stats.count}`);
  console.log();
  console.log("Character Statistics:");
  console.log(`Average length: ${stats.average.toFixed(2)} characters`);
  console.log(`Maximum length: ${stats.max} characters`);
  console.log(`Minimum length: ${stats.min} characters`);
  console.log(`Total length: ${stats.total} characters`);
  console.log();
  console.log(`Token Statistics (${DEFAULT_MODEL}):`);
  console.log(`Average tokens: ${stats.averageTokens.toFixed(2)} tokens`);
  console.log(`Maximum tokens: ${stats.maxTokens} tokens`);
  console.log(`Minimum tokens: ${stats.minTokens} tokens`);
  console.log(`Total tokens: ${stats.totalTokens} tokens`);
  
  // console.log("\nIndividual lengths:");
  // stats.lengths.forEach((length, index) => {
  //   console.log(`Example ${index + 1}: ${length} characters`);
  // });
}