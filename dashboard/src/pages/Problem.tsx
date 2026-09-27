import { useEffect, useState } from "react";

import { api } from "../api";
import CoachPanel from "../components/CoachPanel";
import type { ProblemOut } from "../types";

export default function Problem({ problemId }: { problemId: number }) {
  const [problem, setProblem] = useState<ProblemOut | null>(null);

  useEffect(() => {
    void api
      .listProblems()
      .then((problems) => {
        setProblem(problems.find((item) => item.id === problemId) ?? null);
      })
      .catch(() => setProblem(null));
  }, [problemId]);

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold">{problem?.title ?? "题目"}</h2>
      <CoachPanel problemId={problemId} />
    </div>
  );
}

