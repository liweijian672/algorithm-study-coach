import { useEffect, useState } from "react";

import { api } from "../api";
import { ErrorState, Loading } from "../components/Feedback";
import MasteryChart from "../components/MasteryChart";
import TopicList from "../components/TopicList";
import type { DiagnosisOut, ProblemOut } from "../types";

interface OverviewProps {
  onSelectTopic: (tagId: number) => void;
  onSelectProblem: (problemId: number) => void;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function Overview({
  onSelectTopic,
  onSelectProblem,
}: OverviewProps) {
  const [diagnosis, setDiagnosis] = useState<DiagnosisOut | null>(null);
  const [problems, setProblems] = useState<ProblemOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    void Promise.all([api.getDiagnosis(), api.listProblems()])
      .then(([nextDiagnosis, nextProblems]) => {
        setDiagnosis(nextDiagnosis);
        setProblems(nextProblems);
      })
      .catch((reason) => setError(messageOf(reason)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const importDemo = () => {
    setImporting(true);
    setActionError(null);
    void api
      .importDemo()
      .then(load)
      .catch((reason) => setActionError(messageOf(reason)))
      .finally(() => setImporting(false));
  };

  const problemById = new Map(problems.map((problem) => [problem.id, problem]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {"\u638c\u63e1\u5ea6\u603b\u89c8"}
        </h2>
        <button
          type="button"
          disabled={importing}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          onClick={importDemo}
        >
          {importing
            ? "\u5bfc\u5165\u4e2d..."
            : "\u5bfc\u5165\u6f14\u793a\u6570\u636e"}
        </button>
      </div>

      {actionError && <ErrorState message={actionError} onRetry={importDemo} />}

      {loading && !diagnosis ? (
        <Loading />
      ) : error && !diagnosis ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          {diagnosis && <MasteryChart topics={diagnosis.tag_mastery} />}

          <section>
            <h3 className="mb-2 text-sm font-medium text-slate-600">
              {"\u8584\u5f31\u77e5\u8bc6\u70b9"}
            </h3>
            {diagnosis?.weak_tags.length ? (
              <TopicList
                topics={diagnosis.weak_tags}
                onSelect={onSelectTopic}
              />
            ) : (
              <p className="text-sm text-slate-500">
                {"\u6682\u65e0\u8584\u5f31\u70b9"}
              </p>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-sm font-medium text-slate-600">
              {"\u63a8\u8350\u9898\u76ee"}
            </h3>
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
        </>
      )}
    </div>
  );
}
