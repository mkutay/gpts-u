import { ResultAsync, errAsync, okAsync, fromPromise } from "neverthrow";
import { Client, GatewayIntentBits, Message } from "discord.js";
import OpenAI from "openai";

import { CHANNEL_ID, CONTEXT_DIFF_THRESHOLD, REALTIME_GROUPED_DIFF_THRESHOLD, SYSTEM_MESSAGE, TARGET_USER } from "@/lib/config.ts";
import { ChatMessage, Context, GroupedMessage, Username, USERNAMES } from "./lib/types.ts";
import { converContextToChatFormat } from "./lib/utils.ts";

interface ResponseError {
  message: string;
  code: "NO_CONTEXT" | "API_ERROR" | "INVALID_RESPONSE";
}

export class Bot {
  private client: Client;
  private openai: OpenAI;
  private fineTunedModel: string;
  private context: Context | null = null;
  private replyTimer: number | null = null;
  private lastMessage: Message | null = null;

  constructor(fineTunedModel: string, apiKey: string) {
    this.fineTunedModel = fineTunedModel;
    this.openai = new OpenAI({ apiKey });
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.once("ready", () => {
      console.log(`Bot is ready! Logged in as ${this.client.user?.tag}`);
      console.log(`Using fine-tuned model: ${this.fineTunedModel}`);
    });

    this.client.on("messageCreate", (message: Message) => {
      if (message.author.bot) return; // Ignore messages from bots
      if (message.channelId !== CHANNEL_ID) return; // Only respond in the specified channel

      const content = message.content;
      const author = message.author.username;

      if (content[0] === "!") {
        console.log(`Reset context.`);
        this.context = null;
        return;
      }

      this.editContext(content, USERNAMES[author], message.createdAt);

      // Clear any existing timer
      if (this.replyTimer !== null) {
        clearTimeout(this.replyTimer);
        this.replyTimer = null;
      }

      this.lastMessage = message;

      // Set a new timer to send reply after REALTIME_GROUPED_DIFF_THRESHOLD
      this.replyTimer = setTimeout(() => {
        if (this.lastMessage) {
          this.sendMessage(this.lastMessage);
          this.lastMessage = null;
        }
        this.replyTimer = null;
      }, REALTIME_GROUPED_DIFF_THRESHOLD / 1000); // Convert microseconds to milliseconds
    });

    this.client.on("error", (error: Error) => {
      console.error("Discord client error:", error);
    });
  }

  private async sendMessage(message: Message<boolean>) {
    // Show typing indicator
    if ('sendTyping' in message.channel) {
      await message.channel.sendTyping();
    }

    const response = await this.generateResponse();
    if (response.isErr()) {
      console.error("Error generating response:", response.error.message);
      if ("send" in message.channel) {
        await message.channel.send(`Error: ${response.error.message}`);
      }
      return;
    }

    this.editContext(response.value, TARGET_USER, new Date());
    
    // Split long messages to avoid Discord's 2000 character limit
    if ("send" in message.channel) {
      const chunks = this.splitMessage(response.value);
      for (const chunk of chunks) {
        await message.channel.send(chunk);
      }
    }
  }

  private editContext(content: string, author: Username, createdAt: Date) {
    const timestamp = createdAt.getTime() * 1000; // Convert to microseconds

    const message: GroupedMessage = {
      messages: [content],
      firstTime: timestamp,
      lastTime: timestamp,
      author: author,
      type: "normal",
    }

    // Initialise context if it doesn't exist
    if (!this.context) {
      this.context = {
        messages: [message],
        firstTime: timestamp,
        lastTime: timestamp,
      };
      return;
    }

    if (timestamp - this.context.lastTime > CONTEXT_DIFF_THRESHOLD) {
      // Context is too old, reset it
      this.context = {
        messages: [message],
        firstTime: timestamp,
        lastTime: timestamp,
      };
      return;
    }

    // Add to existing context (within context threshold)
    const lastMessage = this.context.messages[this.context.messages.length - 1];
    
    // If it's from the same author and within the grouping threshold, add to existing grouped message
    if (lastMessage.author === author && timestamp - lastMessage.lastTime < REALTIME_GROUPED_DIFF_THRESHOLD) {
      lastMessage.messages.push(content);
      lastMessage.lastTime = timestamp;
    } else {
      // Create a new grouped message (different author or time gap)
      this.context.messages.push(message);
    }
    
    // Always update the context's last time
    this.context.lastTime = timestamp;
  };

