import { useEffect, useState } from "react";

import { api } from "../api";
import type { CoachOut } from "../types";

export default function CoachPanel({ problemId }: { problemId: number }) {
  const [coach, setCoach] = useState<CoachOut | null>(null);

  useEffect(() => {
    void api.getCoach(problemId).then(setCoach).catch(() => setCoach(null));
  }, [problemId]);

  if (!coach) return <div className="text-sm text-slate-500">暂无讲解</div>;

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-2 text-sm font-medium text-slate-600">讲解</h3>
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {coach.explanation}
        </p>
      </section>
      <section>
        <h3 className="mb-2 text-sm font-medium text-slate-600">提示</h3>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
          {coach.hints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ol>
      </section>
      <section>
        <h3 className="mb-2 text-sm font-medium text-slate-600">C++ 解法</h3>
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

