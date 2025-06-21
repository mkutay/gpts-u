import OpenAI from "openai";

import { DEFAULT_MODEL } from "@/lib/config.ts";

export interface FineTuningJob {
  id: string;
  model: string;
  status: string;
  created_at: number;
  finished_at?: number;
  fine_tuned_model?: string;
  training_file: string;
  validation_file?: string;
}

export class OpenAIFineTuner {
  private openai: OpenAI;

  constructor() {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Upload training data file to OpenAI
   */
  async uploadTrainingFile(filePath: string): Promise<string> {
    try {
      console.log(`Uploading training file: ${filePath}`);
      
      // Read the file
      const fileContent = await Deno.readTextFile(filePath);
      const file = new File([fileContent], "final-train-data.jsonl", {
        type: "application/jsonl",
      });

      // Upload to OpenAI
      const uploadResponse = await this.openai.files.create({
        file: file,
        purpose: "fine-tune",
      });

      console.log(`File uploaded successfully: ${uploadResponse.id}`);
      return uploadResponse.id;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }

  /**
   * Create a fine-tuning job
   */
  async createFineTuningJob(
    trainingFileId: string,
    model: string,
    suffix: string
  ): Promise<FineTuningJob> {
    try {
      console.log(`Creating fine-tuning job with file: ${trainingFileId}`);
      
      const jobResponse = await this.openai.fineTuning.jobs.create({
        training_file: trainingFileId,
        model: model,
        suffix: suffix,
      });

      console.log(`Fine-tuning job created: ${jobResponse.id}`);
      return jobResponse as FineTuningJob;
    } catch (error) {
      console.error("Error creating fine-tuning job:", error);
      throw error;
    }
  }

  /**
   * Check the status of a fine-tuning job
   */
  async getFineTuningJobStatus(jobId: string): Promise<FineTuningJob> {
    try {
      const jobResponse = await this.openai.fineTuning.jobs.retrieve(jobId);
      return jobResponse as FineTuningJob;
    } catch (error) {
      console.error("Error getting job status:", error);
      throw error;
    }
  }

  /**
   * List all fine-tuning jobs
   */
  async listFineTuningJobs(): Promise<FineTuningJob[]> {
    try {
      const jobsResponse = await this.openai.fineTuning.jobs.list();
      return jobsResponse.data as FineTuningJob[];
    } catch (error) {
      console.error("Error listing jobs:", error);
      throw error;
    }
  }

  /**
   * Wait for a fine-tuning job to complete
   */
  async waitForJobCompletion(jobId: string): Promise<FineTuningJob> {
    console.log(`Waiting for job ${jobId} to complete...`);
    
    while (true) {
      const job = await this.getFineTuningJobStatus(jobId);
      console.log(`Job status: ${job.status}`);
      
      if (job.status === "succeeded") {
        console.log(`Job completed! Fine-tuned model: ${job.fine_tuned_model}`);
        return job;
      } else if (job.status === "failed") {
        throw new Error(`Fine-tuning job failed: ${jobId}`);
      } else if (job.status === "cancelled") {
        throw new Error(`Fine-tuning job was cancelled: ${jobId}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 15_000));
    }
  }

  /**
   * Complete workflow: upload file and create fine-tuning job
   */
  async trainModel(
    trainingFilePath: string,
    model: string,
    suffix: string
  ): Promise<FineTuningJob> {
    console.log("Starting fine-tuning workflow...");
    
    // Upload training file
    const fileId = await this.uploadTrainingFile(trainingFilePath);
    
    // Create fine-tuning job
    const job = await this.createFineTuningJob(fileId, model, suffix);
    
    console.log(`Fine-tuning job started: ${job.id}`);
    console.log("You can monitor the job status with:");
    console.log(`deno run train status ${job.id}`);
    
    return job;
  }
}

// CLI interface
if (import.meta.main) {
  const fineTuner = new OpenAIFineTuner();
  const args = Deno.args;
  
  if (args.length === 0) {
    // Default: upload and start training
    const trainingFilePath = "./data/refactored-chats/final-train-data.jsonl";
    const job = await fineTuner.trainModel(trainingFilePath, DEFAULT_MODEL, "usuyus");
    console.log("Training job created:", job);
  } else if (args[0] === "status" && args[1]) {
    // Check job status
    const job = await fineTuner.getFineTuningJobStatus(args[1]);
    console.log("Job status:", job);
  } else if (args[0] === "list") {
    // List all jobs
    const jobs = await fineTuner.listFineTuningJobs();
    console.log("All fine-tuning jobs:", jobs);
  } else if (args[0] === "wait" && args[1]) {
    // Wait for job completion
    const job = await fineTuner.waitForJobCompletion(args[1]);
    console.log("Job completed:", job);
  } else {
    console.log("Usage:");
    console.log("  deno run --allow-net --allow-read --allow-env src/train/openai.ts [command]");
    console.log("");
    console.log("Commands:");
    console.log("  (no command)     Upload training data and start fine-tuning");
    console.log("  status <job-id>  Check the status of a fine-tuning job");
    console.log("  list             List all fine-tuning jobs");
    console.log("  wait <job-id>    Wait for a job to complete");
  }
}