import OpenAI from "openai";
import { TrainingData } from "@/lib/types.ts";

export interface ModerationResult {
  id: string;
  model: string;
  results: {
    flagged: boolean;
    categories: {
      sexual: boolean;
      hate: boolean;
      harassment: boolean;
      "self-harm": boolean;
      "sexual/minors": boolean;
      "hate/threatening": boolean;
      "violence/graphic": boolean;
      "self-harm/intent": boolean;
      "self-harm/instructions": boolean;
      "harassment/threatening": boolean;
      violence: boolean;
    };
    category_scores: {
      sexual: number;
      hate: number;
      harassment: number;
      "self-harm": number;
      "sexual/minors": number;
      "hate/threatening": number;
      "violence/graphic": number;
      "self-harm/intent": number;
      "self-harm/instructions": number;
      "harassment/threatening": number;
      violence: number;
    };
  }[];
}

export interface ModerationViolation {
  messageIndex: number;
  chatMessageIndex: number;
  content: string;
  role: string;
  name?: string;
  violations: string[];
  scores: Record<string, number>;
}

export interface ModerationReport {
  totalMessages: number;
  totalViolations: number;
  violationRate: number;
  violations: ModerationViolation[];
  categoryCounts: Record<string, number>;
  summary: string;
}

export class OpenAIModerator {
  private openai: OpenAI;

  constructor() {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Moderate a single text string
   */
  async moderateText(text: string): Promise<ModerationResult> {
    try {
      const response = await this.openai.moderations.create({
        input: text,
      });
      return response as ModerationResult;
    } catch (error) {
      console.error("Error moderating text:", error);
      throw error;
    }
  }

  /**
   * Moderate multiple text strings in a batch
   */
  async moderateTexts(texts: string[]): Promise<ModerationResult> {
    try {
      const response = await this.openai.moderations.create({
        input: texts,
      });
      return response as ModerationResult;
    } catch (error) {
      console.error("Error moderating texts:", error);
      throw error;
    }
  }

  /**
   * Extract all message contents from training data
   */
  private extractMessageContents(trainingData: TrainingData[]): {
    content: string;
    messageIndex: number;
    chatMessageIndex: number;
    role: string;
    name?: string;
  }[] {
    const contents: {
      content: string;
      messageIndex: number;
      chatMessageIndex: number;
      role: string;
      name?: string;
    }[] = [];

    trainingData.forEach((data, messageIndex) => {
      data.messages.forEach((message, chatMessageIndex) => {
        contents.push({
          content: message.content,
          messageIndex,
          chatMessageIndex,
          role: message.role,
          name: message.role !== "system" ? (message as { name?: string }).name : undefined,
        });
      });
    });

    return contents;
  }

  /**
   * Process moderation results and identify violations
   */
  private processViolations(
    contents: {
      content: string;
      messageIndex: number;
      chatMessageIndex: number;
      role: string;
      name?: string;
    }[],
    moderationResult: ModerationResult
  ): ModerationViolation[] {
    const violations: ModerationViolation[] = [];

    moderationResult.results.forEach((result, index) => {
      if (result.flagged) {
        const content = contents[index];
        const violatedCategories = Object.entries(result.categories)
          .filter(([_, flagged]) => flagged)
          .map(([category, _]) => category);

        violations.push({
          messageIndex: content.messageIndex,
          chatMessageIndex: content.chatMessageIndex,
          content: content.content,
          role: content.role,
          name: content.name,
          violations: violatedCategories,
          scores: result.category_scores,
        });
      }
    });

    return violations;
  }

  /**
   * Generate a comprehensive report from violations
   */
  private generateReport(
    totalMessages: number,
    violations: ModerationViolation[]
  ): ModerationReport {
    const categoryCounts: Record<string, number> = {};
    
    violations.forEach((violation) => {
      violation.violations.forEach((category) => {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
    });

    const violationRate = (violations.length / totalMessages) * 100;

    let summary = `Moderation Report:\n`;
    summary += `- Total messages checked: ${totalMessages}\n`;
    summary += `- Messages with violations: ${violations.length}\n`;
    summary += `- Violation rate: ${violationRate.toFixed(2)}%\n`;
    
    if (violations.length > 0) {
      summary += `\nViolation categories:\n`;
      Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .forEach(([category, count]) => {
          summary += `- ${category}: ${count} messages\n`;
        });
    }

    return {
      totalMessages,
      totalViolations: violations.length,
      violationRate,
      violations,
      categoryCounts,
      summary,
    };
  }

  /**
   * Moderate an entire training dataset
   */
  async moderateTrainingDataset(filePath: string): Promise<ModerationReport> {
    console.log(`Reading training data from: ${filePath}`);
    
    try {
      // Read the JSONL file
      const fileContent = await Deno.readTextFile(filePath);
      const lines = fileContent.trim().split('\n');
      const trainingData: TrainingData[] = lines.map(line => JSON.parse(line));
      
      console.log(`Loaded ${trainingData.length} training examples`);

      // Extract all message contents
      const contents = this.extractMessageContents(trainingData);
      console.log(`Extracted ${contents.length} individual messages for moderation`);

      // Batch process in chunks of 32 (OpenAI's limit)
      const batchSize = 32;
      let allViolations: ModerationViolation[] = [];
      
      for (let i = 0; i < contents.length; i += batchSize) {
        const batch = contents.slice(i, i + batchSize);
        const batchTexts = batch.map(c => c.content);
        
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(contents.length / batchSize)}`);
        
        try {
          const moderationResult = await this.moderateTexts(batchTexts);
          const batchViolations = this.processViolations(batch, moderationResult);
          allViolations = allViolations.concat(batchViolations);
          
          // Rate limiting - wait a bit between batches
          if (i + batchSize < contents.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Error processing batch starting at index ${i}:`, error);
          // Continue with next batch
        }
      }

      // Generate comprehensive report
      const report = this.generateReport(contents.length, allViolations);
      
      console.log("\n" + report.summary);
      
      return report;
    } catch (error) {
      console.error("Error moderating training dataset:", error);
      throw error;
    }
  }

