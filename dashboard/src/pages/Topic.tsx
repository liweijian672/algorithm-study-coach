import { useEffect, useState } from "react";

import { api } from "../api";
import { EmptyState, ErrorState, Loading } from "../components/Feedback";
import type { TopicMastery } from "../types";
import { formatMastery } from "../utils";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function Topic({ tagId }: { tagId: number }) {
  const [topic, setTopic] = useState<TopicMastery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    void api
      .getDiagnosis()
      .then((diagnosis) => {
        setTopic(
          diagnosis.tag_mastery.find((item) => item.tag_id === tagId) ?? null,
        );
      })
      .catch((reason) => setError(messageOf(reason)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [tagId]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!topic) return <EmptyState />;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">{topic.display_name}</h2>
      <div className="rounded-md bg-white p-4 shadow-sm">
        <span className="text-sm text-slate-500">
          {"\u5f53\u524d\u638c\u63e1\u5ea6"}
        </span>
        <p className="mt-1 text-2xl font-semibold">
          {formatMastery(topic.mastery)}
        </p>
      </div>
    </div>
  );
}
