import { useEffect, useState } from "react";

import { api } from "../api";
import type { CoachOut } from "../types";
import { EmptyState, ErrorState, Loading } from "./Feedback";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function CoachPanel({ problemId }: { problemId: number }) {
  const [coach, setCoach] = useState<CoachOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    void api
      .getCoach(problemId)
      .then(setCoach)
      .catch((reason) => setError(messageOf(reason)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [problemId]);

  if (loading) return <Loading label={"\u751f\u6210\u8bb2\u89e3\u4e2d..."} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!coach) return <EmptyState />;

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-2 text-sm font-medium text-slate-600">
          {"\u8bb2\u89e3"}
        </h3>
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {coach.explanation}
        </p>
      </section>
      <section>
        <h3 className="mb-2 text-sm font-medium text-slate-600">
          {"\u63d0\u793a"}
        </h3>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
          {coach.hints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ol>
      </section>
      <section>
        <h3 className="mb-2 text-sm font-medium text-slate-600">
          {"C++ \u89e3\u6cd5"}
        </h3>
        <div className="space-y-3">
          {coach.solutions.map((solution, index) => (
            <pre
              key={`${solution.language}-${index}`}
              className="overflow-x-auto rounded-md bg-slate-900 p-4 text-xs leading-5 text-slate-100"
            >
              {solution.code}
            </pre>
          ))}
        </div>
      </section>
    </div>
  );
}
