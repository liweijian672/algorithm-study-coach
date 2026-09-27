import { describe, expect, test } from "vitest";

import { parseProblemPage, parseSolvedList } from "./niuke";

test("parses a problem page from DOM", () => {
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

test("prefers the real nowcoder pageInfo payload", () => {
  const doc = new DOMParser().parseFromString(
    `<div>ignored</div>`,
    "text/html",
  );
  const result = parseProblemPage(doc, {
    uuid: "20ef0972485e41019e39543e8e895b7f",
    questionTitle: "\u4e24\u6570\u4e4b\u548c",
    difficulty_var: "2",
  });
  expect(result?.title).toBe("\u4e24\u6570\u4e4b\u548c");
  expect(result?.difficulty).toBe("medium");
  expect(result?.source_id).toBe("20ef0972485e41019e39543e8e895b7f");
});

test("returns null when required fields are missing", () => {
  const doc = new DOMParser().parseFromString("<div>empty</div>", "text/html");
  expect(parseProblemPage(doc)).toBeNull();
});

test("finds solved rows in the nowcoder list page", () => {
  const doc = new DOMParser().parseFromString(
    `<table>
      <tr><td><a href="/practice/20ef0972485e41019e39543e8e895b7f">Two Sum</a></td><td>\u5df2\u901a\u8fc7</td></tr>
      <tr><td><a href="/practice/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa">Other</a></td><td>\u672a\u901a\u8fc7</td></tr>
    </table>`,
    "text/html",
  );
  const result = parseSolvedList(doc);
  expect(result).toHaveLength(1);
  expect(result[0].source_id).toBe("20ef0972485e41019e39543e8e895b7f");
  expect(result[0].title).toBe("Two Sum");
  expect(result[0].url).toBe(
    "https://www.nowcoder.com/practice/20ef0972485e41019e39543e8e895b7f",
  );
});
