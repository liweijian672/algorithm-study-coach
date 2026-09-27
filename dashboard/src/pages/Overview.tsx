import { useEffect, useState } from "react";

import { api } from "../api";
import MasteryChart from "../components/MasteryChart";
import TopicList from "../components/TopicList";
import type { DiagnosisOut, ProblemOut } from "../types";

interface OverviewProps {
  onSelectTopic: (tagId: number) => void;
  onSelectProblem: (problemId: number) => void;
}

export default function Overview({
  onSelectTopic,
  onSelectProblem,
}: OverviewProps) {
  const [diagnosis, setDiagnosis] = useState<DiagnosisOut | null>(null);
  const [problems, setProblems] = useState<ProblemOut[]>([]);

  const load = () => {
    void Promise.all([api.getDiagnosis(), api.listProblems()]).then(
      ([nextDiagnosis, nextProblems]) => {
        setDiagnosis(nextDiagnosis);
        setProblems(nextProblems);
      },
    );
  };

  useEffect(load, []);

  const problemById = new Map(problems.map((problem) => [problem.id, problem]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">掌握度总览</h2>
        <button
          type="button"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
          onClick={() => void api.importDemo().then(load)}
        >
          导入演示数据
        </button>
      </div>

      {diagnosis && <MasteryChart topics={diagnosis.tag_mastery} />}

      <section>
        <h3 className="mb-2 text-sm font-medium text-slate-600">薄弱知识点</h3>
        {diagnosis?.weak_tags.length ? (
          <TopicList topics={diagnosis.weak_tags} onSelect={onSelectTopic} />
        ) : (
          <p className="text-sm text-slate-500">暂无薄弱点</p>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium text-slate-600">推荐题目</h3>
        <ul className="divide-y divide-slate-200 rounded-md bg-white shadow-sm">
          {diagnosis?.recommendations.map((problemId) => {
            const problem = problemById.get(problemId);
            return (
              <li key={problemId}>
                <button
                  type="button"
                  onClick={() => onSelectProblem(problemId)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
                >
                  <span className="text-sm font-medium">
                    {problem?.title ?? problemId}
                  </span>
                  <span className="text-xs text-slate-500">
                    {problem?.difficulty ?? ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

