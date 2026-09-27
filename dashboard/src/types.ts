export interface ProblemOut {
  id: number;
  platform: string;
  source_id: string;
  title: string;
  difficulty: string;
  url: string;
  description: string | null;
}

export interface RecordOut {
  id: number;
  problem_id: number;
  status: string;
  language: string;
  code: string;
  time_cost_ms: number | null;
  memory_cost_kb: number | null;
  submitted_at: string;
  event_key: string;
}

export interface TopicMastery {
  tag_id: number;
  name: string;
  display_name: string;
  mastery: number;
}

export interface Solution {
  language: string;
  code: string;
  complexity: string;
}

export interface CoachOut {
  explanation: string;
  hints: string[];
  solutions: Solution[];
}

export interface DiagnosisOut {
  tag_mastery: TopicMastery[];
  weak_tags: TopicMastery[];
  recommendations: number[];
}

