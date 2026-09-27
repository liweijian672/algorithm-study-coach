import type { TopicMastery } from "../types";
import { formatMastery } from "../utils";

interface TopicListProps {
  topics: TopicMastery[];
  onSelect: (tagId: number) => void;
}

export default function TopicList({ topics, onSelect }: TopicListProps) {
  return (
    <ul className="divide-y divide-slate-200 rounded-md bg-white shadow-sm">
      {topics.map((topic) => (
        <li key={topic.tag_id}>
          <button
            type="button"
            onClick={() => onSelect(topic.tag_id)}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
          >
            <span className="text-sm font-medium">{topic.display_name}</span>
            <span className="text-sm text-slate-500">
              {formatMastery(topic.mastery)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

