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

export type Username = "Eray" | "Duru" | "Mert" | "Erkam" | "Ozgur" | "Baray" | "Berr" | "Umit" | "Olcay" | "Emir" | "Fatih" | "Bedirhan" | "Halit" | "Ohasanov" | "Omer" | "Sirac" | "Tunay" | "Usuyus" | "Vedat" | "Berke" | "Kutay" | "Faik" | "Kivanc" | "Grup" | "Abdulhamid";

export const USERNAMES: Record<string, Username> = {
  "cengiz eray aslan": "Eray",
  "duru ozer": "Duru",
  "mert koksal": "Mert",
  "erkam uysal": "Erkam",
  "erkam": "Erkam",
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
  "~ duru": "Duru",
  "~ meh": "Emir",
  "Muhammet Faik Ekiciler": "Faik",
  "Mehmet Kutay Bozkurt": "Kutay",
  "~ Kıvanç Tok": "Kivanc",
  "grup?": "Grup",
  "‪+90 551 193 68 57‬": "Abdulhamid",

  // discord usernames
  "erray": "Eray",
  "weobe": "Duru",
  "kutaja": "Kutay",
  "usuyus": "Usuyus",
  "erkam3": "Erkam",
  "dnaux": "Umit",
  "barray": "Baray",
  "ber.ry": "Berr",
  "mfaik": "Faik",
  "_sirac": "Sirac",
  "mychecksdead": "Mert",
  "lizael": "Bedirhan",
  "pr0mers": "Omer",
  "nuzunuzu": "Faik",
  "vd37": "Vedat",
  "skurrl": "Emir",
  "okaragul": "Ozgur",
};