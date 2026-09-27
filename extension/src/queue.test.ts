import { describe, expect, test } from "vitest";

import { EventQueue, eventKey } from "./queue";
import type { SubmitEvent } from "./types";

test("flushes queued events and removes them on success", async () => {
  const store: SubmitEvent[] = [];
  const queue = new EventQueue(
    () => store,
    (items) => {
      store.length = 0;
      store.push(...items);
    },
  );
  const event: SubmitEvent = {
    platform: "niuke",
    source_id: "NC1",
    title: "Two Sum",
    difficulty: "easy",
    tags: ["array"],
    url: "https://example.com/1",
    code: "int main(){}",
    status: "accepted",
    submitted_at: "2026-09-27T10:00:00",
  };
  queue.push(event);
  const sent: SubmitEvent[] = [];
  await queue.flush(async (item) => {
    sent.push(item);
  });
  expect(sent).toHaveLength(1);
  expect(store).toHaveLength(0);
});

test("eventKey is stable for the same submission", () => {
  const problem = {
    platform: "niuke" as const,
    source_id: "NC1",
    title: "Two Sum",
    difficulty: "easy" as const,
    tags: [],
    url: "https://example.com/1",
  };
  const first = eventKey(problem, "int main(){}", "accepted", "2026-09-27T10:00:00");
  const second = eventKey(problem, "int main(){}", "accepted", "2026-09-27T10:00:00");
  expect(first).toBe(second);
});
