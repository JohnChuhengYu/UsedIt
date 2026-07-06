export interface PracticeSessionData {
  created_at: string;
  scene: string;
  passed: boolean;
  user_sentence: string;
}

export interface Word {
  id: number;
  text: string;
  status: string;
  definition: string;
  example?: string;
  audio_url?: string;
  phonetic?: string;
  part_of_speech?: string;
  synonyms?: string;
  antonyms?: string;
  difficulty?: string;
  etymology?: string;
  tone?: string;
  memory_aid?: string;
  collocations?: string[];
  sessions?: PracticeSessionData[];
}

export interface Judgment {
  correct: boolean;
  natural: boolean;
  passed: boolean;
  feedback: string;
  example_sentence?: string;
  meaning_reasoning?: string;
  naturalness_reasoning?: string;
  meaning_rating?: string;
  naturalness_rating?: string;
  word_status: string;
}
