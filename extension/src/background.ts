import { EventQueue, eventKey } from "./queue";
import type { SubmitEvent } from "./types";

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

async function sendToBackend(event: SubmitEvent): Promise<void> {
  const { backendUrl = "http://localhost:8000" } = await chrome.storage.local.get(
    "backendUrl",
  );
  const problem = await fetch(`${backendUrl}/problems`, {
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

  await fetch(`${backendUrl}/records`, {
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
  });
}

chrome.runtime.onMessage.addListener((message: { type: string; event?: SubmitEvent }) => {
  if (message.type === "CAPTURE" && message.event) {
    queue.push(message.event);
  }
  if (message.type === "FLUSH") {
    void queue.flush(sendToBackend);
  }
});

void restore();
