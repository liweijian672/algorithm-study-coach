import { useEffect, useState } from "react";

import { api } from "../api";
import CoachPanel from "../components/CoachPanel";
import { EmptyState, ErrorState, Loading } from "../components/Feedback";
import type { ProblemOut } from "../types";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function Problem({ problemId }: { problemId: number }) {
  const [problem, setProblem] = useState<ProblemOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    void api
      .listProblems()
      .then((problems) => {
        setProblem(problems.find((item) => item.id === problemId) ?? null);
      })
      .catch((reason) => setError(messageOf(reason)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [problemId]);

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold">
        {problem?.title ?? "\u9898\u76ee"}
      </h2>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !problem ? (
        <EmptyState />
      ) : (
        <CoachPanel problemId={problemId} />
      )}
    </div>
  );
}
