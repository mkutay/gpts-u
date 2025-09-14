# GPTS-U

A better version of mkutay/gpt-u written in TypeScript.

This is a Deno script that collects your WhatsApp messages, then it creates a training data file from them. After training using OpenAI's models' fine-tuning capabilities, you can deploy it onto a Discord server as a bot that can mimic yourself quite well.

The messages I've used in this project were mostly Turklish (English and Turkish mixed), which added another difficulty that needed to be overcame -- obviously, by giving more context to the AI.

You can read more about how I created this on my blog at [www.mkutay.dev/clone](https://www.mkutay.dev/posts/creating-a-clone-of-yourself).

## Deploying/Development

There are multiple scripts in the `deno.json` file that you can use to do multiple things.

```bash
deno run create-dataset # create the dataset using _chat.txt files extracted from WhatsApp
deno run train # Send the created dataset to OpenAI through their API endpoint
deno run server # Run the Discord bot
```

You might have to change some settings to your liking in `src/lib/config.ts` for the best result.

Finally, you can use the given Dockerfile to deploy the Discord bot on a server.