  /**
   * Save moderation report to file
   */
  async saveReport(report: ModerationReport, outputPath: string): Promise<void> {
    try {
      const reportData = {
        timestamp: new Date().toISOString(),
        ...report,
      };
      
      await Deno.writeTextFile(outputPath, JSON.stringify(reportData, null, 2));
      console.log(`Moderation report saved to: ${outputPath}`);
    } catch (error) {
      console.error("Error saving report:", error);
      throw error;
    }
  }

  /**
   * Filter out training examples that contain violations
   */
  async filterCleanTrainingData(
    inputPath: string,
    outputPath: string,
    report?: ModerationReport
  ): Promise<void> {
    try {
      // Generate report if not provided
      if (!report) {
        report = await this.moderateTrainingDataset(inputPath);
      }

      // Read original training data
      const fileContent = await Deno.readTextFile(inputPath);
      const lines = fileContent.trim().split('\n');
      const trainingData: TrainingData[] = lines.map(line => JSON.parse(line));

      // Get set of message indexes with violations
      const violatedMessageIndexes = new Set(
        report.violations.map(v => v.messageIndex)
      );

      // Filter out violated examples
      const cleanTrainingData = trainingData.filter((_, index) => 
        !violatedMessageIndexes.has(index)
      );

      // Save clean data
      const cleanContent = cleanTrainingData
        .map(data => JSON.stringify(data))
        .join('\n');
      
      await Deno.writeTextFile(outputPath, cleanContent);
      
      console.log(`\nFiltered training data:`);
      console.log(`- Original examples: ${trainingData.length}`);
      console.log(`- Removed examples: ${violatedMessageIndexes.size}`);
      console.log(`- Clean examples: ${cleanTrainingData.length}`);
      console.log(`- Clean data saved to: ${outputPath}`);
    } catch (error) {
      console.error("Error filtering training data:", error);
      throw error;
    }
  }
}

// CLI interface
if (import.meta.main) {
  const moderator = new OpenAIModerator();
  const args = Deno.args;
  
  if (args.length === 0) {
    // Default: moderate the final training data
    const trainingFilePath = "./data/refactored-chats/final-train-data.jsonl";
    const reportPath = "./data/refactored-chats/moderation-report.json";
    
    console.log("Starting moderation of training dataset...");
    const report = await moderator.moderateTrainingDataset(trainingFilePath);
    await moderator.saveReport(report, reportPath);
    
    if (report.totalViolations > 0) {
      console.log("\nViolations detected! Creating clean dataset...");
      const cleanDataPath = "./data/refactored-chats/final-train-data-clean.jsonl";
      await moderator.filterCleanTrainingData(trainingFilePath, cleanDataPath, report);
    } else {
      console.log("\nNo violations detected! Training data is clean.");
    }
  } else if (args[0] === "text" && args[1]) {
    // Moderate a single text string
    const result = await moderator.moderateText(args[1]);
    console.log("Moderation result:", JSON.stringify(result, null, 2));
  } else if (args[0] === "file" && args[1]) {
    // Moderate a specific file
    const report = await moderator.moderateTrainingDataset(args[1]);
    const reportPath = args[2] || "./moderation-report.json";
    await moderator.saveReport(report, reportPath);
  } else if (args[0] === "filter" && args[1] && args[2]) {
    // Filter training data based on existing report
    await moderator.filterCleanTrainingData(args[1], args[2]);
  } else {
    console.log("Usage:");
    console.log("  deno run --allow-net --allow-read --allow-write --allow-env src/moderation/openai.ts [command]");
    console.log("");
    console.log("Commands:");
    console.log("  (no command)                           Moderate final-train-data.jsonl and create clean version");
    console.log("  text <text>                           Moderate a single text string");
    console.log("  file <input-path> [report-path]       Moderate a specific training file");
    console.log("  filter <input-path> <output-path>     Filter training data to remove violations");
  }
}