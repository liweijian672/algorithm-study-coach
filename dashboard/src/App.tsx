import { useState } from "react";

import Overview from "./pages/Overview";
import Problem from "./pages/Problem";
import Topic from "./pages/Topic";

type View =
  | { name: "overview" }
  | { name: "topic"; tagId: number }
  | { name: "problem"; problemId: number };

export default function App() {
  const [view, setView] = useState<View>({ name: "overview" });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <button
          type="button"
          onClick={() => setView({ name: "overview" })}
          className="text-xl font-semibold"
        >
          算法学习教练
        </button>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        {view.name === "overview" && (
          <Overview
            onSelectTopic={(tagId) => setView({ name: "topic", tagId })}
            onSelectProblem={(problemId) => setView({ name: "problem", problemId })}
          />
        )}
        {view.name === "topic" && (
          <Topic
            tagId={view.tagId}
            onSelectProblem={(problemId) =>
              setView({ name: "problem", problemId })
            }
          />
        )}
        {view.name === "problem" && <Problem problemId={view.problemId} />}
      </main>
    </div>
  );
}
