import { describe, expect, test } from "vitest";

import { formatMastery, sortTopics } from "./utils";
import type { TopicMastery } from "./types";

test("formats mastery as an integer percentage", () => {
  expect(formatMastery(61.538)).toBe("62%");
});

test("sorts topics by mastery ascending", () => {
  const items: TopicMastery[] = [
    { tag_id: 1, name: "dp", display_name: "dynamic programming", mastery: 80 },
    { tag_id: 2, name: "greedy", display_name: "greedy", mastery: 20 },
  ];
  expect(sortTopics(items)[0].name).toBe("greedy");
});
