import { useEffect, useState } from "react";

import { api } from "./api";
import type { ProblemOut } from "./types";

export default function App() {
  const [problems, setProblems] = useState<ProblemOut[]>([]);

  useEffect(() => {
    void api
      .listProblems()
      .then(setProblems)
      .catch(() => setProblems([]));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold">算法学习教练</h1>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <button
          type="button"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
          onClick={() => void api.importDemo().then(() => api.listProblems().then(setProblems))}
        >
          导入演示数据
        </button>
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-medium text-slate-600">题目</h2>
          <ul className="divide-y divide-slate-200 rounded-md bg-white shadow-sm">
            {problems.map((problem) => (
              <li key={problem.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-sm font-medium">{problem.title}</span>
                <span className="text-xs text-slate-500">{problem.difficulty}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
