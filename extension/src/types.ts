export type Difficulty = "easy" | "medium" | "hard";

export interface ParsedProblem {
  platform: "niuke";
  source_id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  url: string;
}

export interface SolvedProblem {
  source_id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  url: string;
}

