import { EventQueue, eventKey } from "./queue";
import type { SolvedProblem, SubmitEvent } from "./types";

interface ImportResult {
  imported: number;
  failed: number;
}

let events: SubmitEvent[] = [];

async function restore(): Promise<void> {
  const stored = await chrome.storage.local.get("queue");
  events = Array.isArray(stored.queue) ? stored.queue : [];
}

async function persist(items: SubmitEvent[]): Promise<void> {
  events = items;
  await chrome.storage.local.set({ queue: items });
}

const queue = new EventQueue(
  () => events,
  (items) => {
    void persist(items);
  },
);

async function backendUrl(): Promise<string> {
  const stored = await chrome.storage.local.get("backendUrl");
  return stored.backendUrl || "http://localhost:8000";
}

async function sendToBackend(event: SubmitEvent): Promise<void> {
  const baseUrl = await backendUrl();
  const problem = await fetch(`${baseUrl}/problems`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      platform: event.platform,
      source_id: event.source_id,
      title: event.title,
      difficulty: event.difficulty,
      url: event.url,
      description: null,
    }),
  }).then((response) => {
    if (!response.ok) throw new Error("problem create failed");
    return response.json();
  });

  await fetch(`${baseUrl}/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problem_id: problem.id,
      status: event.status,
      language: "cpp",
      code: event.code,
      submitted_at: event.submitted_at,
      event_key: eventKey(event, event.code, event.status, event.submitted_at),
    }),
  }).then((response) => {
    if (!response.ok) throw new Error("record create failed");
  });
}

async function importSolvedProblems(
  problems: SolvedProblem[],
): Promise<ImportResult> {
  const baseUrl = await backendUrl();
  let imported = 0;
  let failed = 0;

  for (const problem of problems) {
    try {
      const created = await fetch(`${baseUrl}/problems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "niuke",
          source_id: problem.source_id,
          title: problem.title,
          difficulty: problem.difficulty,
          url: problem.url,
          description: null,
        }),
      }).then((response) => {
        if (!response.ok) throw new Error("problem create failed");
        return response.json();
      });

      await fetch(`${baseUrl}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_id: created.id,
          status: "accepted",
          language: "cpp",
          code: "",
          time_cost_ms: null,
          memory_cost_kb: null,
          submitted_at: new Date().toISOString(),
          event_key: `import:${problem.source_id}`,
        }),
      }).then((response) => {
        if (!response.ok) throw new Error("record create failed");
      });
      imported += 1;
    } catch {
      failed += 1;
    }
  }

  return { imported, failed };
}

chrome.runtime.onMessage.addListener(
  (message, _sender, sendResponse) => {
    if (message.type === "CAPTURE" && message.event) {
      queue.push(message.event);
    }
    if (message.type === "FLUSH") {
      void queue.flush(sendToBackend);
    }
    if (message.type === "IMPORT_SOLVED" && Array.isArray(message.problems)) {
      void importSolvedProblems(message.problems)
        .then(sendResponse)
        .catch(() => sendResponse({ imported: 0, failed: message.problems.length }));
      return true;
    }
    return false;
  },
);

void restore();
