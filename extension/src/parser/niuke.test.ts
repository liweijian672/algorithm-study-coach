import { describe, expect, test } from "vitest";

import { parseProblemPage, parseSolvedList } from "./niuke";

test("parses a problem page", () => {
  const doc = new DOMParser().parseFromString(
    `<h1 class="subject-title">Two Sum</h1>
     <span class="tag">array</span><span class="tag">hash</span>
     <a data-difficulty="1">easy</a>`,
    "text/html",
  );
  const result = parseProblemPage(doc);
  expect(result).not.toBeNull();
  expect(result?.title).toBe("Two Sum");
  expect(result?.difficulty).toBe("easy");
});

test("returns null when required fields are missing", () => {
  const doc = new DOMParser().parseFromString("<div>empty</div>", "text/html");
  expect(parseProblemPage(doc)).toBeNull();
});

test("parses a solved problem list", () => {
  const doc = new DOMParser().parseFromString(
    `<ul><li data-question-id="NC1"><a href="/practice/1">Two Sum</a></li></ul>`,
    "text/html",
  );
  expect(parseSolvedList(doc)).toHaveLength(1);
  expect(parseSolvedList(doc)[0].source_id).toBe("NC1");
});