  private generateResponse(): ResultAsync<string, ResponseError> {
    if (this.context === null) return errAsync({
      message: "No conversation context available",
      code: "NO_CONTEXT"
    });

    const { chatMessages } = converContextToChatFormat(this.context);

    // Build conversation context
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: SYSTEM_MESSAGE
      },
      ...chatMessages,
    ];

    // Generate response using fine-tuned model
    return fromPromise(
      this.openai.chat.completions.create({
        model: this.fineTunedModel,
        messages: messages,
        temperature: 0.85,
        max_completion_tokens: 4096,
        top_p: 1,
        frequency_penalty: 0.5,
        presence_penalty: 0.2,
        store: true,
        response_format: {
          type: "text",
        },
      }),
      (error: unknown) => ({
        message: error instanceof Error ? error.message : "Unknown error",
        code: "API_ERROR" as const
      })
    )
    .andThen((response) => {
      if (response.choices.length === 0 || !response.choices[0].message.content) {
        return errAsync({
          message: "No choices returned from OpenAI API.",
          code: "INVALID_RESPONSE" as const
        });
      }
      return okAsync(response.choices[0].message.content);
    });
  }

  private splitMessage(message: string): string[] {
    const maxLength = 1900; // Leave some buffer for Discord's 2000 char limit
    const chunks: string[] = [];
    
    if (message.length <= maxLength) {
      return [message];
    }

    // Split by newlines first to preserve message structure
    const lines = message.split('\n');
    let currentChunk = '';
    
    for (const line of lines) {
      if ((currentChunk + line + '\n').length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        
        // If a single line is too long, split it by words
        if (line.length > maxLength) {
          const words = line.split(' ');
          for (const word of words) {
            if ((currentChunk + word + ' ').length > maxLength) {
              if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
              }
            }
            currentChunk += word + ' ';
          }
        } else {
          currentChunk = line + '\n';
        }
      } else {
        currentChunk += line + '\n';
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  public async start(token: string): Promise<void> {
    try {
      await this.client.login(token);
    } catch (error) {
      console.error("Failed to login to Discord:", error);
      throw error;
    }
  }

  public stop(): void {
    // Clear any pending timer
    if (this.replyTimer !== null) {
      clearTimeout(this.replyTimer);
      this.replyTimer = null;
    }
    this.client.destroy();
  }
}

// Main server function
async function startServer() {
  const discordToken = Deno.env.get("DISCORD_BOT_TOKEN");
  const fineTunedModel = Deno.env.get("FINE_TUNED_MODEL_ID");
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

  if (!discordToken) {
    console.error("DISCORD_BOT_TOKEN environment variable is required");
    console.log("Get your bot token from: https://discord.com/developers/applications");
    Deno.exit(1);
  }

  if (!fineTunedModel) {
    console.error("FINE_TUNED_MODEL_ID environment variable is required");
    console.log("Run the fine-tuning process first and set the model ID");
    Deno.exit(1);
  }

  if (!openaiApiKey) {
    console.error("OPENAI_API_KEY environment variable is required");
    console.log("Get your OpenAI API key from: https://platform.openai.com/account/api-keys");
    Deno.exit(1);
  }

  console.log("Starting Discord Bot...");
  console.log(`Using model: ${fineTunedModel}`);

  const bot = new Bot(fineTunedModel, openaiApiKey);
  
  // Handle graceful shutdown
  const shutdown = () => {
    console.log("\nShutting down bot...");
    bot.stop();
    Deno.exit(0);
  };

  // Listen for shutdown signals
  Deno.addSignalListener("SIGINT", shutdown);
  Deno.addSignalListener("SIGTERM", shutdown);

  try {
    await bot.start(discordToken);
  } catch (error) {
    console.error("Failed to start bot:", error);
    Deno.exit(1);
  }
}

// CLI interface
if (import.meta.main) {
  const args = Deno.args;
  
  if (args.length > 0 && args[0] === "help") {
    console.log("Usuyus Discord Bot");
    console.log("");
    console.log("Environment variables required:");
    console.log("  DISCORD_BOT_TOKEN    - Your Discord bot token");
    console.log("  FINE_TUNED_MODEL_ID  - OpenAI fine-tuned model ID");
    console.log("  OPENAI_API_KEY       - Your OpenAI API key");
    console.log("");
    console.log("Usage:");
    console.log("  deno run --allow-net --allow-env src/server.ts");
    console.log("");
    console.log("Bot Features:");
    console.log("  - Responds to mentions in Discord servers");
    console.log("  - Responds to direct messages");
    console.log("  - Uses conversation context from recent messages");
    console.log("  - Powered by your fine-tuned Usuyus model");
  } else {
    await startServer();
  }
}