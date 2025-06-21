export interface Message {
  text: string;
  time: number; // microseconds since epoch
  author: string;
  type: "normal" | "system" | "attachment" | "edited";
}

export interface GroupedMessage {
  messages: string[];
  firstTime: number; // microseconds since epoch of the first message in the group
  lastTime: number; // microseconds since epoch of the last message in the group
  author: string;
  type: "normal" | "edited";
}

export interface Context {
  messages: GroupedMessage[];
  firstTime: number; // microseconds since epoch of the first message in the context
  lastTime: number; // microseconds since epoch of the last message in the context
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string;
}

export interface TrainingData {
  messages: ChatMessage[];
}

export type Username = "Eray" | "Duru" | "Mert" | "Erkam" | "Ozgur" | "Baray" | "Berr" | "Umit" | "Olcay" | "Emir" | "Fatih" | "Bedirhan" | "Halit" | "Ohasanov" | "Omer" | "Sirac" | "Tunay" | "Usuyus" | "Vedat" | "Berke" | "Kutay" | "Faik";

export const USERNAMES: Record<string, Username> = {
  "cengiz eray aslan": "Eray",
  "duru ozer": "Duru",
  "mert koksal": "Mert",
  "erkam uysal": "Erkam",
  "ozgur karagul": "Ozgur",
  "baray efe rafioglu": "Baray",
  "berr": "Berr",
  "umit sevincler": "Umit",
  "Olcay Oransoy": "Olcay",
  "emir zinal": "Emir",
  "Fatih Solak": "Fatih",
  "lime": "Bedirhan",
  "halit tugra celik": "Halit",
  "omer hasanov": "Ohasanov",
  "omer habip tokuoglu": "Omer",
  "cemil sirac": "Sirac",
  "tunay kerem isman": "Tunay",
  "yusuf onur usumez": "Usuyus",
  "vedat sengun": "Vedat",
  "berke inan tol": "Berke",
  "Kutay Bozkurt": "Kutay",
  "~ duru": "Duru",
  "~ meh": "Emir",
  "Muhammet Faik Ekiciler": "Faik",
  "Mehmet Kutay Bozkurt": "Kutay",
};