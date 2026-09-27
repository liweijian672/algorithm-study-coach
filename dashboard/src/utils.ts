import type { TopicMastery } from "./types";

export function formatMastery(score: number): string {
  return `${Math.round(score)}%`;
}

export function sortTopics(items: TopicMastery[]): TopicMastery[] {
  return [...items].sort((a, b) => a.mastery - b.mastery);
}
