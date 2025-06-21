import { Message, USERNAMES } from "@/lib/types.ts";
import { parseDateTime, timestampMicrosecond } from "@/lib/utils.ts";

function processLine(line: string): Message | null {
  if (line === "") {
    return null;
  }

  const message: Partial<Message> = {};

  // Handle lines with special character ‎
  if (line.includes("‎")) {
    let attachment = 0;
    
    if (line[0] === "‎") {
      attachment = 1;
      
      // Extract attachment filename
      if (line[line.length - 2] === ">") {
        let text = "";
        for (let i = line.length - 3; i > 0; i--) {
          if (line[i] === " ") break;
          text += line[i];
        }
        message.text = text.split("").reverse().join("");
        message.type = "attachment";
      }
    }

    // Extract date
    let date = "";
    for (let i = 1 + attachment; i < 21 + attachment; i++) {
      if (line[i] === "]") break;
      date += line[i];
    }
    message.time = timestampMicrosecond(parseDateTime(date));

    // Extract author
    let colonIndex = -1;
    let author = "";
    for (let i = 23 + attachment; i < line.length; i++) {
      if (line[i] === ":") {
        colonIndex = i;
        break;
      }
      author += line[i];
    }

    message.author = USERNAMES[author] || author;

    if (attachment === 0) {
      let text = "";
      let spaceIndex = -1;

      for (let i = line.length - 2; i > 0; i--) {
        if (line[i] === "‎") {
          spaceIndex = i;
          break;
        }
        text += line[i];
      }
      
      const reversedText = text.split("").reverse().join("");
      message.text = reversedText;
      message.type = "system";

      if (reversedText === "<This message was edited>") {
        message.text = line.slice(colonIndex + 2, spaceIndex - 1);
        message.type = "edited";
      }
    }

    return message as Message;
  }

  // Handle normal messages
  let date = "";
  for (let i = 1; i < 21; i++) {
    if (line[i] === "]") break;
    date += line[i];
  }
  message.time = timestampMicrosecond(parseDateTime(date));

  let colonIndex = -1;
  let author = "";
  for (let i = 23; i < line.length; i++) {
    if (line[i] === ":") {
      colonIndex = i;
      break;
    }
    author += line[i];
  }

  message.author = USERNAMES[author] || author;
  message.text = line.slice(colonIndex + 2, line.length - 1);
  message.type = "normal";

  return message as Message;
}

export function parseChat(lines: string[]): Message[] {
  const messages: Message[] = [];
  let backlog = "";

  for (const line of lines) {
    if (
      line[0] === "[" && 
      line.length >= 12 && 
      /\d/.test(line[2]) && 
      (line[11] === "," || line[10] === ",")
    ) {
      const processed = processLine(backlog);
      if (processed) {
        messages.push(processed);
      }
      backlog = line;
    } else {
      backlog += line;
    }
  }

  // Process the last message
  const lastProcessed = processLine(backlog);
  if (lastProcessed) {
    messages.push(lastProcessed);
  }

  return messages;
}