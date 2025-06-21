export interface Message {
  text: string;
  time: number; // microseconds since epoch
  author: Username;
  type: "normal" | "system" | "attachment" | "edited";
}

export interface GroupedMessage {
  messages: string[];
  firstTime: number; // microseconds since epoch of the first message in the group
  lastTime: number; // microseconds since epoch of the last message in the group
  author: Username;
  type: "normal" | "edited";
}

export interface Context {
  messages: GroupedMessage[];
  firstTime: number; // microseconds since epoch of the first message in the context
  lastTime: number; // microseconds since epoch of the last message in the context
}

export type ChatMessage = {
  role: "system";
  content: string;
} | {
  role: "assistant";
  content: string;
  name: Username;
} | {
  role: "user";
  content: string;
  name: Username;
}

export interface TrainingData {
  messages: ChatMessage[];
}

export type Username = "eray" | "duru" | "mert" | "erkam" | "ozgur" | "baray" | "berr" | "umit" | "olcay" | "emir" | "fatih" | "bedirhan" | "halit" | "ohasanov" | "omer" | "sirac" | "tunay" | "usuyus" | "vedat" | "berke" | "kutay" | "faik" | "kivanc" | "grup" | "abdulhamid";

export const USERNAMES: Record<string, Username> = {
  "cengiz eray aslan": "eray",
  "duru ozer": "duru",
  "mert koksal": "mert",
  "erkam uysal": "erkam",
  "erkam": "erkam",
  "ozgur karagul": "ozgur",
  "baray efe rafioglu": "baray",
  "berr": "berr",
  "umit sevincler": "umit",
  "Olcay Oransoy": "olcay",
  "emir zinal": "emir",
  "Fatih Solak": "fatih",
  "lime": "bedirhan",
  "halit tugra celik": "halit",
  "omer hasanov": "ohasanov",
  "omer habip tokuoglu": "omer",
  "cemil sirac": "sirac",
  "tunay kerem isman": "tunay",
  "yusuf onur usumez": "usuyus",
  "vedat sengun": "vedat",
  "berke inan tol": "berke",
  "Kutay Bozkurt": "kutay",
  "~ duru": "duru",
  "~ meh": "emir",
  "Muhammet Faik Ekiciler": "faik",
  "Mehmet Kutay Bozkurt": "kutay",
  "~ Kıvanç Tok": "kivanc",
  "grup?": "grup",
  "‪+90 551 193 68 57‬": "abdulhamid",

  // discord usernames
  "erray": "eray",
  "weobe": "duru",
  "kutaja": "kutay",
  "usuyus": "usuyus",
  "erkam3": "erkam",
  "dnaux": "umit",
  "barray": "baray",
  "ber.ry": "berr",
  "mfaik": "faik",
  "_sirac": "sirac",
  "mychecksdead": "mert",
  "lizael": "bedirhan",
  "pr0mers": "omer",
  "nuzunuzu": "faik",
  "vd37": "vedat",
  "skurrl": "emir",
  "okaragul": "ozgur",
};