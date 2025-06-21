# WhatsApp Chat Refactoring Scripts

This directory contains TypeScript/Deno scripts for processing WhatsApp chat exports and converting them into training data for language models.

## Overview

The scripts process WhatsApp chat exports through the following pipeline:

1. **Parse Raw Chat** (`refactor-wp.ts`) - Converts WhatsApp text export to structured JSON
2. **Group Messages** (`group-wp-chats.ts`) - Groups consecutive messages from the same author
3. **Create Training Data** (`create-train-data.ts`) - Generates training data in JSONL format
4. **Modify User Selected** (`modify-user-selected.ts`) - Creates progressive training examples
5. **Calculate Statistics** (`stats-train-data.ts`) - Analyzes the training data

## File Structure

```
refactoring/
├── types.ts              # Common type definitions and utilities
├── refactor-wp.ts         # Parse WhatsApp chat export
├── group-wp-chats.ts      # Group consecutive messages
├── create-train-data.ts   # Create training data
├── modify-user-selected.ts# Modify training examples
└── stats-train-data.ts    # Calculate statistics
```

## Usage

### Using the Runner Script

The easiest way to run the scripts is using the runner:

```bash
# Run all scripts in sequence
deno task refactor all

# Run a specific script
deno task refactor refactor  # Parse raw chat
deno task refactor group     # Group messages
deno task refactor create    # Create training data
deno task refactor modify    # Modify training data
deno task refactor stats     # Show statistics

# Show help
deno task refactor help
```

### Running Individual Scripts

You can also run scripts individually:

```bash
deno task refactor:parse   # Parse raw chat
deno task refactor:group   # Group messages
deno task refactor:create  # Create training data
deno task refactor:modify  # Modify training data
deno task refactor:stats   # Show statistics
```

## Data Flow

```
chat.txt 
    ↓ (refactor-wp.ts)
pure-wp.json 
    ↓ (group-wp-chats.ts)
grouped-wp.json 
    ↓ (create-train-data.ts)
train-data.jsonl
    ↓ (modify-user-selected.ts)
final-train-data.jsonl
```

## Input Requirements

- Place your WhatsApp chat export as `original-chats/chat.txt`
- The script expects WhatsApp's standard export format
- Ensure the `refactored-chats/` directory exists for output files

## Configuration

Key configuration constants in `types.ts`:

- `USERNAMES` - Mapping of full names to shortened usernames
- `SYSTEM_MESSAGE` - System prompt for the AI model
- Time thresholds for grouping messages

## Output Formats

- **JSON files**: Structured message data with timestamps, authors, and content
- **JSONL files**: Training data in JSON Lines format, one example per line
- Each training example includes system message, user messages, and assistant responses

## Features

- **Message Grouping**: Combines consecutive messages from the same author within time windows
- **Attachment Handling**: Processes WhatsApp attachments and special message types
- **Time Filtering**: Filters messages by date ranges
- **Mention Filtering**: Excludes conversations with @ mentions
- **Progressive Training**: Creates training examples of varying conversation lengths
- **Statistics**: Provides detailed analysis of training data characteristics

## Development

The code uses:
- **TypeScript** for type safety
- **Deno** for runtime and standard library
- **Class-based design** for better organization
- **Async/await** for file operations
- **JSON/JSONL** for data interchange
