import type { Difficulty, ParsedProblem, SolvedProblem } from "../types";

function mapDifficulty(value: string | null): Difficulty {
  const text = (value ?? "").trim().toLowerCase();
  if (["1", "easy", "简单", "入门"].includes(text)) return "easy";
  if (["3", "hard", "困难", "较难"].includes(text)) return "hard";
  return "medium";
}

function firstText(doc: Document, selectors: string[]): string {
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element?.textContent?.trim()) return element.textContent.trim();
  }
  return "";
}

function tagTexts(doc: Document): string[] {
  const texts = Array.from(
    doc.querySelectorAll(".tag, .subject-tag, .question-tag"),
  )
    .map((element) => element.textContent?.trim())
    .filter((text): text is string => Boolean(text));
  return Array.from(new Set(texts));
}

export function parseProblemPage(doc: Document): ParsedProblem | null {
  const title = firstText(doc, [".subject-title", "h1", "[class*='title']"]);
  if (!title) return null;

  const difficultyNode = doc.querySelector("[data-difficulty]");
  const difficultyText =
    difficultyNode?.getAttribute("data-difficulty") ??
    difficultyNode?.textContent?.trim() ??
    firstText(doc, [".difficulty", "[class*='difficulty']"]);
  const difficulty = mapDifficulty(difficultyText || null);

  const sourceNode = doc.querySelector(
    "[data-question-id], [data-problem-id], [data-id]",
  );
  const source_id = sourceNode?.getAttribute("data-question-id")
    ?? sourceNode?.getAttribute("data-problem-id")
    ?? sourceNode?.getAttribute("data-id")
    ?? "";
  const url = doc.querySelector("link[rel='canonical']")?.getAttribute("href")
    ?? doc.location?.href
    ?? "";

  return {
    platform: "niuke",
    source_id,
    title,
    difficulty,
    tags: tagTexts(doc),
    url,
  };
}

export function parseSolvedList(doc: Document): SolvedProblem[] {
  const listItems = Array.from(doc.querySelectorAll("li[data-question-id]"));
  const anchors = listItems.length
    ? listItems
        .map((item) => item.querySelector("a"))
        .filter((anchor): anchor is HTMLAnchorElement => anchor !== null)
    : Array.from(doc.querySelectorAll("a[href*='/practice/']"));
  const results: SolvedProblem[] = [];

  for (const anchor of anchors) {
    const parent = anchor.closest("li[data-question-id]");
    const source_id =
      parent?.getAttribute("data-question-id") ??
      anchor?.getAttribute("href")?.split("/").filter(Boolean).pop() ??
      "";
    const title = anchor?.textContent?.trim() ?? "";
    if (!source_id || !title) continue;

    results.push({
      source_id,
      title,
      difficulty: mapDifficulty(
        parent?.getAttribute("data-difficulty") ?? null,
      ),
      tags: [],
      url: anchor?.getAttribute("href") ?? "",
    });
  }

  return results;
}
