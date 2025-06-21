# Use the official Deno image
FROM denoland/deno:2.1.4

# Set the working directory
WORKDIR /app

# Copy deno configuration files first for better caching
COPY deno.json deno.lock ./

# Copy source code
COPY src/ ./src/

# Cache dependencies
RUN deno cache --lock=deno.lock src/server.ts

# Set environment variables with default values
# These should be overridden at runtime with actual values
ENV OPENAI_API_KEY="sk-your-openai-api-key-here"
ENV FINE_TUNED_MODEL_ID="ft-your-fine-tuned-model-id-here"
ENV DISCORD_BOT_TOKEN="your-discord-bot-token-here"
ENV CHANNEL_ID="your-discord-channel-id-here"
ENV TARGET_USER="your-target-username-here"
ENV SYSTEM_PROMPT="your-system-prompt-here"

# Optional environment variables with defaults
ENV BASE_MODEL="gpt-4.1-mini-2025-04-14"
ENV MODEL_SUFFIX="chat-model"

# Expose port (if needed for health checks or webhooks)
EXPOSE 3000

# Create a non-root user for security
RUN addgroup --system --gid 1001 deno
RUN adduser --system --uid 1001 deno
USER deno

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD deno eval "console.log('Health check passed')" || exit 1

# Run the server task
CMD ["deno", "task", "server"]
