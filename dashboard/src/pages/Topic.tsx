import { useEffect, useState } from "react";

import { api } from "../api";
import { EmptyState, ErrorState, Loading } from "../components/Feedback";
import type { ProblemOut, TopicMastery } from "../types";
import { formatMastery } from "../utils";

interface TopicProps {
  tagId: number;
  onSelectProblem: (problemId: number) => void;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function Topic({ tagId, onSelectProblem }: TopicProps) {
  const [topic, setTopic] = useState<TopicMastery | null>(null);
  const [recommendations, setRecommendations] = useState<ProblemOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    void Promise.all([
      api.getDiagnosis(),
      api.getTopicRecommendations(tagId),
    ])
      .then(([diagnosis, nextRecommendations]) => {
        setTopic(
          diagnosis.tag_mastery.find((item) => item.tag_id === tagId) ?? null,
        );
        setRecommendations(nextRecommendations);
      })
      .catch((reason) => setError(messageOf(reason)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [tagId]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!topic) return <EmptyState />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">{topic.display_name}</h2>
        <div className="mt-4 rounded-md bg-white p-4 shadow-sm">
          <span className="text-sm text-slate-500">
            {"\u5f53\u524d\u638c\u63e1\u5ea6"}
          </span>
          <p className="mt-1 text-2xl font-semibold">
            {formatMastery(topic.mastery)}
          </p>
        </div>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-medium text-slate-600">
          {"\u63a8\u8350\u9898\u76ee"}
        </h3>
        {recommendations.length ? (
          <ul className="divide-y divide-slate-200 rounded-md bg-white shadow-sm">
            {recommendations.map((problem) => (
              <li key={problem.id}>
                <button
                  type="button"
                  onClick={() => onSelectProblem(problem.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
                >
                  <span className="text-sm font-medium">{problem.title}</span>
                  <span className="text-xs text-slate-500">
                    {problem.difficulty}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState text={"\u6682\u65e0\u63a8\u8350\u9898\u76ee"} />
        )}
      </section>
    </div>
  );
}
